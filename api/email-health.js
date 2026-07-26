export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendReady = Boolean(process.env.RESEND_API_KEY);
  const supabaseUrlReady = Boolean(process.env.SUPABASE_URL);
  const supabaseServiceReady = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  );

  return res.status(200).json({
    ready: resendReady && supabaseUrlReady && supabaseServiceReady,
    resend_api_key_configured: resendReady,
    supabase_url_configured: supabaseUrlReady,
    supabase_service_role_configured: supabaseServiceReady,
    sender: process.env.RESEND_FROM_EMAIL || 'welcome@emeraldwellness.health',
    reply_to: process.env.RESEND_REPLY_TO || 'support@emeraldwellness.health'
  });
}
