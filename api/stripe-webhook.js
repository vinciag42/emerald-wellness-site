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

const PRICE_TO_PLAN = {
  price_1Tb97eLzsA0y5z9V1qno7S07: { plan: 'silver', billing_interval: 'monthly' },
  price_1Tb97gLzsA0y5z9VwduDs3O1: { plan: 'gold', billing_interval: 'monthly' },
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
      await updateSupabaseProfile(userId, {
        stripe_customer_id: object.customer || null,
        stripe_subscription_id: object.subscription || null,
        status: 'trial',
        plan: object.metadata?.plan || null,
        billing_interval: object.metadata?.billing || null,
        addons: object.metadata?.addons ? object.metadata.addons.split(',').filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      });
    }

    if (event.type === 'customer.subscription.updated') {
      const derived = subscriptionPlan(object);
      await updateProfileForStripeObject(object, {
        stripe_subscription_id: object.id || null,
        status: object.status === 'active' || object.status === 'trialing' ? 'active' : object.status,
        plan: object.metadata?.plan || derived.plan || null,
        billing_interval: object.metadata?.billing || derived.billing_interval || null,
        addons: object.metadata?.addons ? object.metadata.addons.split(',').filter(Boolean) : [],
        cancel_at_period_end: Boolean(object.cancel_at_period_end),
        current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      await updateProfileForStripeObject(object, {
        stripe_subscription_id: object.id || null,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      });
    }

    if (event.type === 'customer.updated') {
      await updateSupabaseProfileByStripeCustomer(object.id, {
        email: object.email || null,
        updated_at: new Date().toISOString(),
      });
    }

    return json(res, 200, { received: true });
  } catch (error) {
    console.error('[stripe-webhook]', error.message);
    return json(res, 500, { error: 'Webhook processing failed.' });
  }
};
