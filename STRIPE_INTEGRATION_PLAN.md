# Emerald Wellness Stripe Integration Plan

## Current production pattern

- Frontend submits selected plan, billing interval, user email, Supabase user id, and selected specialty modules to `/api/create-checkout-session`.
- Backend creates a Stripe Checkout Session in `subscription` mode.
- Checkout includes:
  - One-time `$1.00` intro line item charged today.
  - Selected recurring plan price.
  - Optional specialty module add-ons at `$49.99/month` each.
  - `trial_period_days=7` so recurring billing begins after the first seven days.
- Stripe redirects back to `/signup.html?step=4&session_id=...`.
- Logged-in customers can open `/api/create-portal-session` from the Member Command Center™ to reach the Stripe-hosted Customer Portal for billing self-service.
- Stripe webhooks post to `/api/stripe-webhook`.
- Webhook verifies `Stripe-Signature` before updating Supabase profile billing fields.

## Required production environment variables

Set these in Vercel / hosting secrets, never in committed source code:

- `STRIPE_SECRET_KEY`
  - Prefer a restricted live key (`rk_live_...`) with only Checkout Session, Customer, Subscription, Product, Price, and webhook-related permissions needed by this app.
  - If using the current full live secret temporarily, rotate it after deployment.
- `STRIPE_WEBHOOK_SECRET`
  - From the Stripe webhook endpoint signing secret for `https://emeraldwellness.health/api/stripe-webhook`.
- `SUPABASE_URL`
  - `https://mczpuffmlspmghgneukz.supabase.co`
- `SUPABASE_ANON_KEY`
  - Optional public anon key used server-side to validate the logged-in user token before creating a Customer Portal session.
- `SUPABASE_SERVICE_ROLE_KEY` or existing `SUPABASE_SERVICE_KEY`
  - Service-role key for server-side profile updates only. Never expose it in browser code.

## Stripe Member Command Center™ setup

Create a webhook endpoint:

`https://emeraldwellness.health/api/stripe-webhook`

Subscribe to:

- `checkout.session.completed`
- `customer.updated`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Configure the live Stripe Customer Portal:

- Enable payment method updates.
- Enable invoice history.
- Enable cancellation.
- Enable plan changes only for the current Emerald Wellness products/prices you want customers to manage.
- Add specialty module add-ons to the portal product catalog before allowing add-on management.

## Live Stripe prices used

- Specialty module add-on: `price_1TnCp8LzsA0y5z9VkssgXhRr` — `$49.99/month`
- 3-module bundle: `price_1TnCpALzsA0y5z9V4vqXmqQh` — `$89/month`
- Referral coupon: `REFERRAL20` — `20%` off once

## Codex / MCP setup

- Stripe CLI installed: `stripe version 1.43.2`
- Stripe CLI authenticated to Emerald Wellness Health.
- Stripe MCP server configured in Codex: `https://mcp.stripe.com`
- Stripe MCP OAuth authorized with read access. Use a fresh Codex session if the Stripe MCP tools do not appear in the current tool list.

## Security notes

- Do not put `sk_live_...` or `rk_live_...` keys in HTML, JavaScript bundles, GitHub, screenshots, or chat.
- Rotate the previously exposed full live secret key after the deployment is confirmed.
- Use Stripe CLI locally with OAuth for development:

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

