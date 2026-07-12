export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function OPTIONS() {
  const supabase = createClient(
    process.env.MY_SUPABASE_URL,
    process.env.MY_SERVICE_ROLE_KEY
  );

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
  const supabase = createClient(
    process.env.MY_SUPABASE_URL,
    process.env.MY_SERVICE_ROLE_KEY
  );

  try {
    const { license_key, device_id } = await request.json();

    if (!license_key || !device_id) {
      return NextResponse.json(
        { success: false, error: 'Missing license_key or device_id' },
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
        { success: false, error: 'Invalid license' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!license.is_active) {
      return NextResponse.json(
        { success: false, error: 'License is suspended' },
        { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const sessionId = crypto.randomUUID();

    await supabase
      .from('sessions')
      .insert({
        session_id: sessionId,
        license_id: license.id,
        device_id: device_id,
      });

    return NextResponse.json(
      {
        success: true,
        session_id: sessionId,
        user_name: license.user_name,
        expires_at: license.expires_at,
        activated_at: license.activated_at,
        status: license.status,
      },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}