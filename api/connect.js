// api/connect.js
// Emerald Wellness — Unified API Handler
// Connects: Supabase + Klaviyo + Claude AI

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    switch (action) {

      case 'supabase-stats': {
        const sbRes = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/waitlist?select=id,email,created_at&order=created_at.desc&limit=50`,
          { headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
        );
        const waitlist = await sbRes.json();
        const membersRes = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/members?select=id,email,tier,status,created_at&order=created_at.desc&limit=100`,
          { headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
        );
        const members = membersRes.ok ? await membersRes.json() : [];
        return res.status(200).json({
          waitlistCount: Array.isArray(waitlist) ? waitlist.length : 0,
          recentSignups: Array.isArray(waitlist) ? waitlist.slice(0, 10) : [],
          memberCount: Array.isArray(members) ? members.length : 0,
          members: Array.isArray(members) ? members.slice(0, 20) : []
        });
      }

      case 'supabase-add-lead': {
        const { email, name, source, tier_interest } = req.body;
        const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/waitlist`, {
          method: 'POST',
          headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify({ email, name, source: source || 'command-center', tier_interest, created_at: new Date().toISOString() })
        });
        const newLead = await insertRes.json();
        return res.status(200).json({ success: true, lead: newLead });
      }

      case 'klaviyo-stats': {
        const klRes = await fetch('https://a.klaviyo.com/api/lists/XEEg3P/profiles/?page[size]=1', {
          headers: { 'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`, 'revision': '2024-02-15' }
        });
        const klData = await klRes.json();
        return res.status(200).json({ totalProfiles: klData?.meta?.total || 0 });
      }

      case 'klaviyo-add-profile': {
        const { email, first_name, tier_interest, source } = req.body;
        const profileRes = await fetch('https://a.klaviyo.com/api/profiles/', {
          method: 'POST',
          headers: { 'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`, 'revision': '2024-02-15', 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { type: 'profile', attributes: { email, first_name: first_name || '', properties: { tier_interest, source } } } })
        });
        const profile = await profileRes.json();
        const profileId = profile?.data?.id;
        if (profileId) {
          await fetch('https://a.klaviyo.com/api/lists/XEEg3P/relationships/profiles/', {
            method: 'POST',
            headers: { 'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`, 'revision': '2024-02-15', 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [{ type: 'profile', id: profileId }] })
          });
        }
        return res.status(200).json({ success: true, profileId });
      }

      case 'klaviyo-trigger-flow': {
        const { email, flow_name, properties } = req.body;
        const eventRes = await fetch('https://a.klaviyo.com/api/events/', {
          method: 'POST',
          headers: { 'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`, 'revision': '2024-02-15', 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { type: 'event', attributes: { properties: properties || {}, metric: { data: { type: 'metric', attributes: { name: flow_name } } }, profile: { data: { type: 'profile', attributes: { email } } } } } })
        });
        return res.status(200).json({ success: eventRes.ok });
      }

      case 'claude-generate': {
        const { prompt, system } = req.body;
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system: system || 'You are the AI engine for Emerald Wellness LLC.', messages: [{ role: 'user', content: prompt }] })
        });
        const aiData = await aiRes.json();
        return res.status(200).json({ text: aiData.content?.[0]?.text || 'Generation failed.' });
      }

      case 'sync-lead': {
        const { email, name, tier_interest, source } = req.body;
        const results = {};
        try {
          const sbRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/waitlist`, {
            method: 'POST',
            headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ email, name, source, tier_interest, created_at: new Date().toISOString() })
          });
          results.supabase = sbRes.ok ? 'synced' : 'error';
        } catch(e) { results.supabase = 'error'; }
        try {
          const pRes = await fetch('https://a.klaviyo.com/api/profiles/', {
            method: 'POST',
            headers: { 'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`, 'revision': '2024-02-15', 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { type: 'profile', attributes: { email, first_name: name || '', properties: { tier_interest, source } } } })
          });
          const pd = await pRes.json();
          if (pd?.data?.id) {
            await fetch('https://a.klaviyo.com/api/lists/XEEg3P/relationships/profiles/', {
              method: 'POST',
              headers: { 'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`, 'revision': '2024-02-15', 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: [{ type: 'profile', id: pd.data.id }] })
            });
          }
          results.klaviyo = 'synced';
        } catch(e) { results.klaviyo = 'error'; }
        return res.status(200).json({ success: true, results });
      }

      default:
        return res.status(400).json({ error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
