# Emerald Wellness Launch Readiness Review

Last updated: 2026-06-28

## Implemented in code

- Stripe Checkout endpoint for the $1 intro/setup charge plus a 7-day subscription trial.
- Stripe Billing Portal endpoint for logged-in users to manage billing.
- Stripe webhook handling for checkout completion, subscription updates, cancellations, and customer email updates.
- Homepage pricing buttons route to `/signup.html` with plan and billing selections.
- App preview “Start for $1” links route to signup.
- Specialty module add-on pricing is set to $49.99/month in visible website/app copy.
- HIPAA copy was softened from blanket “HIPAA compliant” claims to BAA-available, eligibility-based wording.

## Vercel environment variables required before paid launch

Set these in Vercel Project Settings → Environment Variables for production:

- `STRIPE_SECRET_KEY` — prefer a restricted live key (`rk_live_...`) with only required permissions.
- `STRIPE_WEBHOOK_SECRET` — from the live Stripe webhook endpoint signing secret.
- `SUPABASE_URL` — `https://mczpuffmlspmghgneukz.supabase.co`
- `SUPABASE_ANON_KEY` — optional public anon key used to verify logged-in users for the portal endpoint. The current backend also has the public anon key as a fallback.
- `SUPABASE_SERVICE_ROLE_KEY` or existing `SUPABASE_SERVICE_KEY` — server-only key for webhook/profile updates. Never expose this in browser code.

## Stripe Dashboard settings still required

- Configure the live Stripe Customer Portal.
- Enable payment method update.
- Enable invoice history.
- Enable cancellation.
- Enable subscription updates/change plan only for products customers may switch between.
- Add current plans and specialty module add-ons to the portal product catalog.
- Confirm business name, support email, statement descriptor, tax settings, and receipts.

## HIPAA / health privacy launch cautions

This is not legal advice. Have a healthcare/privacy attorney review before storing PHI or launching practitioner workflows.

- HIPAA applies to covered entities and business associates. A BAA should be signed before any covered provider stores PHI.
- Individual consumer health tracking may fall outside HIPAA, but can still trigger FTC/state privacy obligations.
- Do not claim “HIPAA compliant” broadly unless production controls, policies, BAAs, access logs, training, breach procedures, vendor contracts, and risk analysis are actually complete.
- Avoid pixels/ads/analytics that transmit medication, lab, supplement, reproductive, condition, or other sensitive health data to ad platforms.
- Maintain a breach-response plan. The FTC Health Breach Notification Rule can apply to vendors of personal health records and related entities.

## FTC / advertising claims cautions

- Do not claim supplements, peptides, protocols, parasite/fungal programs, GLP-1 support, hormone modules, or AI insights diagnose, treat, cure, prevent, or guarantee outcomes.
- Keep all protocol language educational and provider-review oriented.
- Health-benefit claims need competent, reliable scientific evidence.
- Testimonials need clear disclaimers that results vary and are not guaranteed.
- Subscription pricing must clearly disclose the $1 first 7 days, the recurring price after trial, cancellation terms, and any annual commitment before checkout.

## Remaining before public paid launch

- Add Vercel environment variables listed above.
- Configure Stripe Customer Portal live-mode settings.
- Rotate the previously exposed live Stripe secret key and replace it with a restricted key in Vercel.
- Run a real live-mode $1 checkout with a low-risk test customer, then cancel/refund if needed.
- Confirm Supabase RLS policies for all tables storing labs, medications, stacks, and module data.
- Move dashboard/app saved stacks, labs, medications, and module progress from local storage to Supabase before promising persistent private profiles.
- Attorney review of Terms, Privacy Policy, HIPAA page, Medical Disclaimer, refund/cancellation language, and state telehealth/practitioner workflows.
