import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { license_key, device_id, session_token } = req.body;

  if (!license_key || !device_id) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    // লাইসেন্স চেক
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .single();

    if (!license) {
      return res.status(401).json({ success: false, error: 'License not found' });
    }

    // সেশন আপডেট করা
    if (session_token) {
      await supabase
        .from('sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', session_token);
    }

    return res.status(200).json({
      success: true,
      message: 'Heartbeat received'
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}