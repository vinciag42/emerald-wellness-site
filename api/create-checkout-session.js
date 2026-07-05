const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const {
  MODULE_ADD_ON_PRICE_MONTHLY,
  STRIPE_MODULE_ADD_ON_PRICE_ID,
  getModuleEntitlement,
  getBillableModuleAddOnCount,
  getModuleAddOnMonthlyTotal,
} = require('../js/module-pricing.js');

const PLAN_PRICES = {
  monthly: {
    silver: dynamicRecurringPrice('Emerald Wellness Silver', 7499, 'month'),
    gold: dynamicRecurringPrice('Emerald Wellness Gold', 14999, 'month'),
    elite: dynamicRecurringPrice('Emerald Elite', 19999, 'month'),
    pro: dynamicRecurringPrice('Emerald Pro Practitioner Suite', 29999, 'month'),
    platinum: dynamicRecurringPrice('Emerald Platinum Regenesis', 59900, 'month'),
    platinum_plus: dynamicRecurringPrice('Emerald Platinum Regenesis Plus', 79900, 'month'),
    concierge: dynamicRecurringPrice('Emerald Concierge Regenesis', 99900, 'month'),
    concierge_premium: dynamicRecurringPrice('Emerald Concierge Regenesis Premium', 149900, 'month'),
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
const FIRST_MONTH_DISCOUNT_PERCENT = 20;
const FIRST_MONTH_COUPON_ID = process.env.STRIPE_FIRST_MONTH_COUPON_ID || 'EW_FIRST_MONTH_20';

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

    const entitlement = getModuleEntitlement(plan);
    const billableModuleCount = getBillableModuleAddOnCount(plan, addons.length);
    const moduleAddOnMonthlyTotal = getModuleAddOnMonthlyTotal(plan, addons.length);
    const moduleAddOnPriceId = process.env.STRIPE_MODULE_ADD_ON_PRICE_ID || STRIPE_MODULE_ADD_ON_PRICE_ID;

    if (billableModuleCount > 0) {
      lineItems.push({
        ...(moduleAddOnPriceId
          ? { price: moduleAddOnPriceId }
          : dynamicRecurringPrice('Emerald Wellness Specialty Module Add-on', Math.round(MODULE_ADD_ON_PRICE_MONTHLY * 100), billing === 'annual' ? 'year' : 'month')),
        quantity: billableModuleCount,
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
    params.append('metadata[selected_modules]', addons.join(','));
    params.append('metadata[included_module_count]', String(entitlement.includedModules ?? 'unlimited'));
    params.append('metadata[unlimited_modules]', String(entitlement.unlimitedModules));
    params.append('metadata[billable_module_count]', String(billableModuleCount));
    params.append('metadata[module_add_on_price_monthly]', String(MODULE_ADD_ON_PRICE_MONTHLY));
    params.append('metadata[module_add_on_monthly_total]', String(moduleAddOnMonthlyTotal));
    params.append('metadata[plan_key]', plan);
    params.append('metadata[first_month_discount_percent]', String(FIRST_MONTH_DISCOUNT_PERCENT));
    params.append('metadata[first_month_discount_coupon]', FIRST_MONTH_COUPON_ID);
    params.append('metadata[first_month_discount_timing]', 'first_paid_subscription_invoice_after_trial');
    params.append('metadata[referral]', referral);
    params.append('subscription_data[metadata][user_id]', userId);
    params.append('subscription_data[metadata][plan]', plan);
    params.append('subscription_data[metadata][billing]', billing);
    params.append('subscription_data[metadata][addons]', addons.join(','));
    params.append('subscription_data[metadata][selected_modules]', addons.join(','));
    params.append('subscription_data[metadata][included_module_count]', String(entitlement.includedModules ?? 'unlimited'));
    params.append('subscription_data[metadata][unlimited_modules]', String(entitlement.unlimitedModules));
    params.append('subscription_data[metadata][billable_module_count]', String(billableModuleCount));
    params.append('subscription_data[metadata][module_add_on_price_monthly]', String(MODULE_ADD_ON_PRICE_MONTHLY));
    params.append('subscription_data[metadata][module_add_on_monthly_total]', String(moduleAddOnMonthlyTotal));
    params.append('subscription_data[metadata][plan_key]', plan);
    params.append('subscription_data[metadata][first_month_discount_percent]', String(FIRST_MONTH_DISCOUNT_PERCENT));
    params.append('subscription_data[metadata][first_month_discount_coupon]', FIRST_MONTH_COUPON_ID);
    params.append('subscription_data[metadata][first_month_discount_timing]', 'first_paid_subscription_invoice_after_trial');
    params.append('subscription_data[metadata][referral]', referral);

    lineItems.forEach((item, index) => appendLineItem(params, index, item));

    const session = await stripePost('/checkout/sessions', params);
    return json(res, 200, { id: session.id, url: session.url });
  } catch (error) {
    console.error('[create-checkout-session]', error.message);
    return json(res, 500, { error: error.message || 'Unable to create checkout session.' });
  }
};
