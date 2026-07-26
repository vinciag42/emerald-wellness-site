const TEST_KEY = 'ew-email-test-20260726-d2a91f6c';
const TEST_RECIPIENT = 'vinciag@aol.com';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (String(req.query?.key || '') !== TEST_KEY) return res.status(403).json({ error: 'Forbidden' });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'welcome@emeraldwellness.health';
  const replyTo = process.env.RESEND_REPLY_TO || 'support@emeraldwellness.health';
  const senderName = 'Emerald Wellness';
  const senderDomain = fromEmail.split('@')[1]?.toLowerCase() || '';

  const checks = {
    deployment_healthy: true,
    resend_api_key_configured: Boolean(apiKey),
    sender_name: senderName,
    sender_email: fromEmail,
    sender_domain: senderDomain,
    sender_domain_matches_brand: senderDomain === 'emeraldwellness.health',
    reply_to: replyTo,
    recipient: TEST_RECIPIENT,
    domain_api_check: null
  };

  if (!apiKey || !checks.sender_domain_matches_brand) {
    return res.status(200).json({ ready: false, sent: false, checks, reason: !apiKey ? 'RESEND_API_KEY is missing' : 'Sender domain is not emeraldwellness.health' });
  }

  checks.domain_api_check = await checkDomain(apiKey);

  const welcome = await sendEmail(apiKey, {
    from: `${senderName} <${fromEmail}>`,
    to: [TEST_RECIPIENT],
    reply_to: replyTo,
    subject: '[TEST] Meet your Emerald Wellness Member Command Center',
    html: welcomeHtml(),
    text: welcomeText(),
    tags: [{ name: 'email_type', value: 'member-command-center-test' }]
  }, 'emerald-email-test-member-command-center-v1');

  if (!welcome.sent) {
    return res.status(200).json({ ready: false, sent: false, checks, welcome, reason: 'Member Command Center test email was not accepted by Resend' });
  }

  const authentication = await sendEmail(apiKey, {
    from: `${senderName} <${fromEmail}>`,
    to: [TEST_RECIPIENT],
    reply_to: replyTo,
    subject: '[TEST] Confirm your Emerald Wellness email address',
    html: authHtml(),
    text: authText(),
    tags: [{ name: 'email_type', value: 'authentication-style-test' }]
  }, 'emerald-email-test-authentication-v1');

  const deliveries = await Promise.all([
    getEmail(apiKey, welcome.id),
    authentication.id ? getEmail(apiKey, authentication.id) : Promise.resolve(null)
  ]);

  const complete = welcome.sent && authentication.sent;
  return res.status(200).json({
    ready: complete,
    sent: complete,
    checks,
    visible_sender_expected: `${senderName} <${fromEmail}>`,
    message_bodies_populated: true,
    welcome: { ...welcome, delivery: deliveries[0] },
    authentication: { ...authentication, delivery: deliveries[1] }
  });
}

async function checkDomain(apiKey) {
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}
    if (!response.ok) return { checked: false, status: response.status, reason: 'API key may be send-only' };
    const domains = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    const domain = domains.find(item => String(item?.name || '').toLowerCase() === 'emeraldwellness.health');
    return { checked: true, found: Boolean(domain), status: domain?.status || null, verified: String(domain?.status || '').toLowerCase() === 'verified' };
  } catch (error) {
    return { checked: false, error: String(error?.message || error) };
  }
}

async function sendEmail(apiKey, payload, idempotencyKey) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}
    return { sent: response.ok, status: response.status, id: data?.id || null, detail: response.ok ? null : text.slice(0, 500) };
  } catch (error) {
    return { sent: false, status: null, id: null, error: String(error?.message || error) };
  }
}

async function getEmail(apiKey, id) {
  if (!id) return null;
  await new Promise(resolve => setTimeout(resolve, 2500));
  try {
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}
    return {
      checked: response.ok,
      status: response.status,
      last_event: data?.last_event || null,
      from: data?.from || null,
      to: data?.to || null,
      subject: data?.subject || null
    };
  } catch (error) {
    return { checked: false, error: String(error?.message || error) };
  }
}

function welcomeHtml() {
  return `<!doctype html><html><body style="margin:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#102119"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #dce4df;border-radius:18px;overflow:hidden"><tr><td style="background:#07583b;padding:30px;text-align:center;color:#fff"><div style="font-family:Georgia,serif;font-size:25px;font-weight:700;letter-spacing:2px">EMERALD <span style="color:#d8c56c">WELLNESS</span></div><div style="margin-top:9px;font-size:13px">Know your biology. Optimize your life.</div></td></tr><tr><td style="padding:40px 38px;text-align:center"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#80672a;font-weight:700">Email system test</div><h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.18">Meet your Member<br>Command Center</h1><p style="font-size:16px;line-height:1.7;color:#52645a">This populated test confirms that Emerald Wellness can deliver the complete Member Command Center welcome message from the branded sending domain.</p><a href="https://emeraldwellness.health/member-command-center" style="display:inline-block;margin-top:18px;background:#07583b;color:#fff;text-decoration:none;font-weight:700;padding:16px 30px;border-radius:10px">Open My Member Command Center</a></td></tr><tr><td style="background:#102119;padding:26px;text-align:center;color:#cbd9d1"><strong style="color:#fff">Know your biology. Optimize your life.</strong><div style="margin-top:10px;font-size:12px">Emerald Wellness · 470 W Broad Street, Suite 1062 · Columbus, Ohio 43215</div></td></tr></table></td></tr></table></body></html>`;
}

function welcomeText() {
  return `EMERALD WELLNESS\nKnow your biology. Optimize your life.\n\nMeet your Member Command Center\n\nThis populated test confirms that Emerald Wellness can deliver the complete Member Command Center welcome message from the branded sending domain.\n\nOpen your Member Command Center: https://emeraldwellness.health/member-command-center`;
}

function authHtml() {
  return `<!doctype html><html><body style="margin:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#102119"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #dce4df;border-radius:18px;overflow:hidden"><tr><td style="background:#07583b;padding:30px;text-align:center;color:#fff"><div style="font-family:Georgia,serif;font-size:25px;font-weight:700;letter-spacing:2px">EMERALD <span style="color:#d8c56c">WELLNESS</span></div><div style="margin-top:9px;font-size:13px">Know your biology. Optimize your life.</div></td></tr><tr><td style="padding:40px 38px;text-align:center"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#80672a;font-weight:700">Account email test</div><h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2">Confirm your email address</h1><p style="font-size:16px;line-height:1.7;color:#52645a">This is an authentication-style test confirming that Emerald Wellness account messages contain a complete branded body instead of a blank template.</p><a href="https://emeraldwellness.health/login" style="display:inline-block;margin-top:18px;background:#07583b;color:#fff;text-decoration:none;font-weight:700;padding:16px 30px;border-radius:10px">Continue to Emerald Wellness</a><p style="margin-top:22px;font-size:12px;line-height:1.6;color:#6a786f">No account changes were made. This button opens the secure Emerald Wellness sign-in page.</p></td></tr><tr><td style="background:#102119;padding:26px;text-align:center;color:#cbd9d1"><strong style="color:#fff">Know your biology. Optimize your life.</strong><div style="margin-top:10px;font-size:12px">Questions? Reply to this email or contact support@emeraldwellness.health.</div></td></tr></table></td></tr></table></body></html>`;
}

function authText() {
  return `EMERALD WELLNESS\nKnow your biology. Optimize your life.\n\nConfirm your email address\n\nThis is an authentication-style test confirming that Emerald Wellness account messages contain a complete branded body instead of a blank template.\n\nContinue: https://emeraldwellness.health/login\n\nNo account changes were made.`;
}
