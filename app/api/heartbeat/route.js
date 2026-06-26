import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    const { license_key, device_id, session_token } = await request.json();

    if (!license_key || !device_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .single();

    if (!license) {
      return NextResponse.json(
        { success: false, error: 'License not found' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (session_token) {
      await supabase
        .from('sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', session_token);
    }

    return NextResponse.json(
      { success: true, message: 'Heartbeat received' },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}