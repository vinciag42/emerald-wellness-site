# Emerald Wellness Klaviyo 7.0

Draft-only technical foundation for consent-aware email/SMS lifecycle marketing. Nothing in this project schedules a campaign, activates a flow, uploads contacts, or deploys code.

## 1. Architecture

Browser modules use only the public company ID and send non-sensitive events. `api/klaviyo/events.js` validates, rate-limits, origin-checks, deduplicates, and forwards events server-side. `lib/klaviyo-client.js` owns private API access, retry/backoff, pagination, profile allowlisting, consent gates, and dry-run behavior. Local scripts clean contacts and generate reporting artifacts. Supabase stores administrative campaign approvals only.

## 2. Environment configuration

Copy `.env.example` into the local/Vercel environment UI; never commit it. `KLAVIYO_DRY_RUN=true` and `KLAVIYO_ALLOW_SCHEDULING=false` are mandatory defaults. The private key is server-only. `KLAVIYO_API_REVISION=2026-07-15` uses the current stable revision. The 2026 campaigns beta requires `2026-07-15.pre`; this implementation deliberately uses the stable draft campaign interface and implements no send/schedule endpoint.

## 3. Private API key permissions

Grant least privilege: `profiles:read/write`, `lists:read/write`, `subscriptions:write`, `events:write`, `metrics:read`, `segments:read`, `flows:read`, `campaigns:read/write`, and reporting read scopes if weekly report queries are enabled. Do not grant template or campaign scheduling permissions unless a separately reviewed need exists. Rotate keys after suspected exposure.

## 4. Public Klaviyo ID installation

Add before `</body>`: `<script src="/config/marketing-consent.js"></script><script src="/public/js/klaviyo-consent.js"></script><script src="/public/js/klaviyo-tracking.js" data-company-id="PUBLIC_COMPANY_ID"></script>`. The public ID is not the private API key.

## 5. Website tracking

Call `EmeraldKlaviyo.identifyKnownVisitor({email})` only after the visitor supplies a valid identifier. Call the named tracking helpers with product/plan IDs, value/currency, source page, and UTM fields. Quiz input must be mapped to an approved broad category; never send answers, diagnoses, medication, lab, genetic, or treatment details.

The membership signup page loads the centralized disclosure component and submits an opaque form submission ID, disclosure version, page source, and timestamp. Other lead forms that do not present explicit marketing checkboxes remain leads with unknown consent and are not subscribed.

## 6. Contact CSV preparation

Place the source at `data/contacts-source.csv` locally. First run `node scripts/klaviyo/prepare-contact-import.js --sample --dry-run`, inspect counts, then `node scripts/klaviyo/prepare-contact-import.js --dry-run`, and only after review run without `--dry-run` to write files. The utility never uploads. Carrier/line type is not asserted without a carrier service. CSVs and reports are gitignored.

## 7. Consent handling

Email and SMS use separate controls. SMS is unchecked by default and requires status, timestamp, source, disclosure/evidence reference, and E.164 phone. A phone number alone is never consent. The disclosure is centralized in `config/marketing-consent.js` and remains marked **DRAFT—LEGAL REVIEW**. Suppressed, revoked, opted-out, and unknown-consent profiles are excluded from promotions.

## 8. Lists and segments

Use `docs/klaviyo/lists-and-segments.md`. Build complex segment definitions in the dashboard because a safely supported definition-creation API is not available for every condition. Peer-review exclusions.

## 9. Flow setup and exact dashboard procedure

For each file in `docs/klaviyo/flows`, repeat these steps:

1. In Klaviyo, open **Flows → Create flow → Build your own** and enter the exact `EW7 — …` name.
2. Choose the metric/list trigger stated in the file; add every trigger filter, profile filter, and exclusion verbatim.
3. Add time delays and conditional splits in the stated order. Configure re-entry and Smart Sending/frequency caps.
4. Add each Email or SMS action. Paste its subject, preview, full copy, CTA, and UTM values. Preserve consent split and dynamic fallback text.
5. Set every action to **Draft** or **Manual**. Never choose Live. For SMS, use only the SMS Consented segment and keep the flow Draft until number registration and legal review are approved.
6. Add exit criteria using trigger/profile filters where supported; add flow filters for Placed Order, suppression, cancellation, or conversion as specified.
7. Run Preview with only `KLAVIYO_TEST_EMAIL` / `KLAVIYO_TEST_PHONE`; execute the file’s QA checklist.
8. Record the dashboard flow URL/ID in the approval registry with `approval_status=ceo_review`. Do not activate after approval; activation is a separate CEO-authorized manual action outside this build.

## 10. Testing

Run `npm test` and `npm run check`. Test-mode API calls may use only the configured test profile. Keep dry-run enabled for normal tests. Browser-test consent checkboxes, disclosure capture, CORS, dynamic event fallbacks, STOP/HELP, and mobile templates.

## 11. CEO approval workflow

Create a `marketing_campaign_approvals` row as `drafting`; move through `internal_review` and `ceo_review`. Only a Supabase user with `app_metadata.campaign_approver=true` can approve/reject. Scheduling requires database status `approved`, `KLAVIYO_ALLOW_SCHEDULING=true`, and dry-run explicitly false, but this repository intentionally contains no scheduling/sending function. CEO approval is required for all campaign copy/audience/timing, flow activation, SMS registration/use, cleaned import files, legal disclosure, and any production enablement.

## 12. Deployment

After code review, configure environment values in a Vercel Preview project, deploy Preview manually, run test-profile QA, inspect logs for request IDs and redaction, then obtain separate production/deployment approval. This task does not deploy.

## 13. Rollback

Revert the release in Vercel, set `KLAVIYO_DRY_RUN=true`, set `KLAVIYO_ALLOW_SCHEDULING=false`, disable browser script tags if necessary, and rotate the private key if exposure is suspected. Keep all Klaviyo flows Draft during rollback.

## 14. Troubleshooting

401/403: check key/scopes. 400: inspect safe Klaviyo error details and revision/schema. 429/5xx: client retries and honors `Retry-After`; persistent failures need Klaviyo support and the request ID. No browser events: check public ID, consent, CSP, and network panel. Missing SMS record: verify E.164 plus all evidence fields. Duplicate event: reuse of `unique_id` is intentionally accepted without resending.

## 15. Security and 16. data minimization

Never log authorization values, commit `.env*`, or place healthcare data in profiles/events/approvals. The in-memory rate limit and idempotency cache are best-effort per serverless instance; production hardening should use a shared store such as Upstash or a dedicated Supabase RPC without healthcare payloads. Retain consent evidence in the authoritative compliance store and reference it by opaque ID only.

## 17. Manual Klaviyo dashboard steps

Create the six lists and all segments from the specification. Confirm opt-in settings with legal. Verify branded sending domain, sender identity, unsubscribe pages, SMS number/registration, quiet hours, Smart Sending, UTM tracking, and suppression behavior. Create metrics by sending test events only. Build flows using section 9. Do not use browser automation or unsupported APIs.

## 18. Keep flows draft; 19. internal testing; 20. verify no campaign scheduled

On **Flows**, filter by `EW7`, confirm every flow status shows Draft/Manual and every action is Draft. On **Campaigns**, filter Draft/Scheduled and confirm no EW7 item is Scheduled or Sending. Inspect each campaign’s status and calendar. On **Settings → Account → Notifications/Audit Log** (label may vary), review recent campaign and flow actions. Test only through the Preview action to `KLAVIYO_TEST_EMAIL` and `KLAVIYO_TEST_PHONE`; never add other profiles to the Test Profiles list.

## Exact cleaned-file upload instructions (after CEO approval only)

1. Archive the CEO-approved quality report and checksums; confirm `unknown-consent.csv`, `opted-out.csv`, `invalid-contacts.csv`, and `duplicate-review.csv` will **not** be uploaded as subscribers.
2. Open **Audience → Lists & Segments → Emerald Wellness Newsletter → Manage List → Import Contacts**. Upload `data/output/email-consented.csv`; map email/name/location and email consent evidence properties. Select the historical consent option only if counsel approves and timestamps are valid. Do not map phone as SMS consent. Review the import preview, resolve errors, and obtain final CEO confirmation before clicking Import.
3. Open **Emerald Wellness SMS Subscribers → Manage List → Import Contacts**. Upload `data/output/sms-consented.csv`. Confirm every row has `sms_consent_status=subscribed`, timestamp, source, and evidence reference. Map phone to Phone Number and evidence to custom properties. Choose the documented historical SMS consent setting only after counsel confirms registration/import rules. Review, then obtain a second CEO confirmation before Import.
4. After each import, export/sample-check counts, consent timestamps, suppressions, and list membership. Keep all flows Draft so imports cannot trigger messages. Store source/output files in the approved secure system and remove local PII copies according to retention policy.

## Compliance review required

Legal counsel must approve the disclosure, TCPA/CTIA state-specific requirements, quiet hours, opt-in method, HELP/STOP support, SMS number registration, historical consent imports, privacy/retention terms, and whether any transactional message classification is appropriate. Marketing must substantiate all product and membership claims.
