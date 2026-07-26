const ALLOWED_ORIGINS = new Set([
  'https://emeraldwellness.health',
  'https://www.emeraldwellness.health',
  'https://emerald-wellness-site.vercel.app'
]);

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (origin && !ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: 'JSON body required' });
  }

  const body = req.body || {};
  if (body.website) return res.status(200).json({ success: true });

  const email = clean(body.email, 254).toLowerCase();
  const firstName = clean(body.first_name, 80);
  const lastName = clean(body.last_name, 80);
  const phone = clean(body.phone, 40);
  const goal = clean(body.goal || body.primary_goal, 120);
  const tier = clean(body.tier, 80);
  const source = clean(body.source || 'landing', 80);
  const referredBy = clean(body.referred_by, 80);
  const marketingConsent = body.marketing_consent === true;
  const smsConsent = body.sms_consent === true;
  const consentTimestamp = clean(body.consent_timestamp, 80);
  const consentSource = clean(body.consent_source || source, 200);
  const disclosureVersion = clean(body.consent_disclosure_version, 100);
  const submissionId = clean(body.form_submission_id, 200) || crypto.randomUUID();

  if (!isEmail(email)) return res.status(400).json({ error: 'Valid email required' });

  const result = {
    success: true,
    supabase: { saved: false },
    klaviyo: { paused: true, reason: 'Broken welcome flow disabled during branded-email repair' },
    welcome_email: { attempted: false, sent: false }
  };

  result.supabase = await saveLeadToSupabase({
    email,
    firstName,
    lastName,
    phone,
    goal,
    tier,
    source,
    referredBy,
    marketingConsent,
    smsConsent,
    consentTimestamp,
    consentSource,
    disclosureVersion,
    submissionId,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500)
  });

  const isMemberSignup = source.toLowerCase().includes('signup') || Boolean(tier && tier !== 'homepage-enrollment');
  if (isMemberSignup) {
    result.welcome_email.attempted = true;
    result.welcome_email = await sendBrandedWelcome({
      email,
      firstName,
      tier,
      submissionId
    });
  }

  if (!result.supabase.saved) {
    console.warn('[subscribe-v2] Lead was not saved to Supabase', result.supabase);
  }
  if (result.welcome_email.attempted && !result.welcome_email.sent) {
    console.error('[subscribe-v2] Branded welcome email failed', result.welcome_email);
  }

  return res.status(200).json(result);
}

async function saveLeadToSupabase(data) {
  const url = process.env.SUPABASE_URL || 'https://mczpuffmlspmghgneukz.supabase.co';
  const anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON;
  if (!anon) return { saved: false, skipped: true, reason: 'SUPABASE_ANON_KEY is missing' };

  const payload = {
    email: data.email,
    first_name: data.firstName || null,
    last_name: data.lastName || null,
    phone: data.phone || null,
    goal: data.goal || null,
    tier: data.tier || null,
    source: data.source,
    referred_by: data.referredBy || null,
    marketing_consent: data.marketingConsent,
    sms_consent: data.smsConsent,
    email_consent_at: data.marketingConsent && validDate(data.consentTimestamp) ? data.consentTimestamp : null,
    sms_consent_at: data.smsConsent && validDate(data.consentTimestamp) ? data.consentTimestamp : null,
    marketing_consent_source: data.consentSource || data.source,
    consent_disclosure_version: data.disclosureVersion || null,
    consent_evidence_reference: data.submissionId,
    user_agent: data.userAgent
  };

  try {
    let response = await fetch(`${url}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });
    let text = await response.text();

    if (!response.ok && text.includes('column')) {
      response = await fetch(`${url}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          email: data.email,
          first_name: data.firstName || null,
          source: data.source,
          referred_by: data.referredBy || null
        })
      });
      text = await response.text();
    }

    const duplicate = response.status === 409 || text.toLowerCase().includes('duplicate');
    return {
      saved: response.ok || duplicate,
      duplicate,
      status: response.status,
      detail: text.slice(0, 300)
    };
  } catch (error) {
    return { saved: false, error: String(error?.message || error) };
  }
}

async function sendBrandedWelcome({ email, firstName, tier, submissionId }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { attempted: true, sent: false, skipped: true, reason: 'RESEND_API_KEY is missing' };
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'welcome@emeraldwellness.health';
  const replyTo = process.env.RESEND_REPLY_TO || 'support@emeraldwellness.health';
  const safeFirstName = escapeHtml(firstName || 'there');
  const planName = escapeHtml(formatTier(tier));
  const subject = 'Meet your Emerald Wellness Member Command Center';
  const html = buildWelcomeHtml({ safeFirstName, planName });
  const text = buildWelcomeText({ firstName: firstName || 'there', planName });
  const idempotencyKey = `emerald-member-welcome/${submissionId}`.slice(0, 256);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        from: `Emerald Wellness <${fromAddress}>`,
        to: [email],
        reply_to: replyTo,
        subject,
        html,
        text,
        tags: [
          { name: 'brand', value: 'emerald-wellness' },
          { name: 'email_type', value: 'member-welcome' }
        ]
      })
    });
    const responseText = await response.text();
    let parsed = null;
    try { parsed = responseText ? JSON.parse(responseText) : null; } catch (_) {}

    return {
      attempted: true,
      sent: response.ok,
      status: response.status,
      id: parsed?.id || null,
      detail: response.ok ? undefined : responseText.slice(0, 500)
    };
  } catch (error) {
    return { attempted: true, sent: false, error: String(error?.message || error) };
  }
}

function buildWelcomeHtml({ safeFirstName, planName }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Meet your Emerald Wellness Member Command Center</title>
</head>
<body style="margin:0;padding:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#102119;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Emerald Wellness tools, membership resources, and account access are organized in one place.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f0e7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #dce4df;border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(10,35,24,.08);">
        <tr>
          <td style="background:#07583b;padding:30px 36px;text-align:center;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:700;letter-spacing:2px;color:#ffffff;">EMERALD <span style="color:#d8c56c;">WELLNESS</span></div>
            <div style="margin-top:9px;font-size:13px;letter-spacing:.7px;color:#dbece4;">Know your biology. Optimize your life.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:42px 38px 16px;text-align:center;">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#80672a;font-weight:700;">Welcome to your membership experience</div>
            <h1 style="margin:14px 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.18;color:#102119;">Meet your Member<br>Command Center</h1>
            <p style="margin:0 auto;max-width:500px;font-size:16px;line-height:1.7;color:#52645a;">Hi ${safeFirstName}, your Emerald Wellness resources, account access, educational tools, and eligible membership benefits are organized in one secure place.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 38px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f5ee;border:1px solid #e5dfc9;border-radius:14px;">
              <tr><td style="padding:24px 26px;">
                <div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#80672a;font-weight:700;">Your selected path</div>
                <div style="margin-top:7px;font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;color:#07583b;">${planName}</div>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 38px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="34" valign="top" style="padding:4px 12px 18px 0;"><div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#e8f4ee;color:#07583b;font-weight:700;">1</div></td>
                <td valign="top" style="padding:4px 0 18px;"><div style="font-size:15px;font-weight:700;color:#102119;">Open your Member Command Center</div><div style="margin-top:5px;font-size:14px;line-height:1.6;color:#63736a;">Review your account, membership access, tools, and next steps.</div></td>
              </tr>
              <tr>
                <td width="34" valign="top" style="padding:4px 12px 18px 0;"><div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#e8f4ee;color:#07583b;font-weight:700;">2</div></td>
                <td valign="top" style="padding:4px 0 18px;"><div style="font-size:15px;font-weight:700;color:#102119;">Complete your member profile</div><div style="margin-top:5px;font-size:14px;line-height:1.6;color:#63736a;">Choose broad wellness goals and personalize the educational experience at your pace.</div></td>
              </tr>
              <tr>
                <td width="34" valign="top" style="padding:4px 12px 0 0;"><div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:#e8f4ee;color:#07583b;font-weight:700;">3</div></td>
                <td valign="top" style="padding:4px 0 0;"><div style="font-size:15px;font-weight:700;color:#102119;">Explore your next step</div><div style="margin-top:5px;font-size:14px;line-height:1.6;color:#63736a;">Access education, provider-supported options, labs, supplements, vitamins, and membership resources where eligible.</div></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:34px 38px 42px;text-align:center;">
            <a href="https://emeraldwellness.health/member-command-center" style="display:inline-block;background:#07583b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 30px;border-radius:10px;">Open My Member Command Center</a>
            <div style="margin-top:16px;font-size:13px;color:#6a786f;">Website: <a href="https://emeraldwellness.health" style="color:#07583b;">emeraldwellness.health</a> &nbsp;•&nbsp; Shop: <a href="https://shop.emeraldwellness.health" style="color:#07583b;">shop.emeraldwellness.health</a></div>
          </td>
        </tr>
        <tr>
          <td style="background:#102119;padding:28px 34px;text-align:center;color:#cbd9d1;">
            <div style="font-size:14px;font-weight:700;color:#ffffff;">Know your biology. Optimize your life.</div>
            <div style="margin-top:10px;font-size:12px;line-height:1.6;">Questions? Reply to this email or contact support@emeraldwellness.health.</div>
            <div style="margin-top:13px;font-size:11px;line-height:1.55;color:#9fb0a6;">Emerald Wellness · 470 W Broad Street, Suite 1062 · Columbus, Ohio 43215</div>
            <div style="margin-top:12px;font-size:10px;line-height:1.55;color:#83958a;">Emerald Wellness provides educational and wellness-support information. It does not replace medical advice, diagnosis, or treatment from a licensed healthcare professional.</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildWelcomeText({ firstName, planName }) {
  return `Hi ${firstName},

Welcome to Emerald Wellness.

Your Member Command Center organizes your account access, educational tools, membership resources, and eligible benefits in one place.

Selected path: ${planName}

Open your Member Command Center:
https://emeraldwellness.health/member-command-center

Website: https://emeraldwellness.health
Shop: https://shop.emeraldwellness.health

Know your biology. Optimize your life.

Questions? Reply to this email or contact support@emeraldwellness.health.

Emerald Wellness provides educational and wellness-support information and does not replace medical advice, diagnosis, or treatment from a licensed healthcare professional.`;
}

function formatTier(value) {
  const tier = clean(value, 80).replace(/[_-]+/g, ' ').trim();
  if (!tier || tier === 'signup') return 'Emerald Wellness Membership';
  return tier.replace(/\b\w/g, char => char.toUpperCase());
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function validDate(value) {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
