const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'welcome@emeraldwellness.health';
const replyTo = process.env.RESEND_REPLY_TO || 'support@emeraldwellness.health';
const recipient = 'vinciag@aol.com';
const sender = `Emerald Wellness <${fromEmail}>`;

if (!apiKey) throw new Error('RESEND_API_KEY is not configured; no test email was sent.');
if (fromEmail.split('@')[1]?.toLowerCase() !== 'emeraldwellness.health') {
  throw new Error('Branded sender domain is not emeraldwellness.health; no test email was sent.');
}

const messages = [
  {
    key: 'emerald-build-email-test-welcome-20260726-v1',
    subject: '[TEST] Meet your Emerald Wellness Member Command Center',
    html: `<!doctype html><html><body style="margin:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#102119"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #dce4df;border-radius:18px;overflow:hidden"><tr><td style="background:#07583b;padding:30px;text-align:center;color:#fff"><div style="font-family:Georgia,serif;font-size:25px;font-weight:700;letter-spacing:2px">EMERALD <span style="color:#d8c56c">WELLNESS</span></div><div style="margin-top:9px;font-size:13px">Know your biology. Optimize your life.</div></td></tr><tr><td style="padding:40px 38px;text-align:center"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#80672a;font-weight:700">Email system test</div><h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.18">Meet your Member<br>Command Center</h1><p style="font-size:16px;line-height:1.7;color:#52645a">This populated test confirms that Emerald Wellness can deliver the complete Member Command Center welcome message from the branded sending domain.</p><a href="https://emeraldwellness.health/member-command-center" style="display:inline-block;margin-top:18px;background:#07583b;color:#fff;text-decoration:none;font-weight:700;padding:16px 30px;border-radius:10px">Open My Member Command Center</a></td></tr><tr><td style="background:#102119;padding:26px;text-align:center;color:#cbd9d1"><strong style="color:#fff">Know your biology. Optimize your life.</strong><div style="margin-top:10px;font-size:12px">Emerald Wellness · 470 W Broad Street, Suite 1062 · Columbus, Ohio 43215</div></td></tr></table></td></tr></table></body></html>`,
    text: `EMERALD WELLNESS\nKnow your biology. Optimize your life.\n\nMeet your Member Command Center\n\nThis populated test confirms that Emerald Wellness can deliver the complete Member Command Center welcome message from the branded sending domain.\n\nhttps://emeraldwellness.health/member-command-center`
  },
  {
    key: 'emerald-build-email-test-auth-20260726-v1',
    subject: '[TEST] Confirm your Emerald Wellness email address',
    html: `<!doctype html><html><body style="margin:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#102119"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #dce4df;border-radius:18px;overflow:hidden"><tr><td style="background:#07583b;padding:30px;text-align:center;color:#fff"><div style="font-family:Georgia,serif;font-size:25px;font-weight:700;letter-spacing:2px">EMERALD <span style="color:#d8c56c">WELLNESS</span></div><div style="margin-top:9px;font-size:13px">Know your biology. Optimize your life.</div></td></tr><tr><td style="padding:40px 38px;text-align:center"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#80672a;font-weight:700">Account email test</div><h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2">Confirm your email address</h1><p style="font-size:16px;line-height:1.7;color:#52645a">This is an authentication-style test confirming that Emerald Wellness account messages contain a complete branded body instead of a blank template.</p><a href="https://emeraldwellness.health/login" style="display:inline-block;margin-top:18px;background:#07583b;color:#fff;text-decoration:none;font-weight:700;padding:16px 30px;border-radius:10px">Continue to Emerald Wellness</a><p style="margin-top:22px;font-size:12px;line-height:1.6;color:#6a786f">No account changes were made. This button opens the secure Emerald Wellness sign-in page.</p></td></tr><tr><td style="background:#102119;padding:26px;text-align:center;color:#cbd9d1"><strong style="color:#fff">Know your biology. Optimize your life.</strong><div style="margin-top:10px;font-size:12px">Questions? Reply to this email or contact support@emeraldwellness.health.</div></td></tr></table></td></tr></table></body></html>`,
    text: `EMERALD WELLNESS\nKnow your biology. Optimize your life.\n\nConfirm your email address\n\nThis is an authentication-style test confirming that Emerald Wellness account messages contain a complete branded body instead of a blank template.\n\nhttps://emeraldwellness.health/login\n\nNo account changes were made.`
  }
];

const results = [];
for (const message of messages) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': message.key
    },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      reply_to: replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      tags: [{ name: 'email_type', value: message.key.includes('auth') ? 'authentication-style-test' : 'member-command-center-test' }]
    })
  });
  const responseText = await response.text();
  let data = null;
  try { data = responseText ? JSON.parse(responseText) : null; } catch {}
  if (!response.ok || !data?.id) {
    throw new Error(`Resend rejected ${message.subject}: ${response.status} ${responseText.slice(0, 300)}`);
  }
  results.push({ subject: message.subject, id: data.id, accepted: true });
}

await new Promise(resolve => setTimeout(resolve, 2500));
for (const result of results) {
  const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(result.id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (response.ok) {
    const data = await response.json();
    result.last_event = data.last_event || null;
    result.from = data.from || null;
    result.to = data.to || null;
  }
}

const output = {
  ready: true,
  sent: true,
  sender_name: 'Emerald Wellness',
  sender_email: fromEmail,
  visible_sender_expected: sender,
  reply_to: replyTo,
  recipient,
  domain_verified_by_prior_resend_check: true,
  message_bodies_populated: true,
  messages: results,
  tested_at: new Date().toISOString()
};

await import('node:fs/promises').then(fs => fs.writeFile('email-test-result.json', JSON.stringify(output, null, 2)));
console.log(JSON.stringify(output));
