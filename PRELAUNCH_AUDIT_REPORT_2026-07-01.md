# Emerald Wellness Pre-Launch Audit Report

Date: July 1, 2026  
Scope: main website, app/dashboard, signup flow, Stripe-related frontend/API files, external shop at `shop.emeraldwellness.health`

## Executive summary

Emerald Wellness is close visually and strategically, but I would not call it fully launch-ready yet. The main website is the strongest part: it loads, has SEO metadata, has a sitemap, has disclaimers, and has a clear premium health-intelligence position. The app/dashboard works as a public preview, but it still reads like a preview/prototype in places. The external shop works for browsing, product detail, cart, and checkout loading, but it needs the most pre-launch cleanup: metadata gaps, missing visible disclaimers on several shop pages, brand consistency issues, empty sitemap/robots, and product copy that still points to OutfitMD patient URLs.

## What passed

- Main site URLs returned `200`:
  - `https://emeraldwellness.health`
  - `/app`
  - `/dashboard`
  - `/signup`
  - `/shop`
- External shop URLs returned `200`:
  - `https://shop.emeraldwellness.health/home`
  - `/products-list`
  - `/contact-us`
  - `/about`
  - product detail page tested: Glutathione
- Main website SEO basics are in place:
  - titles
  - meta descriptions
  - canonical URLs
  - Open Graph tags
  - JSON-LD schema on key pages
  - `robots.txt`
  - `sitemap.xml`
- No visible old slogan found in live page text:
  - “The Intelligence Layer for Human Performance” was not found in tested live pages.
- Signup flow blocks empty required information with an on-page validation message.
- Product-to-cart flow works:
  - Product detail page loads.
  - Add to cart works.
  - Cart page opens.
  - Subtotal/total displays correctly.
  - Checkout page loads.
- Stripe/API syntax checks passed:
  - `api/create-checkout-session.js`
  - `api/create-portal-session.js`
  - `api/stripe-webhook.js`
  - `api/subscribe.js`

## Must-fix before public launch

### 1. External shop SEO is incomplete

External shop metadata is not launch-grade.

Findings:

- `shop.emeraldwellness.health/products-list` has empty `<title>`.
- `shop.emeraldwellness.health/contact-us` has empty `<title>`.
- `shop.emeraldwellness.health/about` has empty `<title>`.
- Product page tested has title `Glutathione`, but no meta description.
- External shop pages tested do not expose canonical URLs.
- `https://shop.emeraldwellness.health/robots.txt` returns `200` but empty.
- `https://shop.emeraldwellness.health/sitemap.xml` returns `200` but empty.

Why it matters:

Google can crawl the main website, but the external shop is under-optimized. This weakens product/category ranking and makes the shop look unfinished to search engines.

Recommended fix:

- Add page-specific titles, descriptions, and canonical URLs for:
  - Home
  - Products list
  - About
  - Contact
  - Product details
  - Privacy Policy
  - Terms
- Generate and submit a real shop sitemap.
- Add a non-empty shop robots file referencing the shop sitemap.

### 2. External shop lacks visible medical/legal disclaimer on key pages

Rendered browser text did not show a visible disclaimer on:

- shop home
- products list
- contact page
- about page

The main Emerald website has a disclaimer, but the external shop needs its own visible short disclaimer.

Recommended footer disclaimer:

“Emerald Wellness provides wellness support, products, and tracking tools for informational purposes only. It does not diagnose, treat, cure, or replace medical care. Prescription products, where available, require review by a qualified licensed provider.”

### 3. External shop product pages still contain OutfitMD links

Tested product page includes:

- `https://patients.outfitmd.com/guides/pharmacy-tiers/`
- `https://patients.outfitmd.com/portal/`

Why it matters:

This breaks Emerald Wellness brand trust. A buyer may feel redirected into another company’s ecosystem.

Recommended fix:

- Replace with Emerald-branded pages or wording:
  - “Ask your Emerald Wellness provider-review team about tier availability.”
  - “Your care instructions and protocol details will be provided through the appropriate patient portal after provider review.”

### 4. Shop home metrics look incorrect or confusing

Rendered shop home text includes:

- `70+ 0+ High Quality Products`
- `99% 0% Satisfaction Rates`

Why it matters:

This looks like a counter animation fallback issue. It can look broken or inflated.

Recommended fix:

- Use static, believable copy until real metrics are verified:
  - “70+ wellness products”
  - “Provider-review options”
  - “Secure checkout”
  - “Lab-informed planning”

### 5. Stripe webhook plan mapping may not match current public tiers

`api/stripe-webhook.js` still maps older internal plan names:

- `silver`
- `gold`
- `elite`
- `pro`

Current business pricing has evolved around:

- Gold
- Platinum Plus
- Concierge Regenesis
- Concierge Regenesis Premium
- Emerald Platinum Regenesis
- Optional Plus
- Optional Concierge
- Specialty modules / add-ons

Why it matters:

If a live customer checks out under a new price ID but the webhook maps them to an old plan, account access rules and billing status can be wrong.

Recommended fix:

- Audit every active Stripe price ID.
- Update webhook mapping to current tier names.
- Run test checkout + webhook event replay before launch.

## High-priority improvements

### 6. Dashboard still reads like a preview/admin prototype

The dashboard includes terms such as:

- “Free — preview only”
- “Admin Builder”
- “Coming Soon”
- “Purchase Extra Module”

Some of this may be intended for internal/admin use, but it should not feel unfinished to customers.

Recommended fix:

- Separate customer dashboard from admin module builder.
- Hide or rename “Coming Soon” modules unless intentionally marketing future features.
- Replace “Free — preview only” with customer-facing language such as “Preview access.”

### 7. Main website still has internal waitlist code and archived old files

Live text did not show waitlist language visually, but the codebase still contains:

- `coming-soon 61126.html`
- old `landing.html` / `landing_fixed.html`
- waitlist overlay code in `index.html`
- older nested `emerald-wellness/` copy with outdated language

Why it matters:

These may not all be public, but they create risk of accidentally deploying old waitlist/founder/coming-soon language again.

Recommended fix:

- Archive old pages outside the deployed public root or rename into `/archive`.
- Remove dead waitlist modal code from the live homepage if no longer used.
- Keep only current launch pages in the public route set.

### 8. Signup page validation works, but HTML required attributes are missing

The signup page correctly shows “Please enter your first and last name” when Continue is clicked empty. However, input fields are not marked as HTML `required`.

Recommended fix:

- Keep JavaScript validation.
- Add native `required` attributes for accessibility and browser-level support.

### 9. Checkout page fields show required labels but no native required attributes

External shop checkout displays required fields with asterisks, but the HTML fields did not show native `required=true`.

Recommended fix:

- Complete one full test purchase in Stripe/test mode or a controlled low-dollar live test.
- Confirm checkout blocks missing:
  - email
  - full name
  - phone
  - address
  - country
  - city
  - ZIP

## Usability findings

### Main website

Strengths:

- Premium brand feel.
- Clear health-intelligence positioning.
- Strong “body is smarter than any device” hero.
- Good connection between labs, medications, supplements, peptides, and provider-review questions.
- CTA “Start for $1” is clear.

Concerns:

- Homepage is content-rich and can feel dense.
- Several CTA styles compete for attention.
- “Start 7-Day Pro Trial” still appears in one CTA and should be reconciled with the approved “$1 for first 7 days” language.
- “Begin Your Regenesis” is strong, but should be reserved for premium Regenesis tiers.

### App/dashboard

Strengths:

- Communicates stack check, database, labs, protocols, and specialty modules.
- Medication & Stack Check is present.
- Specialty module engine is visible.

Concerns:

- It still reads like a preview.
- Dashboard/admin language should be reduced for customers.
- Dashboard page lacks the same strong visible medical disclaimer signal as the main pages.

### External shop

Strengths:

- Product list loads with 80 products.
- Product detail pages load.
- Add to cart works.
- Cart works.
- Checkout loads.
- Visual direction is improving.

Concerns:

- Shop header logo is still too large/squeezed for the header space.
- Home hero headline “This is where / Results begin” is visually memorable, but the page needs clearer first-line clarity on exactly what the shop offers.
- Product pages need Emerald-specific education and safety copy.
- Contact page has no H1.
- About page is good and simple, but should include a visible disclaimer near the bottom.
- External shop SEO is not launch-grade yet.

## Spelling / grammar / wording observations

No obvious live spelling mistakes were detected in the tested public pages using the targeted typo scan. However, several wording items should be improved:

- “All Prescribed GLP-1s Are FDA Regulated And Sourced From 503A Pharmacies. Peptides Are Sourced From US Licensed Manufacturers.”
  - Better: “Prescribed GLP-1 options are sourced through licensed pharmacies where appropriate. Peptide products are sourced from U.S.-licensed manufacturers and/or qualified pharmacy partners, depending on product type and provider review.”
- “High Quality Products”
  - Better: “Quality-focused products”
- “Satisfaction Rates”
  - Avoid unless verified and documented.
- “This product requires a doctor's consultation.”
  - Better: “This product may require review by a qualified licensed provider.”
- “Estimated duration is based on dosing protocol, please check patient portal and double check your protocol.”
  - Better: “Estimated duration depends on your provider-reviewed protocol. Please confirm instructions in your patient portal before use.”

## Legal/compliance review notes

This is not legal advice, but launch risk areas are:

- Avoid promises of results.
- Avoid implying peptides diagnose, treat, cure, or prevent disease.
- Use “provider review where required” instead of broad “doctor consultation” if not every product requires a physician visit.
- Avoid unverified “satisfaction rate” claims.
- Be precise with 503A vs 503B language:
  - 503A and 503B are different regulatory categories.
  - Do not claim all peptides are from 503B if some are from manufacturers or 503A partners.
- If real labs and medical review are included in paid tiers, terms should clearly say what is included, what is optional, and what may require separate provider approval.

## Launch-readiness score

- Main website: 8.5 / 10
- App/dashboard preview: 7.5 / 10
- Signup flow: 8 / 10
- External shop: 6.5 / 10
- SEO readiness overall: 7 / 10
- Compliance readiness: 7 / 10
- Purchase path: 8 / 10 for cart/checkout loading, pending full test purchase/webhook verification

Overall launch readiness: 7.5 / 10

## Recommended launch order

1. Fix external shop SEO metadata, sitemap, and robots.
2. Add visible shop disclaimers.
3. Remove OutfitMD product links or replace with Emerald-branded portal language.
4. Fix shop metrics/counter display.
5. Audit Stripe price IDs and webhook plan mapping.
6. Run a controlled checkout test.
7. Clean old/dead launch files and old waitlist/coming-soon artifacts.
8. Separate customer dashboard from admin builder language.
9. Submit updated sitemaps to Google Search Console and Bing Webmaster Tools.

