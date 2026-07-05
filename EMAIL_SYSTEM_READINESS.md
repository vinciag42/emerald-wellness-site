# Emerald Wellness Email System Readiness

Status: audit started before live test email.

## Current email paths

### Homepage enrollment modal

Status: connected in code.

Flow:

1. Visitor enters name and email in the homepage enrollment modal.
2. `index.html` submits to `/api/subscribe`.
3. `/api/subscribe` sends the consented profile to Klaviyo.
4. `/api/subscribe` saves the lead to Supabase `waitlist`.

Required Vercel environment variables:

- `KLAVIYO_PRIVATE_KEY`
- Optional: `KLAVIYO_LIST_ID`
- `SUPABASE_URL`
- Optional: `SUPABASE_ANON_KEY`

Current fallback Klaviyo list ID in code:

- `XEEg3P`

### Main signup / checkout page

Status: connected for lead capture before checkout.

Flow:

1. Visitor creates account in `signup.html`.
2. Supabase user/profile is created.
3. `signup.html` submits safe marketing fields to `/api/subscribe`.
4. `/api/subscribe` sends the profile to Klaviyo and stores the lead in Supabase.
5. Visitor is sent to Stripe Checkout through `/api/create-checkout-session`.

### Stripe payment lifecycle

Status: Supabase connected and Klaviyo lifecycle events added.

Current webhook events handled:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`

Recommended Klaviyo events to add:

- `Trial Started`: added from `checkout.session.completed`
- `Subscription Updated`: added from `customer.subscription.updated`
- `Subscription Cancelled`: added from `customer.subscription.deleted`
- `Payment Failed`: added from `invoice.payment_failed`

Optional future event:

- `Started Checkout`, if a separate event is desired before Stripe payment completion.

## Safety rules for Klaviyo

Do not send:

- Lab values
- Medication names
- Symptom details
- Diagnoses
- Provider notes
- Uploaded files
- Sensitive health information

Safe fields:

- Email
- First name
- Selected plan
- Billing interval
- Signup source
- UTM source / medium / campaign / content
- Non-sensitive interest category
- Lifecycle status

## Live test needed

To prove email is working end-to-end, run one approved test using an email inbox the founder controls.

Test steps:

1. Submit test lead to homepage enrollment.
2. Confirm `/api/subscribe` returns success.
3. Confirm Klaviyo profile appears in the correct list.
4. Confirm Supabase waitlist row appears.
5. Confirm welcome email sends from Klaviyo, if a Klaviyo welcome flow is active.
6. If no welcome email arrives, check Klaviyo flow trigger/status.

## Launch blockers

- Need one real test email submission.
- Need to confirm Klaviyo welcome flow is active, not just profile capture.
- Need Stripe webhook events tested using one real Stripe checkout or Stripe CLI replay.
- Need sending domain authentication confirmed in Klaviyo for deliverability.

## CEO recommendation

Before launch, Emerald Wellness should use Klaviyo for marketing and lifecycle education, but never as a place to store private health details.

Minimum launch email automations:

1. Lead welcome after homepage enrollment.
2. $1 trial started after checkout.
3. Day 3 trial education email.
4. Day 6 trial reminder before full billing.
5. Paid member welcome.
6. Payment failed.
7. Subscription cancelled.
8. Concierge inquiry follow-up.

