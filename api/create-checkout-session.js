const STRIPE_API_BASE = 'https://api.stripe.com/v1';

const PLAN_PRICES = {
  monthly: {
    silver: dynamicRecurringPrice('Emerald Wellness Silver', 7499, 'month'),
    gold: dynamicRecurringPrice('Emerald Wellness Gold', 14999, 'month'),
    elite: dynamicRecurringPrice('Emerald Elite', 19999, 'month'),
    pro: dynamicRecurringPrice('Emerald Pro Practitioner Suite', 29999, 'month'),
    platinum: dynamicRecurringPrice('Emerald Platinum Regenesis', 59900, 'month'),
  },
  annual: {
    silver: dynamicRecurringPrice('Emerald Wellness Silver Annual', 71988, 'year'),
    gold: dynamicRecurringPrice('Emerald Wellness Gold Annual', 143988, 'year'),
    elite: dynamicRecurringPrice('Emerald Elite Annual', 191988, 'year'),
    pro: dynamicRecurringPrice('Emerald Pro Practitioner Suite Annual', 287988, 'year'),
    platinum: dynamicRecurringPrice('Emerald Platinum Regenesis Annual', 649900, 'year'),
  },
};

const ALLOWED_ADDONS = new Set(['sleep', 'cognitive', 'sexual', 'gut', 'nutrition', 'lab', 'recovery']);

function dynamicRecurringPrice(name, unitAmount, interval) {
  return {
    price_data: {
      currency: 'usd',
      unit_amount: unitAmount,
      recurring: { interval },
      product_data: { name },
    },
  };
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function appendLineItem(params, index, item) {
  if (item.price) params.append(`line_items[${index}][price]`, item.price);
  if (item.price_data) {
    params.append(`line_items[${index}][price_data][currency]`, item.price_data.currency);
    params.append(`line_items[${index}][price_data][unit_amount]`, String(item.price_data.unit_amount));
    params.append(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
    if (item.price_data.recurring?.interval) {
      params.append(`line_items[${index}][price_data][recurring][interval]`, item.price_data.recurring.interval);
    }
  }
  params.append(`line_items[${index}][quantity]`, String(item.quantity || 1));
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
    const message = data?.error?.message || 'Stripe API request failed.';
    throw new Error(message);
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const plan = String(body.plan || '').toLowerCase();
    const billing = String(body.billing || 'monthly').toLowerCase();
    const email = String(body.email || '').trim();
    const userId = String(body.userId || '');
    const addons = Array.isArray(body.addons) ? body.addons.filter((key) => ALLOWED_ADDONS.has(key)) : [];
    const referral = body.referral ? String(body.referral).trim() : '';

    const planPrice = PLAN_PRICES[billing]?.[plan];
    if (!planPrice) return json(res, 400, { error: 'Invalid plan or billing interval.' });
    if (!email || !email.includes('@')) return json(res, 400, { error: 'A valid email is required.' });

    const planLineItem = { ...planPrice, quantity: 1 };

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          unit_amount: 100,
          product_data: { name: 'Emerald Wellness 7-Day Intro' },
        },
        quantity: 1,
      },
      planLineItem,
    ];

    if (addons.length) {
      lineItems.push({
        ...dynamicRecurringPrice('Emerald Wellness Specialty Module Add-on', 4999, billing === 'annual' ? 'year' : 'month'),
        quantity: addons.length,
      });
    }

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('customer_email', email);
    params.append('success_url', `${origin}/signup.html?step=4&session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${origin}/signup.html?step=3`);
    params.append('subscription_data[trial_period_days]', '7');
    params.append('metadata[user_id]', userId);
    params.append('metadata[plan]', plan);
    params.append('metadata[billing]', billing);
    params.append('metadata[addons]', addons.join(','));
    params.append('metadata[referral]', referral);
    params.append('subscription_data[metadata][user_id]', userId);
    params.append('subscription_data[metadata][plan]', plan);
    params.append('subscription_data[metadata][billing]', billing);
    params.append('subscription_data[metadata][addons]', addons.join(','));
    params.append('subscription_data[metadata][referral]', referral);

    lineItems.forEach((item, index) => appendLineItem(params, index, item));

    if (body.referralValid) {
      params.append('discounts[0][coupon]', 'REFERRAL20');
    }

    const session = await stripePost('/checkout/sessions', params);
    return json(res, 200, { id: session.id, url: session.url });
  } catch (error) {
    console.error('[create-checkout-session]', error.message);
    return json(res, 500, { error: error.message || 'Unable to create checkout session.' });
  }
};
