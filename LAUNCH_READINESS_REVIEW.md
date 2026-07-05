# Emerald Wellness Launch Readiness Review

Last updated: 2026-06-30

## Implemented in code

- Stripe Checkout endpoint for the $1 intro/setup charge plus a 7-day subscription trial.
- Stripe Billing Portal endpoint for logged-in users to manage billing.
- Stripe webhook handling for checkout completion, subscription updates, cancellations, and customer email updates.
- Homepage pricing buttons route to `/signup.html` with plan and billing selections.
- App preview "Start for $1" links route to signup.
- Specialty module add-on pricing is set to $49.99/month in visible website/app copy.
- HIPAA copy was softened from blanket "HIPAA compliant" claims to BAA-available, eligibility-based wording.
- Provider-supported SEO pages are live for provider review, prescriptions, GLP-1 support, hormone wellness, peptide wellness, lab testing, provider network, and safety/compliance.
- Premium trust/conversion pages are live:
  - `/quality-provider-review`
  - `/how-it-works`
- Homepage now includes a top-of-page pathway section linking to quality standards and how the purchase/intake flow works.
- Website, app, shop landing page, provider review, prescriptions, and peptide wellness pages include safer U.S.-based licensed 503B pharmacy pathway language where appropriate.
- Peptide quality language uses careful wording: U.S.-based licensed 503B outsourcing or compounding pharmacy partners where applicable, quality testing/documentation where available, and certificates of analysis where available.
- External shop SEO script was updated in the shop builder to include provider review, 503B pathway language, quality testing, certificates of analysis where available, and safety disclaimers.

## Live verification completed

- `https://emeraldwellness.health/` returns 200 and includes the homepage pathway, `/how-it-works`, `/quality-provider-review`, and 503B language.
- `https://emeraldwellness.health/quality-provider-review` returns 200 and includes provider review, 503B, quality documentation, and safety language.
- `https://emeraldwellness.health/how-it-works` returns 200 and includes provider review, 503B, purchase pathway, and safety language.
- `https://emeraldwellness.health/sitemap.xml` returns 200 and includes the new SEO/trust pages.
- `https://shop.emeraldwellness.health/home` was browser-verified after the external shop SEO update.

## Vercel environment variables required before paid launch

Set these in Vercel Project Settings -> Environment Variables for production:

- `STRIPE_SECRET_KEY` - prefer a restricted live key (`rk_live_...`) with only required permissions.
- `STRIPE_WEBHOOK_SECRET` - from the live Stripe webhook endpoint signing secret.
- `SUPABASE_URL` - `https://mczpuffmlspmghgneukz.supabase.co`
- `SUPABASE_ANON_KEY` - optional public anon key used to verify logged-in users for the portal endpoint. The current backend also has the public anon key as a fallback.
- `SUPABASE_SERVICE_ROLE_KEY` or existing `SUPABASE_SERVICE_KEY` - server-only key for webhook/profile updates. Never expose this in browser code.

## Stripe Member Command Center™ settings still required

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
- Do not claim "HIPAA compliant" broadly unless production controls, policies, BAAs, access logs, training, breach procedures, vendor contracts, and risk analysis are actually complete.
- Avoid pixels/ads/analytics that transmit medication, lab, supplement, reproductive, condition, or other sensitive health data to ad platforms.
- Maintain a breach-response plan. The FTC Health Breach Notification Rule can apply to vendors of personal health records and related entities.

## FTC / advertising claims cautions

- Do not claim supplements, peptides, protocols, parasite/fungal programs, GLP-1 support, hormone modules, or intelligence insights diagnose, treat, cure, prevent, or guarantee outcomes.
- Keep all protocol language educational and provider-review oriented.
- Health-benefit claims need competent, reliable scientific evidence.
- Testimonials need clear disclaimers that results vary and are not guaranteed.
- Subscription pricing must clearly disclose the $1 first 7 days, the recurring price after trial, cancellation terms, and any annual commitment before checkout.

## CEO launch board

### Must confirm before accepting paid customers

- Stripe live checkout completes correctly for the $1 intro and automatically transitions to the correct recurring plan after 7 days.
- Customer Portal allows cancel, update card, change plan where allowed, view invoices, and manage add-ons.
- Webhooks update Supabase plan status correctly after purchase, renewal, cancellation, and failed payment.
- Supabase row-level security prevents one user from viewing another user's labs, medications, stacks, modules, or profile data.
- Privacy Policy and Terms match the real business model: shop, subscriptions, provider review, labs, health tracking, and communications.
- Attorney review is completed for Terms, Privacy Policy, HIPAA page, Medical Disclaimer, refund/cancellation language, and state telehealth/practitioner workflows.

### Can launch with if disclosed clearly

- App/dashboard can remain a web app preview if persistent saved profiles are not promised beyond what Supabase currently supports.
- Specialty modules can launch as guided dashboards if scoring and reports are described as wellness intelligence, not diagnosis.
- Peptide, GLP-1, hormone, and lab pathways can launch with clear provider-review and eligibility language.

### Next growth tasks after launch

- Add focused SEO pages for weight loss labs, 503B peptide pharmacy quality, women’s hormone support, men’s performance, longevity labs, supplement interaction checking, and medication stack safety.
- Build Klaviyo flows: welcome, abandoned checkout, intake started/not completed, post-purchase onboarding, lab reminder, renewal reminder, and win-back.
- Add compliant testimonials when available with results-vary disclaimers.
- Connect analytics and pixels carefully without sending sensitive health details to ad platforms.
- Create a monthly content calendar for Google, YouTube, Instagram, TikTok, Facebook, and LinkedIn.

## Remaining before public paid launch

- Add/verify all Vercel environment variables listed above.
- Configure Stripe Customer Portal live-mode settings.
- Rotate the previously exposed live Stripe secret key and replace it with a restricted key in Vercel.
- Run a real live-mode $1 checkout with a low-risk test customer, then cancel/refund if needed.
- Confirm Supabase RLS policies for all tables storing labs, medications, stacks, and module data.
- Move dashboard/app saved stacks, labs, medications, and module progress from local storage to Supabase before promising persistent private profiles.

