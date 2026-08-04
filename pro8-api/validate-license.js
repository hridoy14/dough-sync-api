/**
 * Lovable Pro — validate-license core logic
 * Deploy to pro8.lovable.app/api/public/validate-license
 *
 * Env:
 *   DATABASE_URL          PostgreSQL connection string (Supabase)
 *   LICENSE_SESSION_SECRET  HMAC secret for session tokens (min 32 chars)
 *   SESSION_HOURS           default 24
 */

import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

const SESSION_HOURS = Number(process.env.SESSION_HOURS || 24);
const SESSION_SECRET = process.env.LICENSE_SESSION_SECRET || '';

let pool;

function db() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
}

function normalizeKey(key) {
  return String(key || '').trim().toUpperCase();
}

function signSession(licenseId, deviceId, expiresAt) {
  const payload = `${licenseId}:${deviceId}:${expiresAt.toISOString()}`;
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

function buildPlanResponse(row, plan) {
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  const durationDays = plan.duration_days || 30;

  return {
    valid: true,
    status: row.status,
    plan_name: plan.name,
    plan_type: plan.plan_type,
    credits_remaining: plan.plan_type === 'credits' ? 0 : null,
    credits_total: plan.plan_type === 'credits' ? 0 : null,
    credits_used: 0,
    daily_minutes: plan.plan_type === 'trial' ? 120 : null,
    minutes_used_today: 0,
    minutes_remaining_today: plan.plan_type === 'trial' ? 120 : null,
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    duration_days: durationDays,
    max_devices: row.max_devices ?? plan.max_devices ?? 2,
    is_trial: plan.plan_type === 'trial',
    source: 'pro8'
  };
}

function fail(reason, message) {
  return { valid: false, error: reason, message: message || reason };
}

export async function validateLicense(body, meta = {}) {
  const key = normalizeKey(body.key);
  const deviceId = String(body.device_id || '').trim();
  const deviceLabel = String(body.device_label || '').trim().slice(0, 120);
  const credits = Number(body.credits || 0);

  if (!key || !key.startsWith('LI-')) {
    return fail('invalid_key', 'Invalid license key format');
  }
  if (!deviceId || deviceId.length < 8) {
    return fail('invalid_device', 'Device ID required');
  }
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    return fail('server_config', 'License server not configured');
  }

  const client = await db().connect();
  try {
    await client.query('begin');

    const licRes = await client.query(
      `select l.*, p.name as plan_name, p.plan_type, p.duration_days, p.max_devices as plan_max_devices
       from licenses l
       join plans p on p.id = l.plan_id
       where l.license_key = $1
       for update`,
      [key]
    );

    if (!licRes.rows.length) {
      await client.query(
        'insert into validation_logs (license_key, device_id, ip, success, reason) values ($1,$2,$3,false,$4)',
        [key, deviceId, meta.ip || null, 'not_found']
      );
      await client.query('commit');
      return fail('not_found', 'License key not found');
    }

    const row = licRes.rows[0];
    const plan = {
      name: row.plan_name,
      plan_type: row.plan_type,
      duration_days: row.duration_days,
      max_devices: row.plan_max_devices
    };

    if (row.status === 'revoked') {
      await client.query('commit');
      return fail('revoked', 'License has been revoked');
    }

    const now = new Date();
    let expiresAt = row.expires_at ? new Date(row.expires_at) : null;

    if (!expiresAt && !row.activated_at) {
      expiresAt = new Date(now.getTime() + plan.duration_days * 86400000);
      await client.query(
        'update licenses set activated_at = $1, expires_at = $2, status = $3, updated_at = now() where id = $4',
        [now, expiresAt, 'active', row.id]
      );
    } else if (!expiresAt && row.activated_at) {
      expiresAt = new Date(new Date(row.activated_at).getTime() + plan.duration_days * 86400000);
      await client.query(
        'update licenses set expires_at = $1, updated_at = now() where id = $2',
        [expiresAt, row.id]
      );
    }

    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      await client.query("update licenses set status = 'expired', updated_at = now() where id = $1", [row.id]);
      await client.query('commit');
      return fail('expired', 'License has expired');
    }

    const maxDevices = row.max_devices ?? plan.max_devices ?? 2;

    const devRes = await client.query(
      'select id from license_devices where license_id = $1 and device_id = $2',
      [row.id, deviceId]
    );

    if (!devRes.rows.length) {
      const countRes = await client.query(
        'select count(*)::int as c from license_devices where license_id = $1',
        [row.id]
      );
      if (countRes.rows[0].c >= maxDevices) {
        await client.query('commit');
        return fail('device_limit', 'Maximum devices reached for this license');
      }
      await client.query(
        'insert into license_devices (license_id, device_id, device_label) values ($1,$2,$3)',
        [row.id, deviceId, deviceLabel || null]
      );
    } else {
      await client.query(
        'update license_devices set last_seen_at = now(), device_label = coalesce($3, device_label) where license_id = $1 and device_id = $2',
        [row.id, deviceId, deviceLabel || null]
      );
    }

    const sessionExpires = new Date(now.getTime() + SESSION_HOURS * 3600000);
    const sessionToken = signSession(row.id, deviceId, sessionExpires);

    await client.query('delete from license_sessions where license_id = $1 and device_id = $2', [row.id, deviceId]);
    await client.query(
      'insert into license_sessions (license_id, device_id, session_token, expires_at) values ($1,$2,$3,$4)',
      [row.id, deviceId, sessionToken, sessionExpires]
    );

    await client.query(
      'insert into validation_logs (license_key, device_id, ip, success, reason) values ($1,$2,$3,true,$4)',
      [key, deviceId, meta.ip || null, 'ok']
    );

    await client.query('commit');

    const response = buildPlanResponse({ ...row, expires_at: expiresAt, status: 'active' }, plan);
    response.session_token = sessionToken;
    response.session_expires_at = sessionExpires.toISOString();
    response.credits = credits;
    return response;
  } catch (err) {
    await client.query('rollback');
    console.error('validate-license error', err);
    return fail('server_error', 'Internal server error');
  } finally {
    client.release();
  }
}

/** Express / Vercel / Node HTTP handler */
export async function handleValidateRequest(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }
  if (req.method !== 'POST') {
    return json(res, 405, fail('method_not_allowed', 'POST only'));
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      return json(res, 400, fail('invalid_json', 'Invalid JSON body'));
    }
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress;
  const result = await validateLicense(body, { ip });
  const status = result.valid ? 200 : 401;
  return json(res, status, result);
}

// Standalone server: node pro8-api/server.js
export default { validateLicense, handleValidateRequest };
