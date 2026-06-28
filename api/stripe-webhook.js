const crypto = require('crypto');

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function safeEqual(a, b) {
  const left = Buffer.from(a || '', 'utf8');
  const right = Buffer.from(b || '', 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return safeEqual(expected, signature);
}

async function updateSupabaseProfile(userId, updates) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey || !userId) return;

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

async function emitKlaviyoEvent(metricName, profile, properties = {}) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key || !profile?.email) return;

  const safeProperties = {};
  const allowed = [
    'plan',
    'billing_interval',
    'status',
    'source',
    'stripe_event',
    'stripe_customer_id',
    'stripe_subscription_id',
    'cancel_at_period_end',
    'current_period_end',
  ];

  for (const field of allowed) {
    if (properties[field] !== undefined && properties[field] !== null && properties[field] !== '') {
      safeProperties[field] = properties[field];
    }
  }

  try {
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
            metric: {
              data: {
                type: 'metric',
                attributes: { name: metricName },
              },
            },
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: profile.email,
                  ...(profile.first_name ? { first_name: profile.first_name } : {}),
                  ...(profile.last_name ? { last_name: profile.last_name } : {}),
                },
              },
            },
            properties: safeProperties,
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('[klaviyo-event]', metricName, response.status, text.slice(0, 300));
    }
  } catch (error) {
    console.warn('[klaviyo-event]', metricName, error.message);
  }
}

async function getStripeCustomerEmail(customerId) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !customerId) return null;

  try {
    const response = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return null;
    const customer = await response.json();
    return customer?.email || null;
  } catch (_) {
    return null;
  }
}

const PRICE_TO_PLAN = {
  price_1Tb97eLzsA0y5z9V1qno7S07: { plan: 'silver', billing_interval: 'monthly' },
  price_1TmoCpLzsA0y5z9VelLKqXRr: { plan: 'gold', billing_interval: 'monthly' },
  price_1Tb97ZLzsA0y5z9VlhXybXrF: { plan: 'elite', billing_interval: 'monthly' },
  price_1Tb9DpLzsA0y5z9VvXt3LCRs: { plan: 'pro', billing_interval: 'monthly' },
  price_1Td1UpLzsA0y5z9VPeq424L4: { plan: 'silver', billing_interval: 'annual' },
  price_1Tb97dLzsA0y5z9VXYyasB1x: { plan: 'gold', billing_interval: 'annual' },
  price_1Tb97dLzsA0y5z9VKWuTcpIU: { plan: 'elite', billing_interval: 'annual' },
  price_1Tb9EvLzsA0y5z9Va2CX66J0: { plan: 'pro', billing_interval: 'annual' },
};

function subscriptionPlan(subscription) {
  const priceId = subscription.items?.data?.find((item) => PRICE_TO_PLAN[item.price?.id])?.price?.id;
  return PRICE_TO_PLAN[priceId] || {};
}

async function updateSupabaseProfileByStripeCustomer(customerId, updates) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey || !customerId) return;

  const response = await fetch(`${url}/rest/v1/profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}`, {
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
    throw new Error(`Supabase customer profile update failed: ${text}`);
  }
}

async function updateProfileForStripeObject(object, updates) {
  const userId = object.metadata?.user_id;
  if (userId) return updateSupabaseProfile(userId, updates);
  return updateSupabaseProfileByStripeCustomer(object.customer || object.id, updates);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const rawBody = await readRawBody(req);
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return json(res, 400, { error: 'Invalid Stripe webhook signature.' });
  }

  try {
    const event = JSON.parse(rawBody.toString('utf8'));
    const object = event.data?.object || {};

    if (event.type === 'checkout.session.completed') {
      const userId = object.metadata?.user_id;
      const lifecycle = {
        plan: object.metadata?.plan || null,
        billing_interval: object.metadata?.billing || null,
        status: 'trial',
        source: 'stripe_checkout',
        stripe_event: event.type,
        stripe_customer_id: object.customer || null,
        stripe_subscription_id: object.subscription || null,
      };
      await updateSupabaseProfile(userId, {
        stripe_customer_id: lifecycle.stripe_customer_id,
        stripe_subscription_id: lifecycle.stripe_subscription_id,
        status: lifecycle.status,
        plan: lifecycle.plan,
        billing_interval: lifecycle.billing_interval,
        addons: object.metadata?.addons ? object.metadata.addons.split(',').filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      });
      await emitKlaviyoEvent('Trial Started', {
        email: object.customer_details?.email || object.customer_email || object.email || null,
      }, lifecycle);
    }

    if (event.type === 'customer.subscription.updated') {
      const derived = subscriptionPlan(object);
      const customerEmail = object.customer_email || object.metadata?.email || await getStripeCustomerEmail(object.customer);
      const lifecycle = {
        stripe_subscription_id: object.id || null,
        status: object.status === 'active' || object.status === 'trialing' ? 'active' : object.status,
        plan: object.metadata?.plan || derived.plan || null,
        billing_interval: object.metadata?.billing || derived.billing_interval || null,
        cancel_at_period_end: Boolean(object.cancel_at_period_end),
        current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null,
        stripe_event: event.type,
      };
      await updateProfileForStripeObject(object, {
        stripe_subscription_id: lifecycle.stripe_subscription_id,
        status: lifecycle.status,
        plan: lifecycle.plan,
        billing_interval: lifecycle.billing_interval,
        addons: object.metadata?.addons ? object.metadata.addons.split(',').filter(Boolean) : [],
        cancel_at_period_end: lifecycle.cancel_at_period_end,
        current_period_end: lifecycle.current_period_end,
        updated_at: new Date().toISOString(),
      });
      await emitKlaviyoEvent('Subscription Updated', {
        email: customerEmail,
      }, lifecycle);
    }

    if (event.type === 'customer.subscription.deleted') {
      const customerEmail = object.customer_email || object.metadata?.email || await getStripeCustomerEmail(object.customer);
      await updateProfileForStripeObject(object, {
        stripe_subscription_id: object.id || null,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      });
      await emitKlaviyoEvent('Subscription Cancelled', {
        email: customerEmail,
      }, {
        status: 'cancelled',
        stripe_event: event.type,
        stripe_subscription_id: object.id || null,
      });
    }

    if (event.type === 'customer.updated') {
      await updateSupabaseProfileByStripeCustomer(object.id, {
        email: object.email || null,
        updated_at: new Date().toISOString(),
      });
    }

    if (event.type === 'invoice.payment_failed') {
      const customerEmail = object.customer_email || await getStripeCustomerEmail(object.customer);
      await emitKlaviyoEvent('Payment Failed', {
        email: customerEmail,
      }, {
        status: 'payment_failed',
        stripe_event: event.type,
        stripe_customer_id: object.customer || null,
        stripe_subscription_id: object.subscription || null,
      });
    }

    return json(res, 200, { received: true });
  } catch (error) {
    console.error('[stripe-webhook]', error.message);
    return json(res, 500, { error: 'Webhook processing failed.' });
  }
};
