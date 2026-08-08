#!/usr/bin/env node
/**
 * LovaPilot — pre-flight root checker
 * Usage: cd scripts && node preflight-check.js
 * Build/Git er AGE run koro — root clean + complete kina automatically bojhe.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let errors = [], warns = [], oks = 0;
const ok = m => { oks++; };
const err = m => errors.push(m);
const warn = m => warns.push(m);
const exists = rel => fs.existsSync(path.join(ROOT, rel));

// ---------- 1) manifest.json ----------
const required = new Set();
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  ok('manifest.json parses');
} catch (e) { err('manifest.json parse FAILED: ' + e.message); }

if (manifest) {
  if (manifest.background && manifest.background.service_worker) required.add(manifest.background.service_worker);
  (manifest.content_scripts || []).forEach(cs => {
    (cs.js || []).forEach(f => required.add(f));
    (cs.css || []).forEach(f => required.add(f));
  });
  if (manifest.action) {
    if (manifest.action.default_popup) required.add(manifest.action.default_popup);
    Object.values(manifest.action.default_icon || {}).forEach(f => required.add(f));
  }
  Object.values(manifest.icons || {}).forEach(f => required.add(f));
  if (manifest.side_panel && manifest.side_panel.default_path) required.add(manifest.side_panel.default_path);
  (manifest.web_accessible_resources || []).forEach(w => (w.resources || []).forEach(f => required.add(f)));
}

// ---------- 2) HTML <script src>/<link href> ----------
for (const html of ['popup.html', 'sidepanel.html']) {
  if (!exists(html)) continue;
  const src = fs.readFileSync(path.join(ROOT, html), 'utf8');
  for (const m of src.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|data:|#|chrome)/.test(u)) continue;
    required.add(u.replace(/^\.\//, ''));
    if (!required.has(html)) required.add(html);
  }
}

// ---------- 3) importScripts chain ----------
const swPath = manifest && manifest.background && manifest.background.service_worker;
if (swPath && exists(swPath)) {
  const sw = fs.readFileSync(path.join(ROOT, swPath), 'utf8');
  for (const m of sw.matchAll(/importScripts\(([^)]*)\)/g)) {
    for (const q of m[1].matchAll(/'([^']+)'/g)) required.add(q[1]);
  }
}

// ---------- 4) all required files exist? ----------
for (const f of [...required].sort()) {
  if (exists(f)) { ok('found: ' + f); continue; }
  if (f === 'integrity-manifest.json') { warn('integrity-manifest.json root e NAI — dev-test e problem nai (guard dev-skip), build dist e FRESH banabe auto'); continue; }
  err('MISSING (manifest/html/sw referenced): ' + f);
}

// ---------- 5) sounds/ files (sounds.js runtime loads, fails silently jodi na thake) ----------
const SOUND_FILES = ['sounds/error-payment.mp3', 'sounds/error-ratelimit.mp3', 'sounds/error-token.mp3'];
if (!exists('sounds')) warn('sounds/ FOLDER NAI — original folder theke copy koro (sound effects OFF hobe, extension cholbe but silent)');
else SOUND_FILES.forEach(f => exists(f) ? ok('found: ' + f) : warn('sound file missing: ' + f));

// ---------- 6) root extra-file scan (build ROOT er sob copy kore dist e!) ----------
const ALLOWED_DIRS = new Set(['scripts', 'pro8-api', 'assets', 'sounds', '.git', 'node_modules', 'dist']);
const ALLOWED_FILES = new Set(['manifest.json', '.gitignore', 'lovapilot-release.zip']);
for (const entry of fs.readdirSync(ROOT)) {
  const full = path.join(ROOT, entry);
  const isDir = fs.statSync(full).isDirectory();
  if (isDir) { if (!ALLOWED_DIRS.has(entry)) warn('EXTRA folder in root: ' + entry + '/ (build e copy hobe — check koro)'); }
  else if (!required.has(entry) && !ALLOWED_FILES.has(entry)) {
    if (entry === 'integrity-manifest.json') warn('integrity-manifest.json root e STALE obosthay ache — build dist e notun banabe; eta delete kore dite paro');
    else err('EXTRA file in root: ' + entry + ' — build e copy hobe! Remove koro (junk build e dhukbe)');
  }
}

// ---------- 7) scripts/ folder count (info only — এর ভেতরের কিছুই build এ যায় না) ----------
console.log('   (info) scripts/ e ' + fs.readdirSync(__dirname).length + ' ta item ache — build scripts/ ke SKIP kore, kono dorkar nai');

// ---------- 8) config sanity (migration stamps) ----------
try {
  const cfg = fs.readFileSync(path.join(ROOT, 'extension-config.js'), 'utf8');
  if (!cfg.includes('hridoy14-dough-sync-api.vercel.app')) err('extension-config.js: Vercel validate URL NAI — puron file bosano hoyeche?');
  if (!cfg.includes('bcrzdgkyydfutrbcbbrt.supabase.co')) err('extension-config.js: notun Supabase URL NAI — puron file bosano hoyeche?');
  ['lovableinfy', 'unlimitedlovable'].forEach(bad => { if (cfg.includes(bad)) err('extension-config.js e forbidden string: ' + bad); });
  ok('extension-config.js migration URLs OK');
} catch (e) { err('extension-config.js read failed: ' + e.message); }

// ---------- 9) node_modules in scripts ----------
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'javascript-obfuscator'))) warn('scripts/node_modules/javascript-obfuscator NAI — `cd scripts && npm install` lagbe build er age');
else ok('scripts/node_modules OK');

// ---------- report ----------
console.log('================ LovaPilot PRE-FLIGHT CHECK ================');
console.log('Root: ' + ROOT);
console.log('Required files (manifest/html/sw): ' + required.size + ' | found OK: ' + oks);
if (errors.length) { console.log('\n❌ ERRORS (' + errors.length + '):'); errors.forEach(e => console.log('   ❌ ' + e)); }
if (warns.length) { console.log('\n⚠ WARNINGS (' + warns.length + '):'); warns.forEach(w => console.log('   ⚠ ' + w)); }
console.log('\n' + (errors.length === 0 ? '✅ READY FOR BUILD: cd scripts && npm run build' : '❌ FIX THE ERRORS FIRST, tarpor build'));
process.exit(errors.length ? 1 : 0);
