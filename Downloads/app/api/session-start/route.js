import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { license_key, device_id } = req.body;

  if (!license_key || !device_id) {
    return res.status(400).json({ success: false, error: 'Missing license_key or device_id' });
  }

  try {
    // লাইসেন্স চেক করা
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .single();

    if (error || !license) {
      return res.status(401).json({ success: false, error: 'Invalid license' });
    }

    // নতুন সেশন তৈরি
    const session_id = crypto.randomUUID();

    await supabase.from('sessions').insert({
      session_id,
      license_key,
      device_id,
      created_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      session_id,
      message: 'Session started successfully'
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}