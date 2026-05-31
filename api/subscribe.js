export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, first_name, phone, source } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const KLAVIYO_KEY = 'pk_WtKVHz_49f453ff604a0678196e1c8a13dff471df';
  const KLAVIYO_LIST = 'XEEg3P';
  const SUPABASE_URL = 'https://mczpuffmlspmghgneukz.supabase.co';
  const SUPABASE_ANON = 'sb_publishable_OAWniWdCQFuaqLledTmkEg_uuNnoK6S';

  try {
    // Save to Klaviyo
    const klaviyoRes = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2023-12-15'
      },
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [{
                type: 'profile',
                attributes: {
                  email,
                  first_name: first_name || '',
                  phone_number: phone || '',
                  subscriptions: {
                    email: { marketing: { consent: 'SUBSCRIBED' } }
                  }
                }
              }]
            }
          },
          relationships: {
            list: { data: { type: 'list', id: KLAVIYO_LIST } }
          }
        }
      })
    });

    // Save to Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email, first_name, phone, source: source || 'landing', created_at: new Date().toISOString() })
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
