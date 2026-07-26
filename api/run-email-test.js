const TEST_KEY = 'emerald-live-email-test-20260726';
const TEST_RECIPIENT = 'vinciag@aol.com';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (String(req.query?.key || '') !== TEST_KEY) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, ready: false, error: 'RESEND_API_KEY is not configured in Vercel.' });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'welcome@emeraldwellness.health';
  const replyTo = process.env.RESEND_REPLY_TO || 'support@emeraldwellness.health';

  const messages = [
    {
      subject: 'TEST — Meet your Emerald Wellness Member Command Center',
      html: memberWelcomeHtml(),
      text: 'Emerald Wellness test: Your Member Command Center email is working. Know your biology. Optimize your life.'
    },
    {
      subject: 'TEST — Emerald Wellness account email',
      html: accountEmailHtml(),
      text: 'Emerald Wellness account-email test. This confirms branded account and authentication-style email delivery.'
    }
  ];

  const results = [];
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `emerald-email-live-test-20260726-${index + 1}`
        },
        body: JSON.stringify({
          from: `Emerald Wellness <${fromEmail}>`,
          to: [TEST_RECIPIENT],
          reply_to: replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
          tags: [
            { name: 'brand', value: 'emerald-wellness' },
            { name: 'email_type', value: index === 0 ? 'member-welcome-test' : 'account-email-test' }
          ]
        })
      });
      const raw = await response.text();
      let parsed = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
      results.push({
        subject: message.subject,
        sent: response.ok,
        status: response.status,
        id: parsed?.id || null,
        error: response.ok ? null : raw.slice(0, 500)
      });
    } catch (error) {
      results.push({ subject: message.subject, sent: false, status: 0, error: String(error?.message || error) });
    }
  }

  const ok = results.every(item => item.sent);
  return res.status(ok ? 200 : 502).json({
    ok,
    ready: true,
    recipient: TEST_RECIPIENT,
    sender: `Emerald Wellness <${fromEmail}>`,
    reply_to: replyTo,
    results
  });
}

function shell(title, eyebrow, body) {
  return `<!doctype html><html><body style="margin:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#102119"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:#f3f0e7"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #dce4df;border-radius:18px;overflow:hidden"><tr><td style="background:#07583b;padding:30px;text-align:center"><div style="font-family:Georgia,serif;font-size:25px;font-weight:700;letter-spacing:2px;color:#fff">EMERALD <span style="color:#d8c56c">WELLNESS</span></div><div style="margin-top:9px;font-size:13px;color:#dbece4">Know your biology. Optimize your life.</div></td></tr><tr><td style="padding:42px 38px"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#80672a;font-weight:700">${eyebrow}</div><h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2;margin:14px 0;color:#102119">${title}</h1>${body}</td></tr><tr><td style="background:#102119;padding:26px;text-align:center;color:#cbd9d1"><div style="font-size:14px;font-weight:700;color:#fff">Know your biology. Optimize your life.</div><div style="margin-top:10px;font-size:12px">Emerald Wellness · 470 W Broad Street, Suite 1062 · Columbus, Ohio 43215</div></td></tr></table></td></tr></table></body></html>`;
}

function memberWelcomeHtml() {
  return shell(
    'Meet your Member Command Center',
    'Live delivery test',
    '<p style="font-size:16px;line-height:1.7;color:#52645a">This confirms the complete Emerald Wellness welcome message is sending from the branded domain with a populated message body.</p><p style="margin-top:28px;text-align:center"><a href="https://emeraldwellness.health/member-command-center" style="display:inline-block;background:#07583b;color:#fff;text-decoration:none;font-weight:700;padding:16px 28px;border-radius:10px">Open My Member Command Center</a></p>'
  );
}

function accountEmailHtml() {
  return shell(
    'Your Emerald Wellness account email is working',
    'Authentication-style test',
    '<p style="font-size:16px;line-height:1.7;color:#52645a">This second message confirms branded account and authentication-style emails can display Emerald Wellness as the sender instead of a platform default.</p><p style="font-size:14px;line-height:1.7;color:#63736a">No action is required. This is a delivery test requested by Vincia Fontaine.</p>'
  );
}
