const REPAIR_KEY = 'ew-member-email-7b4f2d91c6a84530';
const KLAVIYO_BASE = 'https://a.klaviyo.com/api';
const TARGET_SUBJECT = 'Meet your Member Command Center';
const REVISION = '2026-07-15';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return sendPage(res, 405, false, 'Method not allowed.');
  if (String(req.query?.key || '') !== REPAIR_KEY) return sendPage(res, 404, false, 'Not found.');

  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY || process.env.KLAVIYO_PRIVATE_KEY;
  if (!apiKey) {
    return sendPage(res, 500, false, 'The Klaviyo private API key is not configured in Vercel.');
  }

  const headers = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    revision: process.env.KLAVIYO_API_REVISION || REVISION
  };

  try {
    const target = await findTargetFlowMessage(headers);
    if (!target) {
      return sendPage(
        res,
        404,
        false,
        `No Klaviyo flow email with the exact subject “${TARGET_SUBJECT}” was found.`,
        'The API key may need flows:read and templates:read scopes, or the message subject may have been changed.'
      );
    }

    const templateResult = await repairTemplate(target.message.id, headers);
    const senderResult = await repairSender(target.action.id, headers);

    const senderNote = senderResult.ok
      ? 'Sender updated to Emerald Wellness <welcome@emeraldwellness.health>.'
      : `The body was repaired, but the sender settings could not be updated automatically: ${senderResult.reason}`;

    return sendPage(
      res,
      200,
      true,
      'The current Emerald Wellness email has been repaired.',
      `${templateResult.editorType} template updated for “${TARGET_SUBJECT}”. ${senderNote}`
    );
  } catch (error) {
    return sendPage(
      res,
      500,
      false,
      'The email repair did not complete.',
      sanitizeError(error)
    );
  }
}

async function findTargetFlowMessage(headers) {
  const flows = await collectPages(`${KLAVIYO_BASE}/flows?page[size]=50&sort=-updated`, headers, 3);
  const activeFlows = flows.filter(flow => flow?.attributes?.archived !== true);
  const preferred = activeFlows.filter(flow => {
    const name = normalize(flow?.attributes?.name);
    return name.includes('ew7') || name.includes('welcome') || name.includes('education') || name.includes('member');
  });
  const candidates = preferred.length ? preferred : activeFlows.slice(0, 50);

  for (const flow of candidates) {
    const filter = encodeURIComponent('equals(action_type,"SEND_EMAIL")');
    const actions = await collectPages(
      `${KLAVIYO_BASE}/flows/${encodeURIComponent(flow.id)}/flow-actions?filter=${filter}&page[size]=50`,
      headers,
      2
    );

    for (const action of actions) {
      const messages = await collectPages(
        `${KLAVIYO_BASE}/flow-actions/${encodeURIComponent(action.id)}/flow-messages?page[size]=50`,
        headers,
        2
      );

      for (const message of messages) {
        const subject = message?.attributes?.content?.subject || message?.attributes?.subject || '';
        if (normalize(subject) === normalize(TARGET_SUBJECT)) {
          return { flow, action, message };
        }
      }
    }
  }

  return null;
}

async function repairTemplate(messageId, headers) {
  const templateResponse = await apiRequest(
    `${KLAVIYO_BASE}/flow-messages/${encodeURIComponent(messageId)}/template`,
    { headers }
  );
  const template = templateResponse?.data;
  if (!template?.id) throw new Error('Klaviyo did not return a template for the matched flow message.');

  const editorType = template?.attributes?.editor_type || 'UNKNOWN';
  const attributes = {
    name: 'EW7 — Emerald Wellness Member Command Center',
    text: buildPlainText()
  };

  if (editorType === 'SYSTEM_DRAGGABLE') {
    attributes.definition = buildNativeDefinition();
  } else if (editorType === 'CODE' || editorType === 'USER_DRAGGABLE') {
    attributes.html = buildFullHtml();
  } else {
    throw new Error(`Unsupported Klaviyo template editor type: ${editorType}`);
  }

  await apiRequest(`${KLAVIYO_BASE}/templates/${encodeURIComponent(template.id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      data: {
        type: 'template',
        id: template.id,
        attributes
      }
    })
  });

  return { ok: true, templateId: template.id, editorType };
}

async function repairSender(actionId, headers) {
  try {
    const actionResponse = await apiRequest(
      `${KLAVIYO_BASE}/flow-actions/${encodeURIComponent(actionId)}`,
      { headers }
    );
    const definition = structuredClone(actionResponse?.data?.attributes?.definition);
    if (!definition) return { ok: false, reason: 'The flow action definition was unavailable.' };

    const message = locateEmailMessage(definition);
    if (!message) return { ok: false, reason: 'The email sender fields were not found in the flow action.' };

    message.from_email = 'welcome@emeraldwellness.health';
    message.from_label = 'Emerald Wellness';
    message.reply_to_email = 'support@emeraldwellness.health';
    message.subject_line = TARGET_SUBJECT;
    message.preview_text = 'One place for your Emerald Wellness membership experience.';

    await apiRequest(`${KLAVIYO_BASE}/flow-actions/${encodeURIComponent(actionId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        data: {
          type: 'flow-action',
          id: actionId,
          attributes: { definition }
        }
      })
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: sanitizeError(error) };
  }
}

function locateEmailMessage(definition) {
  if (definition?.data?.message) return definition.data.message;
  if (definition?.data?.main_action?.data?.message) return definition.data.main_action.data.message;
  return null;
}

function buildNativeDefinition() {
  return {
    body: {
      properties: {},
      styles: {},
      sections: [
        {
          content_type: 'section',
          type: 'section',
          data: { properties: {}, display_options: {}, styles: {} },
          rows: [
            {
              data: { styles: { column_layout: '1-column-full-width' } },
              columns: [
                {
                  data: {},
                  blocks: [
                    {
                      content_type: 'block',
                      type: 'text',
                      data: {
                        content: buildContentFragment(),
                        display_options: {},
                        styles: {}
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    styles: [
      { style_type: 'base-styles', properties: {}, styles: {} },
      { style_type: 'text-styles', styles: {} },
      { style_type: 'link-styles', styles: {} },
      { style_type: 'heading-1-styles', styles: {} },
      { style_type: 'heading-2-styles', styles: {} },
      { style_type: 'heading-3-styles', styles: {} },
      { style_type: 'heading-4-styles', styles: {} },
      { style_type: 'mobile-styles', properties: {}, styles: {} }
    ]
  };
}

function buildContentFragment() {
  return `<div style="background:#f3f0e7;padding:22px 10px;font-family:Arial,Helvetica,sans-serif;color:#102119;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dce4df;border-radius:16px;overflow:hidden;">
    <div style="background:#07583b;padding:30px 24px;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:700;letter-spacing:2px;color:#ffffff;">EMERALD <span style="color:#d8c56c;">WELLNESS</span></div>
      <div style="margin-top:9px;font-size:13px;color:#dbece4;">Know your biology. Optimize your life.</div>
    </div>
    <div style="padding:38px 32px 14px;text-align:center;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#80672a;font-weight:700;">Welcome to your membership experience</div>
      <h1 style="margin:14px 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.18;color:#102119;">Meet your Member<br>Command Center</h1>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#52645a;">Hi {{ person.first_name|default:'there' }}, your Emerald Wellness account access, educational tools, membership resources, and eligible benefits are organized in one secure place.</p>
    </div>
    <div style="padding:18px 32px 6px;">
      <div style="background:#f7f5ee;border:1px solid #e5dfc9;border-radius:12px;padding:22px;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#07583b;">Your next steps</p>
        <p style="margin:0 0 9px;font-size:14px;line-height:1.6;color:#52645a;"><strong>1. Open your Member Command Center</strong><br>Review your membership access, tools, and account details.</p>
        <p style="margin:0 0 9px;font-size:14px;line-height:1.6;color:#52645a;"><strong>2. Complete your member profile</strong><br>Choose broad wellness goals and personalize your educational experience.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#52645a;"><strong>3. Explore your next step</strong><br>Access education, provider-supported options, labs, supplements, vitamins, and membership resources where eligible.</p>
      </div>
    </div>
    <div style="padding:30px 32px 38px;text-align:center;">
      <a href="https://emeraldwellness.health/member-command-center" style="display:inline-block;background:#07583b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 28px;border-radius:9px;">Open My Member Command Center</a>
      <div style="margin-top:16px;font-size:13px;color:#6a786f;"><a href="https://emeraldwellness.health" style="color:#07583b;">emeraldwellness.health</a> &nbsp;•&nbsp; <a href="https://shop.emeraldwellness.health" style="color:#07583b;">shop.emeraldwellness.health</a></div>
    </div>
    <div style="background:#102119;padding:26px 24px;text-align:center;color:#cbd9d1;">
      <div style="font-size:14px;font-weight:700;color:#ffffff;">Know your biology. Optimize your life.</div>
      <div style="margin-top:10px;font-size:12px;line-height:1.6;">Questions? Reply to this email or contact support@emeraldwellness.health.</div>
      <div style="margin-top:12px;font-size:11px;line-height:1.55;color:#9fb0a6;">Emerald Wellness · 470 W Broad Street, Suite 1062 · Columbus, Ohio 43215</div>
      <div style="margin-top:11px;font-size:10px;line-height:1.55;color:#83958a;">Educational and wellness-support information only; not a replacement for medical advice, diagnosis, or treatment.</div>
      <div style="margin-top:13px;font-size:10px;"><a href="{% unsubscribe_link %}" style="color:#b8c9bf;text-decoration:underline;">Unsubscribe</a></div>
    </div>
  </div>
</div>`;
}

function buildFullHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${TARGET_SUBJECT}</title></head><body style="margin:0;padding:0;background:#f3f0e7;">${buildContentFragment()}</body></html>`;
}

function buildPlainText() {
  return `Welcome to Emerald Wellness.

Meet your Member Command Center.

Your account access, educational tools, membership resources, and eligible benefits are organized in one secure place.

Open your Member Command Center:
https://emeraldwellness.health/member-command-center

Website: https://emeraldwellness.health
Shop: https://shop.emeraldwellness.health

Know your biology. Optimize your life.

Questions? support@emeraldwellness.health

Unsubscribe: {% unsubscribe_link %}`;
}

async function collectPages(firstUrl, headers, maxPages) {
  const items = [];
  let url = firstUrl;
  for (let page = 0; url && page < maxPages; page += 1) {
    const response = await apiRequest(url, { headers });
    if (Array.isArray(response?.data)) items.push(...response.data);
    url = response?.links?.next || null;
  }
  return items;
}

async function apiRequest(url, options = {}, attempt = 0) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (_) {}

  if ((response.status === 429 || response.status >= 500) && attempt < 3) {
    const delay = Math.min(1000 * (attempt + 1), 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
    return apiRequest(url, options, attempt + 1);
  }

  if (!response.ok) {
    const detail = payload?.errors?.[0]?.detail || payload?.errors?.[0]?.title || text || `HTTP ${response.status}`;
    throw new Error(`Klaviyo API ${response.status}: ${detail}`);
  }
  return payload;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function sanitizeError(error) {
  return String(error?.message || error || 'Unknown error')
    .replace(/Klaviyo-API-Key\s+\S+/gi, 'Klaviyo-API-Key [hidden]')
    .slice(0, 900);
}

function sendPage(res, status, success, title, detail = '') {
  const color = success ? '#07583b' : '#8f2d2d';
  const safeTitle = escapeHtml(title);
  const safeDetail = escapeHtml(detail);
  return res.status(status).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Repair</title></head><body style="margin:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#102119;"><main style="max-width:680px;margin:60px auto;padding:0 20px;"><section style="background:#fff;border:1px solid #dce4df;border-radius:18px;padding:38px;box-shadow:0 12px 36px rgba(10,35,24,.08);"><div style="font-family:Georgia,serif;letter-spacing:2px;color:#07583b;font-size:20px;font-weight:700;">EMERALD <span style="color:#a68c3e;">WELLNESS</span></div><h1 style="margin:24px 0 12px;font-family:Georgia,serif;font-size:30px;color:${color};">${safeTitle}</h1>${safeDetail ? `<p style="font-size:16px;line-height:1.7;color:#52645a;">${safeDetail}</p>` : ''}<p style="margin-top:26px;font-weight:700;color:#07583b;">Know your biology. Optimize your life.</p></section></main></body></html>`);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
