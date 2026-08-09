function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function serviceConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase service credentials are not configured.');
  return { url, serviceKey };
}

const PLAN_BY_MONTHLY_AMOUNT = {
  7499: 'silver',
  14999: 'gold',
  19999: 'elite',
  29999: 'pro',
  59900: 'platinum',
  79900: 'platinum_plus',
  99900: 'concierge',
  149900: 'concierge_premium',
};

async function stripeGet(path, params = new URLSearchParams()) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const query = params.toString();
  const response = await fetch(`https://api.stripe.com/v1${path}${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

function planFromSubscription(subscription) {
  const items = subscription?.items?.data || [];
  const recurring = items
    .map((item) => item?.price)
    .filter((price) => price?.recurring?.interval === 'month' && Number.isFinite(price.unit_amount))
    .sort((a, b) => b.unit_amount - a.unit_amount);
  for (const price of recurring) {
    if (PLAN_BY_MONTHLY_AMOUNT[price.unit_amount]) return PLAN_BY_MONTHLY_AMOUNT[price.unit_amount];
  }
  return '';
}

async function resolveStripeMembership(profile) {
  const validStatuses = ['active', 'trialing', 'past_due'];
  const customerIds = new Set();
  if (profile?.stripe_customer_id) customerIds.add(profile.stripe_customer_id);

  if (profile?.email) {
    const params = new URLSearchParams();
    params.append('query', `email:'${String(profile.email).replace(/'/g, "\\'")}'`);
    params.append('limit', '100');
    const customers = await stripeGet('/customers/search', params);
    for (const customer of customers?.data || []) customerIds.add(customer.id);
  }

  const subscriptions = [];
  if (profile?.stripe_subscription_id) {
    const saved = await stripeGet(`/subscriptions/${encodeURIComponent(profile.stripe_subscription_id)}`);
    if (saved && validStatuses.includes(saved.status)) subscriptions.push(saved);
  }

  for (const customerId of customerIds) {
    const params = new URLSearchParams();
    params.append('customer', customerId);
    params.append('status', 'all');
    params.append('limit', '100');
    const list = await stripeGet('/subscriptions', params);
    for (const subscription of list?.data || []) {
      if (validStatuses.includes(subscription.status)) subscriptions.push(subscription);
    }
  }

  subscriptions.sort((a, b) => (b.created || 0) - (a.created || 0));
  const subscription = subscriptions.find((entry) => planFromSubscription(entry)) || null;
  return {
    plan: planFromSubscription(subscription),
    customerId: subscription?.customer || '',
    subscriptionId: subscription?.id || '',
    status: subscription?.status || '',
  };
}

async function updateProfileMembership(userId, membership) {
  if (!userId || !membership?.plan) return;
  await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      plan: membership.plan,
      stripe_customer_id: membership.customerId || undefined,
      stripe_subscription_id: membership.subscriptionId || undefined,
      status: membership.status || undefined,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function getUserFromBearer(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;

  const { url, serviceKey } = serviceConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

async function supabaseFetch(path, options = {}) {
  const { url, serviceKey } = serviceConfig();
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase request failed with ${response.status}`);
  return text ? JSON.parse(text) : null;
}

function pickCommandCenterState(body, userId) {
  const state = body?.state || {};
  const active = Array.isArray(state.active) ? state.active : [];
  const selected = Array.isArray(state.selected_modules) ? state.selected_modules : active;
  return {
    user_id: userId,
    plan_key: String(state.plan || body?.plan || 'gold').slice(0, 80),
    active_modules: active.map(String).slice(0, 100),
    selected_modules: selected.map(String).slice(0, 100),
    current_module_id: String(state.currentModuleId || body?.currentModuleId || '').slice(0, 120) || null,
    module_state: state,
    answers: state.answers || {},
    symptoms: state.symptoms || {},
    labs: state.labs || {},
    tasks: state.tasks || {},
    progress: state.progress || {},
    reports: Array.isArray(state.reports) ? state.reports.slice(-50) : [],
    reminders: state.reminders || { email: true, sms: false, weekly_check_in: true },
    last_check_in_at: body?.eventName === 'Command Center Check-In' ? new Date().toISOString() : undefined,
    last_saved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function getProfile(userId) {
  const rows = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,plan,status,stripe_customer_id,stripe_subscription_id`, {
    headers: { Prefer: 'return=representation' },
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function recordMarketingEvent(userId, profile, eventName, properties, sentToKlaviyo) {
  await supabaseFetch('/rest/v1/marketing_events', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: userId,
      email: profile?.email || null,
      phone: profile?.phone || null,
      event_name: eventName,
      source: 'command-center',
      properties,
      sent_to_klaviyo: Boolean(sentToKlaviyo),
    }),
  }).catch(() => null);
}

async function emitKlaviyoEvent(metricName, profile, properties = {}) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key || !profile?.email || profile.marketing_consent === false) return false;

  const response = await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${key}`,
      'Content-Type': 'application/json',
      revision: '2024-02-15',
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: metricName } } },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: profile.email,
                ...(profile.first_name ? { first_name: profile.first_name } : {}),
                ...(profile.last_name ? { last_name: profile.last_name } : {}),
                ...(profile.phone ? { phone_number: profile.phone } : {}),
              },
            },
          },
          properties,
        },
      },
    }),
  });
  return response.ok || response.status === 202;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });

  try {
    const user = await getUserFromBearer(req);
    if (!user?.id) return json(res, 401, { error: 'Please sign in to save Command Center data.' });

    if (req.method === 'GET') {
      const rows = await supabaseFetch(`/rest/v1/command_center_data?user_id=eq.${encodeURIComponent(user.id)}&select=*`, {
        headers: { Prefer: 'return=representation' },
      });
      const data = Array.isArray(rows) ? rows[0] || null : null;
      const profile = await getProfile(user.id);
      const stripeMembership = await resolveStripeMembership(profile).catch(() => ({ plan: '' }));
      const plan = stripeMembership.plan || profile?.plan || data?.plan_key || 'gold';
      if (stripeMembership.plan && (
        stripeMembership.plan !== profile?.plan ||
        stripeMembership.customerId !== profile?.stripe_customer_id ||
        stripeMembership.subscriptionId !== profile?.stripe_subscription_id
      )) {
        await updateProfileMembership(user.id, stripeMembership).catch(() => null);
      }
      return json(res, 200, {
        success: true,
        data,
        plan,
        membership_status: stripeMembership.status || profile?.status || null,
        billing_source: stripeMembership.plan ? 'stripe' : 'profile',
      });
    }

    const payload = pickCommandCenterState(req.body || {}, user.id);
    const profile = await getProfile(user.id);
    await supabaseFetch('/rest/v1/command_center_data?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(payload),
    });

    const eventName = req.body?.eventName || 'Command Center Saved';
    const eventProperties = {
      plan_key: payload.plan_key,
      active_module_count: payload.active_modules.length,
      active_modules: payload.active_modules,
      current_module_id: payload.current_module_id,
      source: req.body?.source || 'dashboard',
    };
    const sent = await emitKlaviyoEvent(eventName, profile, eventProperties).catch(() => false);
    await recordMarketingEvent(user.id, profile, eventName, eventProperties, sent);

    return json(res, 200, { success: true, klaviyo: sent });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Unable to save Command Center data.' });
  }
};
