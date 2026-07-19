'use strict';

const APPROVED_PROFILE_PROPERTIES = new Set([
  'first_name','last_name','email','phone_number','country','state','city','member_status',
  'membership_tier','customer_type','lifecycle_stage','acquisition_source','acquisition_campaign',
  'primary_wellness_goal','goal_category','interests','preferred_channel','email_consent_status',
  'email_consent_source','email_consent_timestamp','sms_consent_status','sms_consent_source',
  'sms_consent_timestamp','sms_consent_evidence_reference','last_purchase_date','first_purchase_date',
  'order_count','lifetime_value','last_engagement_date','concierge_interest','bodiescan_completed',
  'quiz_completed','referral_source','vip_status','profile_import_batch','data_quality_status'
]);

const SENSITIVE_PATTERNS = [
  /diagnos/i, /medical.?condition/i, /prescri/i, /medication/i, /peptide.?protocol/i,
  /lab.?result/i, /genetic.?result/i, /treatment.?plan/i, /medical.?record/i,
  /physician.?note/i, /insurance/i, /card.?number/i, /social.?security/i, /\bssn\b/i,
  /biomarker/i, /health.?history/i
];

function assertSafeProperties(properties = {}) {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    throw new ValidationError('properties must be an object');
  }
  for (const key of Object.keys(properties)) {
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      throw new ValidationError(`Sensitive profile property blocked: ${key}`);
    }
    if (!APPROVED_PROFILE_PROPERTIES.has(key)) {
      throw new ValidationError(`Profile property is not approved: ${key}`);
    }
  }
  return properties;
}

function assertConsent(input, expectedChannel) {
  const required = ['channel','consentStatus','consentSource','consentTimestamp','consentEvidenceReference'];
  if (!input || required.some((key) => !input[key])) throw new ConsentError('Documented consent fields are required');
  if (input.channel !== expectedChannel) throw new ConsentError('Consent channel does not match operation');
  if (input.consentStatus !== 'subscribed') throw new ConsentError('Consent status must be subscribed');
  if (Number.isNaN(Date.parse(input.consentTimestamp))) throw new ConsentError('Consent timestamp is invalid');
  if (expectedChannel === 'sms' && !String(input.phone_number || '').startsWith('+')) {
    throw new ConsentError('SMS consent requires an E.164 phone number');
  }
  return input;
}

class ValidationError extends Error { constructor(message) { super(message); this.name = 'ValidationError'; this.status = 400; } }
class ConsentError extends ValidationError { constructor(message) { super(message); this.name = 'ConsentError'; } }

module.exports = { APPROVED_PROFILE_PROPERTIES, assertSafeProperties, assertConsent, ValidationError, ConsentError };
