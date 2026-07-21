# Emerald Wellness lists and segments

All definitions are dashboard build instructions. Keep every flow and campaign in draft. Never add unknown-consent profiles to promotional SMS.

## Lists

Create: Emerald Wellness Newsletter (`KLAVIYO_MAIN_LIST_ID`), Emerald Wellness SMS Subscribers (`KLAVIYO_SMS_LIST_ID`), Emerald Wellness Members (`KLAVIYO_MEMBERS_LIST_ID`), Emerald Wellness Concierge (`KLAVIYO_CONCIERGE_LIST_ID`), Emerald Wellness Customers, and Emerald Wellness Test Profiles. Enable double opt-in for newly captured email and SMS consent unless legal approves another configuration. Test Profiles must contain only `KLAVIYO_TEST_EMAIL` and `KLAVIYO_TEST_PHONE`.

## Segment definitions

| Segment | Dashboard definition |
|---|---|
| Engaged Email 30/60/90 Days | Can receive email AND opened or clicked email at least once in the last 30/60/90 days; exclude internal tests |
| SMS Consented | Can receive SMS AND `sms_consent_status = subscribed` AND evidence reference is set |
| SMS Consent Unknown | Phone exists AND SMS status is blank or unknown; exclude from all SMS sends |
| Email Consented | Can receive email AND `email_consent_status = subscribed` |
| Email Consent Unknown | Email exists AND email status is blank or unknown; exclude from promotional sends |
| New Leads | `lifecycle_stage = lead` AND Lead Captured in last 30 days |
| First-Time / Repeat Customers | `order_count = 1` / `order_count >= 2` |
| Active / Cancelled Members | `member_status = active` / `member_status = cancelled` |
| Concierge Prospects | `concierge_interest = true` AND not active Concierge member |
| VIP Members | `vip_status = true` OR configurable VIP thresholds are met |
| Goal interests | `goal_category` equals each approved goal category |
| No Purchase 60/90 Days | Placed Order zero times in last 60/90 days AND at least once over all time |
| No Engagement 90 Days | Opened Email zero AND Clicked Email zero AND Active on Site zero in last 90 days |
| High Intent No Purchase | Started Checkout or Membership Viewed in last 14 days AND Placed Order zero since |
| Suppression Review | Is suppressed for email OR SMS; internal review only, never a sending audience |
| Internal Test Profiles | Email equals `KLAVIYO_TEST_EMAIL` OR phone equals `KLAVIYO_TEST_PHONE` |

Create the remaining named goal segments using exact equality: Healthy Weight, Energy and Vitality, Healthy Aging, Fitness and Recovery, Hair Skin and Nails, Women’s Wellness, and Men’s Wellness. Klaviyo does not provide a stable API for safely defining all segment conditions; create and peer-review these in the dashboard.
