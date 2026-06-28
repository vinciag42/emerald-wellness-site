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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
      const userId = object.metadata?.user_id;
      await updateSupabaseProfile(userId, {
        stripe_subscription_id: object.id || null,
        status: object.status === 'active' || object.status === 'trialing' ? 'active' : object.status,
        plan: object.metadata?.plan || null,
        billing_interval: object.metadata?.billing || null,
        addons: object.metadata?.addons ? object.metadata.addons.split(',').filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const userId = object.metadata?.user_id;
      await updateSupabaseProfile(userId, {
        stripe_subscription_id: object.id || null,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      });
    }

    return json(res, 200, { received: true });
  } catch (error) {
    console.error('[stripe-webhook]', error.message);
    return json(res, 500, { error: 'Webhook processing failed.' });
  }
};
