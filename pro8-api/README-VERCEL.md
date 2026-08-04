# LovaPilot — License API → Vercel Deploy Guide

## Route (deploy er por)
```
POST https://<tomar-vercel-project>.vercel.app/api/public/validate-license
```

## Files
| File | Kaj |
|---|---|
| `validate-license.js` | Core logic (pro8 — unchanged) |
| `api/public/validate-license.js` | Vercel serverless wrapper |
| `server.js` | Sudhu local test (`node server.js`, port 8787) |
| `package.json` | `pg` dependency |

## Deploy steps (Git diye)
1. `lovapilot/pro8-api/` folder ta Git repo-te push koro
2. vercel.com → **Add New Project** → ei repo import
3. **Root Directory** = repo root (monorepo hole je folder)
4. Framework: **Other** (auto-detect hobe `/api` serverless)
5. **Environment Variables** add koro (Project → Settings → Environment Variables):

| Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.bcrzdgkyydfutrbcbbrt:IDEABOX!3366@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres` ⚠️ query part (`?pgbouncer=true`) BAAD dio — node-postgres error debe |
| `LICENSE_SESSION_SECRET` | `f8ef7d50753fd6318b1cc3bdf033920ab8cfbfd005ec0506a8d5ccca253259f6` |
| `SESSION_HOURS` | `24` |

6. **Deploy** → shesh hole test:

```bash
curl -X POST https://<proj>.vercel.app/api/public/validate-license \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"LI-TEST-0001-0002-0003\",\"device_id\":\"test12345678\",\"device_label\":\"Chrome\",\"credits\":0}"
```

Expected: `"valid": true, ... "session_token": "..."`

⚠️ Ei LICENSE_SESSION_SECRET ta Supabase Edge Function secret-eo SAME dite hobe
(duto jayga ek-i token format verify korbe).
