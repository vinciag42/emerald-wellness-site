/** Resolve subscribe API URL for file://, static local servers, and live Vercel hosting */
(function (global) {
  const LIVE_SITE_ORIGIN = 'https://emerald-wellness-site.vercel.app';

  function getSubscribeApiUrl() {
    if (global.location.protocol === 'file:') {
      return LIVE_SITE_ORIGIN + '/api/subscribe';
    }
    const host = global.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      const port = global.location.port;
      if (!port || port === '5500' || port === '8080' || port === '8000' || port === '1000') {
        return LIVE_SITE_ORIGIN + '/api/subscribe';
      }
    }
    return global.location.origin + '/api/subscribe';
  }

  global.LIVE_SITE_ORIGIN = LIVE_SITE_ORIGIN;
  global.getSubscribeApiUrl = getSubscribeApiUrl;
})(window);
