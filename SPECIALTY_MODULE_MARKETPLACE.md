# Emerald Wellness Specialty Module Marketplace

Implemented surfaces:

- Public marketplace: `/specialty-modules`
- Member dashboard marketplace: `/dashboard`
- Mobile-ready app links: `/app`
- Shared frontend module data: `/js/specialty-modules-data.js`
- Supabase schema and seed data: `/emerald-wellness/specialty-modules-schema.sql`

Expanded launch architecture:

- 96 total specialty modules seeded.
- 10 strategic module categories.
- 15 active launch modules.
- 81 coming-soon modules for long-term 75-100 module scaling.
- Allergy, autoimmune wellness, environmental toxin awareness, mold exposure education, and heavy metal awareness modules are included.
- Smart recommendation rules support symptoms/goals including fatigue + brain fog + sleep, allergies, mold exposure, toxin exposure, menopause, blood sugar/weight, inflammation/joint discomfort, and stress/burnout.

Stripe live prices configured:

- `STRIPE_EXTRA_MODULE_PRICE_ID`: `price_1TnCp8LzsA0y5z9VkssgXhRr` for the $49.99/month extra module add-on
- `STRIPE_THREE_MODULE_BUNDLE_PRICE_ID`: `price_1TnCpALzsA0y5z9V4vqXmqQh` for the $89/month 3-module bundle

Safety language:

Emerald Wellness provides educational wellness intelligence and tracking tools. It does not diagnose, treat, cure, or replace medical care. Always consult a qualified healthcare provider.

Notes:

- Free users preview only.
- Gold includes 1 active module.
- Platinum Plus includes 3 active modules.
- Concierge Regenesis and Concierge Regenesis Premium include unlimited modules.
- The current static preview saves member interactions to browser storage until authenticated Supabase writes are connected.
