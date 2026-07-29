const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const EMERALD_SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jenB1ZmZtbHNwbWdoZ25ldWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNjczODAsImV4cCI6MjA5NTc0MzM4MH0.hs0CQOyrcIk5WhRr9OUU1fVs7V1sMcea7RYwWuTAVag';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function stripePost(path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY environment variable.');

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2026-06-24.dahlia',
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Stripe API request failed.');
  }
  return data;
}

async function stripeGet(path, params = new URLSearchParams()) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY environment variable.');

  const query = params.toString();
  const response = await fetch(`${STRIPE_API_BASE}${path}${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Stripe-Version': '2026-06-24.dahlia',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Stripe API request failed.');
  }
  return data;
}

async function getSupabaseUser(accessToken) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || EMERALD_SUPABASE_ANON;
  if (!url || !anonKey) throw new Error('Missing Supabase auth environment variables.');

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  return response.json();
}

async function getProfile(userId) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) throw new Error('Missing Supabase service environment variables.');

  const response = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,stripe_customer_id,stripe_subscription_id,plan,status`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase profile lookup failed: ${text}`);
  }

  const rows = await response.json();
  return rows?.[0] || null;
}

async function findStripeMembershipByEmail(email) {
  if (!email) return null;

  const customerParams = new URLSearchParams();
  customerParams.append('email', email);
  customerParams.append('limit', '20');
  const customers = await stripeGet('/customers', customerParams);
  const matches = Array.isArray(customers?.data) ? customers.data : [];

  for (const customer of matches) {
    const subscriptionParams = new URLSearchParams();
    subscriptionParams.append('customer', customer.id);
    subscriptionParams.append('status', 'all');
    subscriptionParams.append('limit', '1');
    const subscriptions = await stripeGet('/subscriptions', subscriptionParams);
    const subscription = subscriptions?.data?.[0] || null;
    if (subscription) return { customer, subscription };
  }

  return matches[0] ? { customer: matches[0], subscription: null } : null;
}

async function connectStripeMembership(userId, membership) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey || !userId || !membership?.customer?.id) return;

  const updates = {
    stripe_customer_id: membership.customer.id,
    updated_at: new Date().toISOString(),
  };
  if (membership.subscription?.id) {
    updates.stripe_subscription_id = membership.subscription.id;
    updates.status = membership.subscription.status || 'active';
  }

  const response = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase profile update failed: ${text}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const authorization = req.headers.authorization || '';
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!accessToken) return json(res, 401, { error: 'Please sign in before managing billing.' });

    const user = await getSupabaseUser(accessToken);
    if (!user?.id) return json(res, 401, { error: 'Your session expired. Please sign in again.' });

    const profile = await getProfile(user.id);
    let stripeCustomerId = profile?.stripe_customer_id || '';

    if (!stripeCustomerId) {
      const membership = await findStripeMembershipByEmail(user.email);
      if (membership?.customer?.id) {
        stripeCustomerId = membership.customer.id;
        await connectStripeMembership(user.id, membership);
      }
    }

    if (!stripeCustomerId) {
      return json(res, 409, {
        error: 'No Stripe membership was found for the email on this signed-in account. Confirm that checkout used the same email, or contact Member Care.',
      });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const params = new URLSearchParams();
    params.append('customer', stripeCustomerId);
    params.append('return_url', `${origin}/dashboard?billing=returned`);

    const session = await stripePost('/billing_portal/sessions', params);
    return json(res, 200, { url: session.url });
  } catch (error) {
    console.error('[create-portal-session]', error.message);
    return json(res, 500, { error: error.message || 'Unable to open Stripe customer portal.' });
  }
};
