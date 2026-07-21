'use strict';
const { KlaviyoClient } = require('../../lib/klaviyo-client');
const { ValidationError } = require('../../lib/marketing-validation');
const { createHash } = require('node:crypto');

const EVENTS = new Set(['Lead Captured','Newsletter Subscribed','SMS Consent Captured','SMS Consent Revoked','Goal Quiz Started','Goal Quiz Completed','BodyScan Requested','BodyScan Completed','Consultation Requested','Consultation Scheduled','Membership Viewed','Membership Started','Membership Upgraded','Membership Cancelled','Concierge Interest Submitted','Product Viewed','Category Viewed','Added to Cart','Started Checkout','Placed Order','Order Fulfilled','Review Requested','Review Submitted','Referral Shared','Referral Converted','Replenishment Due','Customer Reactivated']);
const SENSITIVE = /diagnos|medication|prescri|lab.?result|treatment|medical|genetic|insurance|biomarker/i;
const buckets = new Map(); const seen = new Map();

module.exports = async function handler(req, res) {
  const origin = req.headers.origin; const allowed = approvedOrigins();
  if (origin && allowed.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return allowed.has(origin) ? res.status(204).end() : res.status(403).json({ error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (origin && !allowed.has(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  if (!takeToken(req)) return res.status(429).json({ error: 'Too many requests' });
  try {
    const event = validateEvent(req.body || {}); pruneSeen();
    const key = createHash('sha256').update(event.unique_id).digest('hex');
    if (seen.has(key)) return res.status(200).json({ accepted: true, duplicate: true });
    const result = await new KlaviyoClient().createEvent(event.event_name, event.profile, event.properties, event.unique_id, event.timestamp);
    seen.set(key, Date.now()); return res.status(result?.dryRun ? 200 : 202).json({ accepted: true, dry_run: Boolean(result?.dryRun) });
  } catch (error) {
    const status = error instanceof ValidationError ? 400 : 502;
    console.error({ eventEndpointError: error.name, status, requestId: error.requestId });
    return res.status(status).json({ error: status === 400 ? error.message : 'Event could not be accepted' });
  }
};

function validateEvent(body) {
  if (!EVENTS.has(body.event_name)) throw new ValidationError('Unsupported event name');
  if (!body.unique_id || String(body.unique_id).length > 200) throw new ValidationError('unique_id is required');
  if (!body.profile?.email && !body.profile?.phone_number && !body.profile?.external_id) throw new ValidationError('A profile identifier is required');
  const timestamp = body.timestamp || new Date().toISOString(); if (Number.isNaN(Date.parse(timestamp))) throw new ValidationError('Invalid timestamp');
  const properties = body.properties || {}; if (hasSensitiveKey(properties)) throw new ValidationError('Sensitive event properties are prohibited');
  return { event_name: body.event_name, unique_id: String(body.unique_id), timestamp, profile: pick(body.profile, ['email','phone_number','external_id']), properties: pick(properties, ['source_page','campaign_attribution','utm_source','utm_medium','utm_campaign','utm_term','utm_content','item_id','plan_id','value','currency','goal_category']) };
}
function hasSensitiveKey(value) { return value && typeof value === 'object' && Object.entries(value).some(([k, v]) => SENSITIVE.test(k) || hasSensitiveKey(v)); }
function pick(value, keys) { return Object.fromEntries(keys.filter((key) => value[key] !== undefined).map((key) => [key, value[key]])); }
function approvedOrigins() { return new Set((process.env.KLAVIYO_APPROVED_ORIGINS || 'https://emeraldwellness.health,https://www.emeraldwellness.health,https://shop.emeraldwellness.health').split(',').map((x) => x.trim())); }
function takeToken(req) { const key = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0]; const now = Date.now(); const bucket = buckets.get(key) || { start: now, count: 0 }; if (now - bucket.start > 60_000) { bucket.start = now; bucket.count = 0; } bucket.count += 1; buckets.set(key, bucket); return bucket.count <= 60; }
function pruneSeen() { const cutoff = Date.now() - 86_400_000; for (const [key, value] of seen) if (value < cutoff) seen.delete(key); }
module.exports.validateEvent = validateEvent; module.exports.approvedOrigins = approvedOrigins;
