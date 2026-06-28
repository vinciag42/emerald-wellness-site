export default async function handler(req, res) {
  const allowedOrigins = new Set([
    'https://emeraldwellness.health',
    'https://www.emeraldwellness.health',
    'https://emerald-wellness-site.vercel.app'
  ]);
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (origin && !allowedOrigins.has(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: 'JSON body required' });
  }

  // Normalize and bound all public form fields.
  const { email, first_name, last_name, phone, goal, tier, source, referred_by, website } = req.body || {};
  if (website) return res.status(200).json({ success: true });
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
    return res.status(400).json({ error: 'Valid email required', step: 'validation' });
  }
  const cleanFirstName = String(first_name || '').trim().slice(0, 80);
  const cleanLastName = String(last_name || '').trim().slice(0, 80);
  const cleanPhone = String(phone || '').trim().slice(0, 40);
  const cleanGoal = String(goal || '').trim().slice(0, 120);
  const cleanTier = String(tier || '').trim().slice(0, 80);
  const cleanSource = String(source || 'landing').trim().slice(0, 80);
  const cleanReferral = String(referred_by || '').trim().slice(0, 80);

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
    console.log('[subscribe] Starting consented list subscription');
    const subscribePayload = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: cleanSource,
          profiles: {
            data: [{
              type: 'profile',
              attributes: {
                email: cleanEmail,
                ...(cleanPhone ? { phone_number: cleanPhone } : {}),
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } }
              }
            }]
          }
        },
        relationships: { list: { data: { type: 'list', id: KLAVIYO_LIST } } }
      }
    };

    const klaviyoRes = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST', headers: klaviyoHeaders, body: JSON.stringify(subscribePayload)
    });
    const klaviyoText = await klaviyoRes.text();
    const klaviyoOk = klaviyoRes.ok || klaviyoRes.status === 202;
    result.klaviyo = { ok: klaviyoOk, status: klaviyoRes.status, body: klaviyoText.slice(0, 500) };

    if (!klaviyoOk) {
      console.error('[subscribe] STEP 1 FAILED — Klaviyo', klaviyoRes.status, klaviyoText);
      return res.status(502).json({ error: 'Subscription service unavailable', step: 'klaviyo' });
    }
    console.log('[subscribe] STEP 1 OK — Klaviyo accepted subscribe job');

    // ── 2. Update Klaviyo profile with name + phone + goal/tier as custom properties ──
    if (cleanFirstName || cleanLastName || cleanPhone || cleanGoal || cleanTier) {
      console.log('[subscribe] STEP 2 — Klaviyo profile update…');
      result.klaviyoProfile = await updateKlaviyoProfile(cleanEmail, cleanFirstName, cleanLastName, cleanPhone, cleanGoal, cleanTier, klaviyoHeaders);
      if (result.klaviyoProfile.ok) console.log('[subscribe] STEP 2 OK — profile updated via', result.klaviyoProfile.method);
      else console.warn('[subscribe] STEP 2 WARN — profile not updated', result.klaviyoProfile);
    }

    // ── 3. Supabase waitlist — store ALL fields ──
    result.klaviyoEvent = await emitKlaviyoEvent('Submitted Enrollment', {
      email: cleanEmail,
      first_name: cleanFirstName,
      last_name: cleanLastName
    }, {
      selected_tier: cleanTier || 'homepage-enrollment',
      source: cleanSource,
      referred_by: cleanReferral || '',
      lifecycle_status: 'lead'
    }, klaviyoHeaders);
    if (result.klaviyoEvent.ok) console.log('[subscribe] STEP 3 OK — Klaviyo Submitted Enrollment event created');
    else console.warn('[subscribe] STEP 3 WARN — Klaviyo event not created', result.klaviyoEvent);

    const sbPayload = {
      email: cleanEmail,
      first_name: cleanFirstName || null,
      last_name: cleanLastName || null,
      phone: cleanPhone || null,
      goal: cleanGoal || null,
      tier: cleanTier || null,
      source: cleanSource,
      referred_by: cleanReferral || null
    };
    console.log('[subscribe] Saving consented signup');

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
      const corePayload = { email: cleanEmail, first_name: cleanFirstName || null, source: cleanSource, referred_by: cleanReferral || null };
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
      return res.status(502).json({ error: 'Signup storage unavailable', step: 'supabase' });
    }
    console.log('[subscribe] STEP 3 OK —', sbDuplicate ? 'email already on waitlist' : 'new waitlist row saved');

    return res.status(200).json({ success: true, duplicate: sbDuplicate });
  } catch (err) {
    console.error('[subscribe] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected signup error', step: 'exception' });
  }
}

async function emitKlaviyoEvent(metricName, profile, properties, headers) {
  try {
    const response = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: {
              data: {
                type: 'metric',
                attributes: { name: metricName }
              }
            },
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: profile.email,
                  ...(profile.first_name ? { first_name: profile.first_name } : {}),
                  ...(profile.last_name ? { last_name: profile.last_name } : {})
                }
              }
            },
            properties: properties || {}
          }
        }
      })
    });
    const text = await response.text();
    return { ok: response.ok || response.status === 202, status: response.status, body: text.slice(0, 300) };
  } catch (error) {
    return { ok: false, status: 0, body: error.message };
  }
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
