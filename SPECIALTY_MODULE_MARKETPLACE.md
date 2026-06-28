# Emerald Wellness Specialty Module Marketplace

Implemented surfaces:

- Public marketplace: `/specialty-modules`
- Member dashboard marketplace: `/dashboard`
- Mobile-ready app links: `/app`
- Shared frontend module data: `/js/specialty-modules-data.js`
- Supabase schema and seed data: `/emerald-wellness/specialty-modules-schema.sql`

Stripe placeholders to configure before live paid add-ons:

- `STRIPE_EXTRA_MODULE_PRICE_ID` for the $35/month extra module add-on
- `STRIPE_THREE_MODULE_BUNDLE_PRICE_ID` for the $89/month 3-module bundle

Safety language:

Emerald Wellness provides educational wellness intelligence and tracking tools. It does not diagnose, treat, cure, or replace medical care. Always consult a qualified healthcare provider.

Notes:

- Free users preview only.
- Gold includes 1 active module.
- Platinum Plus includes 3 active modules.
- Concierge Regenesis and Concierge Regenesis Premium include unlimited modules.
- The current static preview saves member interactions to browser storage until authenticated Supabase writes are connected.
