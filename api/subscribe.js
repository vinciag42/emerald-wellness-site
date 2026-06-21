export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Accept ALL signup fields so every signup is stored in full
  const { email, first_name, last_name, phone, goal, tier, source, referred_by } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required', step: 'validation' });

  const KLAVIYO_KEY = process.env.KLAVIYO_PRIVATE_KEY;
  if (!KLAVIYO_KEY) {
    return res.status(500).json({ error: 'Signup service is not configured', step: 'configuration' });
  }
  const KLAVIYO_LIST = process.env.KLAVIYO_LIST_ID || 'XEEg3P';
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mczpuffmlspmghgneukz.supabase.co';
  const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jenB1ZmZtbHNwbWdoZ25ldWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNjczODAsImV4cCI6MjA5NTc0MzM4MH0.hs0CQOyrcIk5WhRr9OUU1fVs7V1sMcea7RYwWuTAVag';

  const klaviyoHeaders = {
    'Authorization': `Klaviyo-API-Key ${KLAVIYO_KEY}`,
    'Content-Type': 'application/json',
    'revision': '2024-02-15'
  };

  const result = { success: false, klaviyo: null, klaviyoProfile: null, supabase: null, diagnostics: null };

  try {
    // ── 1. Subscribe email to Klaviyo list ──
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
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } }
              }
            }]
          }
        }
      },
      relationships: { list: { data: { type: 'list', id: KLAVIYO_LIST } } }
    };

    const klaviyoRes = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST', headers: klaviyoHeaders, body: JSON.stringify(subscribePayload)
    });
    const klaviyoText = await klaviyoRes.text();
    const klaviyoOk = klaviyoRes.ok || klaviyoRes.status === 202;
    result.klaviyo = { ok: klaviyoOk, status: klaviyoRes.status, body: klaviyoText.slice(0, 500) };

    if (!klaviyoOk) {
      console.error('[subscribe] STEP 1 FAILED — Klaviyo', klaviyoRes.status, klaviyoText);
      return res.status(502).json({ error: 'Klaviyo subscription failed', step: 'klaviyo', status: klaviyoRes.status, detail: klaviyoText, ...result });
    }
    console.log('[subscribe] STEP 1 OK — Klaviyo accepted subscribe job');

    // ── 2. Update Klaviyo profile with name + phone + goal/tier as custom properties ──
    if (first_name || last_name || phone || goal || tier) {
      console.log('[subscribe] STEP 2 — Klaviyo profile update…');
      result.klaviyoProfile = await updateKlaviyoProfile(email, first_name, last_name, phone, goal, tier, klaviyoHeaders);
      if (result.klaviyoProfile.ok) console.log('[subscribe] STEP 2 OK — profile updated via', result.klaviyoProfile.method);
      else console.warn('[subscribe] STEP 2 WARN — profile not updated', result.klaviyoProfile);
    }

    // ── 3. Supabase waitlist — store ALL fields ──
    const sbPayload = {
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      goal: goal || null,
      tier: tier || null,
      source: source || 'coming-soon',
      referred_by: referred_by || null
    };
    console.log('[subscribe] STEP 3 — Supabase waitlist insert', sbPayload);

    let sbRes = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sbPayload)
    });
    let sbText = await sbRes.text();

    // Fallback: if a column doesn't exist yet (PGRST204), retry with core fields only so the signup is never lost
    if (sbRes.status === 400 && sbText.includes('column')) {
      console.warn('[subscribe] STEP 3 — extra columns missing, retrying with core fields. Run add-waitlist-columns.sql to store everything.');
      const corePayload = { email, first_name: first_name || null, source: source || 'coming-soon', referred_by: referred_by || null };
      sbRes = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(corePayload)
      });
      sbText = await sbRes.text();
    }

    const sbDuplicate = sbRes.status === 409 || sbText.includes('duplicate');
    const sbOk = sbRes.ok || sbDuplicate;
    result.supabase = { ok: sbOk, status: sbRes.status, duplicate: sbDuplicate, body: sbText.slice(0, 300) };

    if (!sbOk) {
      console.error('[subscribe] STEP 3 FAILED — Supabase', sbRes.status, sbText);
      return res.status(502).json({ error: 'Supabase save failed', step: 'supabase', status: sbRes.status, detail: sbText, ...result });
    }
    console.log('[subscribe] STEP 3 OK —', sbDuplicate ? 'email already on waitlist' : 'new waitlist row saved');

    // ── 4. Diagnostics ──
    await sleep(2000);
    result.diagnostics = await diagnoseKlaviyoProfile(email, KLAVIYO_LIST, klaviyoHeaders);

    result.success = true;
    return res.status(200).json(result);
  } catch (err) {
    console.error('[subscribe] Unexpected error', err);
    return res.status(500).json({ error: err.message, step: 'exception', ...result });
  }
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function diagnoseKlaviyoProfile(email, listId, headers) {
  const diag = { email, listId, profileFound: false, onWaitlistList: false, emailConsent: null, issues: [] };
  const emailFilter = encodeURIComponent(`equals(email,"${email}")`);
  try {
    const profileRes = await fetch(`https://a.klaviyo.com/api/profiles/?filter=${emailFilter}&additional-fields[profile]=subscriptions`, { headers });
    const profileJson = await profileRes.json().catch(() => ({}));
    const profile = profileJson.data?.[0];
    if (!profile) { diag.issues.push('Profile still processing — check list members in 30–60s'); return diag; }
    diag.profileFound = true;
    const sub = profile.attributes?.subscriptions?.email?.marketing;
    diag.emailConsent = sub?.consent ?? 'unknown';
    const listRes = await fetch(`https://a.klaviyo.com/api/lists/${listId}/profiles/?filter=${emailFilter}`, { headers });
    const listJson = await listRes.json().catch(() => ({}));
    diag.onWaitlistList = (listJson.data?.length ?? 0) > 0;
  } catch (err) { diag.issues.push(`Diagnostic error: ${err.message}`); }
  return diag;
}

async function updateKlaviyoProfile(email, first_name, last_name, phone, goal, tier, headers) {
  const props = {};
  if (goal) props.health_goal = goal;
  if (tier) props.selected_tier = tier;

  const createAttrs = { email };
  if (first_name) createAttrs.first_name = first_name;
  if (last_name) createAttrs.last_name = last_name;
  if (phone) createAttrs.phone_number = phone;
  if (Object.keys(props).length) createAttrs.properties = props;

  const profileRes = await fetch('https://a.klaviyo.com/api/profiles/', {
    method: 'POST', headers, body: JSON.stringify({ data: { type: 'profile', attributes: createAttrs } })
  });
  const profileText = await profileRes.text();

  if (profileRes.ok || profileRes.status === 201) return { ok: true, status: profileRes.status, method: 'create' };
  if (profileRes.status !== 409) return { ok: false, status: profileRes.status, body: profileText.slice(0, 300) };

  let profileId = null;
  try { profileId = JSON.parse(profileText).errors?.[0]?.meta?.duplicate_profile_id; } catch (_) {}
  if (!profileId) return { ok: false, status: 409, note: 'duplicate but no profile id' };

  const patchAttrs = {};
  if (first_name) patchAttrs.first_name = first_name;
  if (last_name) patchAttrs.last_name = last_name;
  if (phone) patchAttrs.phone_number = phone;
  if (Object.keys(props).length) patchAttrs.properties = props;

  const patchRes = await fetch(`https://a.klaviyo.com/api/profiles/${profileId}/`, {
    method: 'PATCH', headers, body: JSON.stringify({ data: { type: 'profile', id: profileId, attributes: patchAttrs } })
  });
  return { ok: patchRes.ok, status: patchRes.status, method: 'patch', profileId };
}
