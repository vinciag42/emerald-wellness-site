'use strict';

const { randomUUID } = require('node:crypto');
const { assertSafeProperties, assertConsent } = require('./marketing-validation');
const BASE_URL = 'https://a.klaviyo.com/api';

class KlaviyoApiError extends Error {
  constructor(message, details = {}) { super(message); this.name = 'KlaviyoApiError'; Object.assign(this, details); }
}

class KlaviyoClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey ?? process.env.KLAVIYO_PRIVATE_API_KEY;
    this.revision = options.revision ?? process.env.KLAVIYO_API_REVISION ?? '2026-07-15';
    this.dryRun = options.dryRun ?? String(process.env.KLAVIYO_DRY_RUN ?? 'true') !== 'false';
    this.fetch = options.fetch ?? global.fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = options.maxRetries ?? 3;
    this.logger = options.logger ?? console;
  }

  async request(path, options = {}) {
    const method = options.method ?? 'GET';
    const requestId = options.requestId ?? randomUUID();
    if (this.dryRun && method !== 'GET' && method !== 'HEAD') {
      this.logger.info?.({ requestId, method, path, dryRun: true }, 'Klaviyo mutation skipped');
      return { dryRun: true, requestId, method, path };
    }
    if (!this.apiKey) throw new KlaviyoApiError('KLAVIYO_PRIVATE_API_KEY is not configured', { requestId, status: 503 });
    const headers = {
      accept: 'application/vnd.api+json', 'content-type': 'application/vnd.api+json',
      revision: this.revision, authorization: `Klaviyo-API-Key ${this.apiKey}`,
      ...options.headers
    };
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetch(`${BASE_URL}${path}`, { ...options, method, headers, signal: controller.signal, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body });
        const responseRequestId = response.headers.get('x-request-id') || response.headers.get('x-klaviyo-request-id') || requestId;
        const text = await response.text();
        const payload = text ? safeJson(text) : null;
        if (response.ok) return payload;
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < this.maxRetries) {
          await delay(retryDelay(response.headers.get('retry-after'), attempt));
          continue;
        }
        throw new KlaviyoApiError('Klaviyo API request failed', { status: response.status, requestId: responseRequestId, errors: payload?.errors });
      } catch (error) {
        if (error.name === 'AbortError') throw new KlaviyoApiError('Klaviyo API request timed out', { status: 504, requestId });
        if (error instanceof KlaviyoApiError) throw error;
        if (attempt < this.maxRetries) { await delay(retryDelay(null, attempt)); continue; }
        throw new KlaviyoApiError('Klaviyo API request failed', { status: 502, requestId, cause: error.message });
      } finally { clearTimeout(timer); }
    }
  }

  async paginate(path, options = {}) {
    const rows = []; let next = path;
    while (next) { const page = await this.request(normalizeNext(next), options); rows.push(...(page?.data || [])); next = page?.links?.next || null; }
    return rows;
  }

  async createOrUpdateProfile(profile) {
    const attributes = { ...profile }; const properties = assertSafeProperties(attributes.properties || {}); delete attributes.properties;
    const found = attributes.email ? await this.getProfileByEmail(attributes.email) : attributes.phone_number ? await this.getProfileByPhone(attributes.phone_number) : null;
    const data = { type: 'profile', ...(found?.id ? { id: found.id } : {}), attributes: { ...attributes, properties } };
    return this.request(found?.id ? `/profiles/${found.id}` : '/profiles', { method: found?.id ? 'PATCH' : 'POST', body: { data } });
  }
  async getProfileByEmail(email) { return first(await this.request(`/profiles?filter=${encodeURIComponent(`equals(email,"${email}")`)}`)); }
  async getProfileByPhone(phone) { return first(await this.request(`/profiles?filter=${encodeURIComponent(`equals(phone_number,"${phone}")`)}`)); }
  async createEvent(name, profile, properties = {}, uniqueId, timestamp = new Date().toISOString()) {
    return this.request('/events', { method: 'POST', body: { data: { type: 'event', attributes: { properties, unique_id: uniqueId, time: timestamp, metric: { data: { type: 'metric', attributes: { name } } }, profile: { data: { type: 'profile', attributes: profile } } } } } });
  }
  async subscribeProfileToEmail(consent) { return this.subscribe(consent, 'email', process.env.KLAVIYO_MAIN_LIST_ID); }
  async subscribeProfileToSms(consent) { return this.subscribe(consent, 'sms', process.env.KLAVIYO_SMS_LIST_ID); }
  async subscribe(consent, channel, listId) {
    assertConsent(consent, channel); if (!listId) throw new Error(`Klaviyo ${channel} list ID is not configured`);
    const identifier = channel === 'email' ? { email: consent.email } : { phone_number: consent.phone_number };
    return this.request('/profile-subscription-bulk-create-jobs', { method: 'POST', body: { data: { type: 'profile-subscription-bulk-create-job', attributes: { historical_import: true, profiles: { data: [{ type: 'profile', attributes: { ...identifier, subscriptions: { [channel]: { marketing: { consent: 'SUBSCRIBED', consented_at: consent.consentTimestamp } } }, properties: { [`${channel}_consent_source`]: consent.consentSource, ...(channel === 'sms' ? { sms_consent_evidence_reference: consent.consentEvidenceReference } : {}) } } }] } }, relationships: { list: { data: { type: 'list', id: listId } } } } } });
  }
  async addProfileToList(profileId, listId) { return this.request(`/lists/${encodeURIComponent(listId)}/relationships/profiles`, { method: 'POST', body: { data: [{ type: 'profile', id: profileId }] } }); }
  getLists() { return this.paginate('/lists'); } getSegments() { return this.paginate('/segments'); } getFlows() { return this.paginate('/flows'); }
  getCampaigns(channel = 'email') { return this.paginate(`/campaigns?filter=${encodeURIComponent(`equals(messages.channel,"${channel}")`)}`); }
  createDraftCampaign(definition) { if (process.env.KLAVIYO_ALLOW_SCHEDULING === 'true') throw new Error('Draft creation must run with scheduling disabled'); return this.request('/campaigns', { method: 'POST', body: definition }); }
  getMetrics() { return this.paginate('/metrics'); }
  async healthCheck() { const lists = await this.request('/lists?page[size]=1'); return { ok: true, revision: this.revision, dryRun: this.dryRun, listAccess: Array.isArray(lists?.data) }; }
}

function first(payload) { return payload?.data?.[0] || null; }
function safeJson(text) { try { return JSON.parse(text); } catch { return { raw: text.slice(0, 500) }; } }
function normalizeNext(url) { return url.startsWith(BASE_URL) ? url.slice(BASE_URL.length) : url; }
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function retryDelay(header, attempt) { const seconds = Number(header); if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 60_000); const date = Date.parse(header); if (!Number.isNaN(date)) return Math.max(0, Math.min(date - Date.now(), 60_000)); return Math.min(500 * (2 ** attempt), 8_000); }

module.exports = { KlaviyoClient, KlaviyoApiError, BASE_URL, retryDelay };
