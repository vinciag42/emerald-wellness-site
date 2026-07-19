(function (window, document) {
  'use strict';
  const cfg = window.EmeraldMarketingConsent;
  if (!cfg) throw new Error('Load config/marketing-consent.js before klaviyo-consent.js');
  function disclosureHtml() {
    return `By checking this box, you agree to receive recurring automated marketing texts from ${cfg.brandName}. Consent is not a condition of purchase. Message and data rates may apply. ${cfg.defaultFrequencyText} Reply ${cfg.stopKeyword} to opt out or ${cfg.helpKeyword} for help. <a href="${cfg.termsUrl}">Terms</a> and <a href="${cfg.privacyUrl}">Privacy Policy</a>.`;
  }
  function mount(form) {
    const target = form.querySelector('[data-ew-sms-disclosure]'); if (target) target.innerHTML = disclosureHtml();
    const sms = form.querySelector('[name="sms_consent"]'); if (sms) { sms.checked = false; sms.required = false; }
    form.addEventListener('submit', () => {
      const id = form.querySelector('[name="form_submission_id"]') || Object.assign(document.createElement('input'), { type: 'hidden', name: 'form_submission_id' });
      if (!id.parentNode) form.appendChild(id); id.value ||= crypto.randomUUID();
      const fields = { consent_timestamp: new Date().toISOString(), consent_source: `${location.pathname}#${form.id || 'form'}`, consent_disclosure_version: cfg.disclosureVersion };
      Object.entries(fields).forEach(([name, value]) => { let input = form.querySelector(`[name="${name}"]`); if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = name; form.appendChild(input); } input.value = value; });
    });
  }
  function mountAll() {
    document.querySelectorAll('[data-ew-sms-disclosure]').forEach((target) => { target.innerHTML = disclosureHtml(); });
    document.querySelectorAll('[data-ew-consent-form]').forEach(mount);
  }
  window.EmeraldConsent = Object.freeze({ mount, disclosureHtml, mountAll });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.EmeraldConsent.mountAll); else window.EmeraldConsent.mountAll();
}(window, document));
