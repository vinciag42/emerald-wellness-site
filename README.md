# Emerald Wellness Website

## What is this?

This is the official website for **Emerald Wellness**, a health and wellness company launching a new online platform.

The website is live at **emeraldwellness.health**.

---

## What is Emerald Wellness?

Emerald Wellness is building a smart health platform for people who want to take control of their health and performance.

It brings together:

- **500+ supplements and peptides**: a large library of health products with dosing guides
- **AI Health Advisor**: personalized answers about what to take and how to stack supplements safely
- **Lab tracker**: upload blood work and track your numbers over time
- **Health protocols**: ready made plans for longevity, gut health, brain health, hormones, and more
- **For practitioners**: tools for doctors and coaches to manage their clients (with HIPAA compliance)

**In short:** It is a one stop platform for people who are serious about optimizing their health, not just reading random articles online, but following real, evidence-based protocols.

---

## What does this website do?

This project is the **marketing and signup website**, not the full app itself. It helps the business:

| What visitors can do | What happens behind the scenes |
|---------------------|-------------------------------|
| Read about the platform | See features, pricing, and testimonials |
| Join the waitlist before launch | Their name and email are saved |
| Sign up and start for $1 | They create an account and enter payment details |
| Read health articles | 8 in-depth guides in the "Intelligence Library" |
| Learn about the advisory board | Meet the doctors and experts who review content |
| Read legal policies | Privacy, terms, HIPAA, and medical disclaimer |

---

## What's inside this project?

### Root folder (live public site)

| File or folder | What it is |
|----------------|------------|
| `index.html` | **Live homepage** — "Launching soon" page with waitlist (served at `emeraldwellness.health/`) |
| `signup.html` | Sign up flow: pick a plan, create account, pay |
| `api/subscribe.js` | Server route for waitlist → Supabase + Klaviyo |
| `privacy-policy.html` / `terms-of-service.html` | Legal pages (root URLs) |
| `landing.html` / `landing_fixed.html` | Alternate marketing landing pages |

### Full marketing site: `emerald-wellness/`

| File or folder | What it is |
|----------------|------------|
| `index.html` | Full marketing homepage (features, pricing, blog previews) |
| `signup.html` | Sign up flow (subfolder copy) |
| `blog/` | Intelligence Library — 8 health articles |
| `advisors.html` | Advisory board page |
| `privacy.html` / `terms.html` | Legal pages (subfolder URLs) |
| `supabase-schema.sql` | Database setup file |
| `email-welcome-template.html` | Welcome email design |

---

## How does sign up work? (Simple version)

1. **Visitor fills out the waitlist form** → Their details are saved to an email list (Klaviyo) and a database (Supabase).

2. **Visitor goes to Sign Up** → They choose a plan (Silver, Gold, Elite, or Pro), add optional extras, and create a password.

3. **Payment** → They are sent to Stripe to enter card details and pay **$1 for the first 7 days** before the selected plan renews.

4. **Sharing links** → Users can share a personal Emerald Wellness link without an automatic referral discount.

---

## What services does the site connect to?

You do not need to understand the technical details. just know these outside tools power the site:

- **Supabase**: Stores user accounts and waitlist signups
- **Klaviyo**: Sends marketing emails to members getting started
- **Stripe**: Handles payments and subscriptions
- **Vercel**: Where the site is hosted online (planned)

Setup guides for Supabase and email are included in the `emerald-wellness/` folder.

---

## Website address

- **Domain:** emeraldwellness.health
- **GitHub repo:** github.com/vinciag42/emerald-wellness-site

---

## Who is this for?

- **Visitors**: People interested in health, biohacking, peptides, and longevity
- **Practitioners**: Doctors, coaches, and health professionals who want client management tools
- **You (setup)**: Anyone deploying or maintaining this website

---

## Quick note for setup

1. Use the files in **`emerald-wellness/`** as the main site.
2. Follow **`supabase-setup-guide.html`** to set up user accounts and the waitlist.
3. Deploy the site to **Vercel** or similar hosting and connect the domain **emeraldwellness.health**.
4. Test the waitlist form and sign-up flow before going live.

---

© 2026 Emerald Wellness LLC

