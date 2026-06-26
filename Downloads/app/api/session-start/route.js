import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS Preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req) {
  try {
    const { license_key, device_id } = await req.json();

    if (!license_key || !device_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing license_key or device_id' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // লাইসেন্স চেক
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .single();

    if (!license) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid license' }), {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // নতুন সেশন তৈরি
    const session_id = crypto.randomUUID();

    await supabase.from('sessions').insert({
      session_id,
      license_key,
      device_id,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      session_id,
      message: 'Session started successfully'
    }), {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}