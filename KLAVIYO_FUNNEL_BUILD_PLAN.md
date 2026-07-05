# Emerald Wellness Klaviyo Funnel Build Plan

Status: Build-ready draft. Do not turn any flow Live until Vincia approves final activation.

## Global sender settings

- Sender name: Emerald Wellness
- Recommended sender email: info@emeraldwellness.health
- SMS tone: luxury concierge-style, brief, compliant
- Pricing rule: keep exact pricing on checkout/pricing pages, not in nurture emails
- Legal rule: do not diagnose, treat, cure, promise results, or replace medical care

## Flow build order

1. Signup Welcome
2. Trial Conversion
3. Abandoned Signup
4. Post-Consultation
5. Lab Reminders
6. Upgrade Nudge
7. Re-Engagement
8. Newsletter Campaign
9. Shop Cart + Post-Purchase

## Flow details

### 1. Signup Welcome

Trigger metric: `Signup`

Timing:
- Email: immediate
- SMS: immediate only if SMS consent is true and Klaviyo SMS is approved

Filters:
- Email consent exists
- Suppress unsubscribed profiles
- Exclude test/internal profiles if needed

### 2. Trial Conversion

Trigger metric: `Trial Started`

Timing:
- Day 1 email
- Day 3 email
- Day 5 email
- Day 6 email
- SMS Day 1 and Day 6 only if SMS consent exists

Filters:
- Still in trial
- Has not canceled
- Has not upgraded/converted early where applicable

### 3. Abandoned Signup

Trigger metric: `Started Signup`

Timing:
- 1 hour email
- 24 hour email
- 72 hour email
- 2 hour SMS if SMS consent exists

Filters:
- Has not completed signup
- Has not started checkout successfully
- Suppress unsubscribed profiles

### 4. Post-Consultation

Trigger metric: `Provider Review Completed`

Timing:
- 48 hour email
- 7 day email
- 48 hour SMS if SMS consent exists

Filters:
- Must have provider/doctor review completed
- Do not send to people who only browsed or purchased non-provider products

### 5. Lab Reminders

Trigger metric or profile property:
- `Lab Tracking Enabled`
- `Lab Reminder Due`
- `Last Lab Date`

Timing:
- 14 days before quarterly window
- Due day
- 7 days after
- SMS on due day only if SMS consent exists

Audience:
- Everyone who has labs, a lab-tracking path, or lab reminders enabled

### 6. Upgrade Nudge

Trigger:
- Member active 30/60/90 days
- Module limit reached
- Plan comparison viewed

Timing:
- Day 30
- Day 60
- Day 90
- SMS Day 30 only if SMS consent exists

Filters:
- Exclude members already on highest eligible tier
- Exclude canceled/subscription failed users

### 7. Re-Engagement

Trigger:
- No dashboard activity or email open/activity for 30 days

Timing:
- 30 days inactive
- 45 days inactive
- 60 days inactive
- SMS at 45 days only if SMS consent exists

Filters:
- Exclude unsubscribed
- Exclude canceled if the message is membership-specific

### 8. Newsletter

Type:
- Monthly campaign, not always-on flow

Audience:
- Consented subscribers and members

Rules:
- Keep educational and wellness-intelligence focused
- Include one clear CTA
- No medical promises

### 9. Shop Cart + Post-Purchase

Trigger:
- External shop cart started
- External shop order placed

Timing:
- Abandoned cart: 1 hour, 24 hours, 72 hours
- Post-purchase: immediate, day 7, day 21
- SMS cart 2 hours and post-purchase day 7 only if SMS consent exists

Sender:
- Emerald Wellness

Notes:
- Mention product details and provider requirements.
- Do not add discounts unless Vincia approves. FIRST20 is shop-only if used.

## Required Klaviyo events/properties

Events:
- `Signup`
- `Trial Started`
- `Trial Day 6`
- `Started Signup`
- `Provider Review Completed`
- `Lab Tracking Enabled`
- `Lab Reminder Due`
- `Upgrade Nudge`
- `Shop Cart`
- `Shop Purchase`

Profile properties:
- `plan_tier`
- `trial_started_at`
- `trial_ends_at`
- `membership_status`
- `sms_consent`
- `email_consent`
- `module_count`
- `lab_tracking_enabled`
- `last_lab_date`
- `provider_review_completed`
- `shop_customer`

## Activation checklist

- [ ] Confirm sender email.
- [ ] Paste approved email/SMS copy from Command Center or `marketing-funnel-library.js`.
- [ ] Keep each flow in Manual/Draft first.
- [ ] Send test email to Vincia.
- [ ] Send test SMS only after Klaviyo SMS approval.
- [ ] Confirm unsubscribe link and STOP language.
- [ ] Confirm profile filters prevent wrong sends.
- [ ] Approve final activation.
- [ ] Turn Live one flow at a time.

