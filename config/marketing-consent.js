(function (root, factory) {
  const config = factory();
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.EmeraldMarketingConsent = config;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return Object.freeze({
    disclosureVersion: 'EW-SMS-2026-07-DRAFT-LEGAL-REVIEW',
    brandName: 'Emerald Wellness',
    termsUrl: 'https://emeraldwellness.health/terms',
    privacyUrl: 'https://emeraldwellness.health/privacy',
    helpKeyword: 'HELP',
    stopKeyword: 'STOP',
    defaultFrequencyText: 'Message frequency varies.'
  });
}));
