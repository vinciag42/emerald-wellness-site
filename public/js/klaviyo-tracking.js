(function (window, document) {
  'use strict';
  const publicId = document.currentScript?.dataset.companyId || window.KLAVIYO_PUBLIC_API_KEY;
  window.klaviyo = window.klaviyo || [];
  if (publicId && !document.querySelector('script[data-ew-klaviyo-loader]')) {
    const loader = document.createElement('script'); loader.async = true; loader.dataset.ewKlaviyoLoader = 'true';
    loader.src = `https://static.klaviyo.com/onsite/js/${encodeURIComponent(publicId)}/klaviyo.js`;
    document.head.appendChild(loader);
  }
  const goals = new Set(['Healthy Weight','Energy and Vitality','Healthy Aging','Fitness and Recovery','Hair, Skin and Nails','General Wellness','Women\'s Wellness','Men\'s Wellness']);
  const clean = (value) => Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined && item !== null && ['string','number','boolean'].includes(typeof item)));
  const track = (name, properties) => window.klaviyo.push(['track', name, clean(properties)]);
  window.EmeraldKlaviyo = Object.freeze({
    identifyKnownVisitor(identity) { if (identity?.email || identity?.phone_number) window.klaviyo.push(['identify', clean(identity)]); },
    trackViewedProduct: (p) => track('Product Viewed', p), trackViewedCategory: (p) => track('Category Viewed', p),
    trackAddedToCart: (p) => track('Added to Cart', p), trackStartedCheckout: (p) => track('Started Checkout', p),
    trackMembershipViewed: (p) => track('Membership Viewed', p), trackBodyScanRequested: (p) => track('BodyScan Requested', p),
    trackQuizCompleted(p = {}) { track('Goal Quiz Completed', { goal_category: goals.has(p.goal_category) ? p.goal_category : 'General Wellness', source_page: p.source_page }); },
    trackConsultationRequested: (p) => track('Consultation Requested', p)
  });
}(window, document));
