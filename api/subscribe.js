export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, first_name, phone, source, referred_by } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required', step: 'validation' });

  const KLAVIYO_KEY = process.env.KLAVIYO_PRIVATE_KEY || 'pk_WtKVHz_49f453ff604a0678196e1c8a13dff471df';
  const KLAVIYO_LIST = process.env.KLAVIYO_LIST_ID || 'XEEg3P';
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mczpuffmlspmghgneukz.supabase.co';
  const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jenB1ZmZtbHNwbWdoZ25ldWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNjczODAsImV4cCI6MjA5NTc0MzM4MH0.hs0CQOyrcIk5WhRr9OUU1fVs7V1sMcea7RYwWuTAVag';

  const klaviyoHeaders = {
    'Authorization': `Klaviyo-API-Key ${KLAVIYO_KEY}`,
    'Content-Type': 'application/json',
    'revision': '2024-02-15'
  };

  const result = {
    success: false,
    klaviyo: null,
    klaviyoProfile: null,
    supabase: null,
    diagnostics: null
  };

  try {
    // ── 1. Subscribe email to list (Klaviyo official: profile-subscription-bulk-create-jobs) ──
    // Docs: https://developers.klaviyo.com/en/reference/bulk_subscribe_profiles
    console.log('[subscribe] STEP 1 — Klaviyo subscribe → list', KLAVIYO_LIST, email);
    const subscribePayload = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: source || 'Emerald Wellness Waitlist Form',
          profiles: {
            data: [{
              type: 'profile',
              attributes: {
                email,
                ...(phone ? { phone_number: phone } : {}),
                subscriptions: {
                  email: { marketing: { consent: 'SUBSCRIBED' } }
                }
              }
            }]
          }
        },
        relationships: {
          list: { data: { type: 'list', id: KLAVIYO_LIST } }
        }
      }
    };

    const klaviyoRes = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: klaviyoHeaders,
      body: JSON.stringify(subscribePayload)
    });

    const klaviyoText = await klaviyoRes.text();
    const klaviyoOk = klaviyoRes.ok || klaviyoRes.status === 202;
    result.klaviyo = { ok: klaviyoOk, status: klaviyoRes.status, body: klaviyoText.slice(0, 500) };

    if (!klaviyoOk) {
      console.error('[subscribe] STEP 1 FAILED — Klaviyo subscribe', klaviyoRes.status, klaviyoText);
      return res.status(502).json({
        error: 'Klaviyo subscription failed',
        step: 'klaviyo',
        status: klaviyoRes.status,
        detail: klaviyoText,
        ...result
      });
    }
    console.log('[subscribe] STEP 1 OK — Klaviyo accepted subscribe job (202 = async, profile added shortly)');

    // ── 2. Update profile with first_name (subscribe job may not accept first_name in all revisions) ──
    if (first_name || phone) {
      console.log('[subscribe] STEP 2 — Klaviyo profile name/phone update…');
      result.klaviyoProfile = await updateKlaviyoProfileName(
        email, first_name, phone, klaviyoHeaders
      );
      if (result.klaviyoProfile.ok) {
        console.log('[subscribe] STEP 2 OK — profile updated via', result.klaviyoProfile.method);
      } else {
        console.warn('[subscribe] STEP 2 WARN — name/phone not saved (list subscribe still OK)', result.klaviyoProfile);
      }
    }

    // ── 3. Supabase waitlist (single save — browser must NOT insert separately) ──
    const sbPayload = {
      email,
      first_name: first_name || null,
      source: source || 'coming-soon',
      referred_by: referred_by || null
    };
    console.log('[subscribe] STEP 3 — Supabase waitlist insert', sbPayload);

    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sbPayload)
    });

    const sbText = await sbRes.text();
    const sbDuplicate = sbRes.status === 409 || sbText.includes('duplicate');
    const sbOk = sbRes.ok || sbDuplicate;
    result.supabase = { ok: sbOk, status: sbRes.status, duplicate: sbDuplicate, body: sbText.slice(0, 300) };

    if (!sbOk) {
      console.error('[subscribe] STEP 3 FAILED — Supabase', sbRes.status, sbText);
      return res.status(502).json({
        error: 'Supabase save failed',
        step: 'supabase',
        status: sbRes.status,
        detail: sbText,
        ...result
      });
    }
    console.log('[subscribe] STEP 3 OK —', sbDuplicate ? 'email already on waitlist' : 'new waitlist row saved');

    // ── 4. Post-subscribe diagnostics (Klaviyo job is async — wait briefly then verify) ──
    console.log('[subscribe] STEP 4 — waiting 2s then verifying Klaviyo profile + consent…');
    await sleep(2000);
    result.diagnostics = await diagnoseKlaviyoProfile(email, KLAVIYO_LIST, klaviyoHeaders);
    logDiagnostics(result.diagnostics);

    result.success = true;
    return res.status(200).json(result);
  } catch (err) {
    console.error('[subscribe] Unexpected error', err);
    return res.status(500).json({ error: err.message, step: 'exception', ...result });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logDiagnostics(diag) {
  if (!diag) return;
  console.log('[subscribe] DIAG — profile found:', diag.profileFound);
  console.log('[subscribe] DIAG — on waitlist list:', diag.onWaitlistList);
  console.log('[subscribe] DIAG — email consent:', diag.emailConsent);
  console.log('[subscribe] DIAG — can receive email:', diag.canReceiveEmail);
  console.log('[subscribe] DIAG — double opt-in pending:', diag.doubleOptInPending);
  console.log('[subscribe] DIAG — suppressions:', diag.suppressions?.length ? diag.suppressions : 'none');
  if (diag.issues?.length) {
    console.warn('[subscribe] DIAG — issues that can cause welcome email SKIP:', diag.issues);
  } else {
    console.log('[subscribe] DIAG — no API-level blockers; if email still skipped, check Klaviyo Flow → Recipient Activity → Skipped');
  }
  if (diag.klaviyoUiCheck) {
    console.log('[subscribe] DIAG — Klaviyo UI:', diag.klaviyoUiCheck);
  }
}

/** Verify profile consent + list membership after async subscribe job. */
async function diagnoseKlaviyoProfile(email, listId, headers) {
  const diag = {
    email,
    listId,
    profileFound: false,
    profileId: null,
    onWaitlistList: false,
    emailConsent: null,
    canReceiveEmail: null,
    doubleOptInPending: null,
    consentTimestamp: null,
    suppressions: [],
    issues: [],
    klaviyoUiCheck: 'Flows → Email Welcome Series → Welcome email → View details → Recipient activity → Skipped tab'
  };

  const emailFilter = encodeURIComponent(`equals(email,"${email}")`);

  try {
    const profileRes = await fetch(
      `https://a.klaviyo.com/api/profiles/?filter=${emailFilter}&additional-fields[profile]=subscriptions`,
      { headers }
    );
    const profileJson = await profileRes.json().catch(() => ({}));

    if (!profileRes.ok) {
      diag.issues.push(`Could not fetch profile (${profileRes.status}) — subscribe job may still be processing; retry in 30s`);
      return diag;
    }

    const profile = profileJson.data?.[0];
    if (!profile) {
      diag.issues.push('Profile not found yet — Klaviyo subscribe job is still processing (wait 30–60s and check list members)');
      return diag;
    }

    diag.profileFound = true;
    diag.profileId = profile.id;

    const sub = profile.attributes?.subscriptions?.email?.marketing;
    diag.emailConsent = sub?.consent ?? 'unknown';
    diag.canReceiveEmail = sub?.can_receive_email_marketing ?? null;
    diag.consentTimestamp = sub?.consent_timestamp ?? null;
    diag.doubleOptInPending = sub?.double_optin === true && diag.emailConsent !== 'SUBSCRIBED';
    diag.suppressions = sub?.suppression ?? [];

    if (diag.emailConsent !== 'SUBSCRIBED') {
      diag.issues.push(
        `Email consent is "${diag.emailConsent}" not SUBSCRIBED — common if list uses double opt-in; confirm opt-in email first`
      );
    }
    if (diag.canReceiveEmail === false) {
      diag.issues.push('Profile cannot receive email marketing (can_receive_email_marketing=false)');
    }
    if (diag.suppressions?.length) {
      diag.issues.push(`Profile has email suppressions: ${JSON.stringify(diag.suppressions)}`);
    }
    if (diag.doubleOptInPending) {
      diag.issues.push('Double opt-in confirmation not completed — welcome flow may skip until they confirm');
    }

    const listRes = await fetch(
      `https://a.klaviyo.com/api/lists/${listId}/profiles/?filter=${emailFilter}`,
      { headers }
    );
    const listJson = await listRes.json().catch(() => ({}));
    diag.onWaitlistList = (listJson.data?.length ?? 0) > 0;

    if (!diag.onWaitlistList) {
      diag.issues.push(`Profile not on list ${listId} yet — job still processing or wrong list ID`);
    }

    if (diag.onWaitlistList && diag.emailConsent === 'SUBSCRIBED' && diag.canReceiveEmail !== false && !diag.suppressions?.length) {
      diag.likelyCauseIfSkipped = [
        'Smart Sending (turn off on welcome email for testing)',
        'Fails Flow Filters on cloned welcome flow',
        'Profile already received this email from old Email List flow',
        'Invalid from-address / sending domain issue'
      ];
    }
  } catch (err) {
    diag.issues.push(`Diagnostic error: ${err.message}`);
  }

  return diag;
}

/** POST profile; on 409 (created by subscribe job) PATCH the existing profile by id. */
async function updateKlaviyoProfileName(email, first_name, phone, headers) {
  const createAttrs = { email };
  if (first_name) createAttrs.first_name = first_name;
  if (phone) createAttrs.phone_number = phone;

  const profileRes = await fetch('https://a.klaviyo.com/api/profiles/', {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: { type: 'profile', attributes: createAttrs } })
  });
  const profileText = await profileRes.text();

  if (profileRes.ok || profileRes.status === 201) {
    return { ok: true, status: profileRes.status, method: 'create' };
  }

  if (profileRes.status !== 409) {
    return { ok: false, status: profileRes.status, body: profileText.slice(0, 300) };
  }

  let profileId = null;
  try {
    const errBody = JSON.parse(profileText);
    profileId = errBody.errors?.[0]?.meta?.duplicate_profile_id;
  } catch (_) {}

  if (!profileId) {
    return { ok: false, status: 409, body: profileText.slice(0, 300), note: 'duplicate but no profile id' };
  }

  const patchAttrs = {};
  if (first_name) patchAttrs.first_name = first_name;
  if (phone) patchAttrs.phone_number = phone;

  const patchRes = await fetch(`https://a.klaviyo.com/api/profiles/${profileId}/`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      data: { type: 'profile', id: profileId, attributes: patchAttrs }
    })
  });
  const patchText = await patchRes.text();
  return {
    ok: patchRes.ok,
    status: patchRes.status,
    method: 'patch',
    profileId,
    body: patchText.slice(0, 300)
  };
}
