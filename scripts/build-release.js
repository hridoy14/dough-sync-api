#!/usr/bin/env node
/**
 * LovaPilot — protected release build
 * Usage: cd scripts && npm install && npm run build
 * Output: ../dist/ and ../lovapilot-release.zip
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ZIP_PATH = path.join(ROOT, 'lovapilot-release.zip');

const OBFUSCATE_JS = [
  'background.js',
  'content.js',
  'content-bridge.js',
  'content-templates.js',
  'extension-config.js',
  'hwFingerprint.js',
  'integrity-guard.js',
  'license-guard.js',
  'license-v2.js',
  'lovable-auth.js',
  'lovable-feature-api.js',
  'pageHook.js',
  'popup.js',
  'sidepanel.js',
  'sidepanel-templates.js',
  'sounds.js',
  'user-messages.js'
];

const INTEGRITY_FILES = [
  'extension-config.js',
  'license-v2.js',
  'license-guard.js',
  'background.js',
  'background-sw.js',
  'integrity-guard.js',
  'content.js',
  'popup.js'
];

const SKIP_COPY = new Set(['dist', 'scripts', 'pro8-api', 'node_modules', '.git']);

const SKIP_FILES = new Set([
  'lovable-pro-icon-master.png',
  'icon.jpg',
  'icon64.png',
  '.gitignore',
  'integrity-manifest.json'
]);

const OBF_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  renameGlobals: false,
  selfDefending: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (SKIP_COPY.has(entry) && src === ROOT) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    if (SKIP_FILES.has(path.basename(src))) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function patchIntegrityGuard(distPath) {
  const file = path.join(distPath, 'integrity-guard.js');
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace('var INTEGRITY_DEV_SKIP = true;', 'var INTEGRITY_DEV_SKIP = false;');
  fs.writeFileSync(file, src, 'utf8');
}

function writeIntegrityManifest(distPath) {
  const files = INTEGRITY_FILES.map((rel) => ({
    path: rel.replace(/\\/g, '/'),
    sha256: sha256File(path.join(distPath, rel))
  }));

  const manifest = {
    version: 1,
    skip: false,
    generated_at: new Date().toISOString(),
    files
  };

  fs.writeFileSync(
    path.join(distPath, 'integrity-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log('Integrity hashes:', files.length, 'files');
}

function obfuscateJs(distPath) {
  for (const rel of OBFUSCATE_JS) {
    const full = path.join(distPath, rel);
    if (!fs.existsSync(full)) {
      console.warn('Skip missing:', rel);
      continue;
    }
    const code = fs.readFileSync(full, 'utf8');
    const out = JavaScriptObfuscator.obfuscate(code, OBF_OPTIONS).getObfuscatedCode();
    fs.writeFileSync(full, out, 'utf8');
    console.log('Obfuscated:', rel);
  }
}

function zipDist(distPath, zipPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(zipPath), { recursive: true });
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: distPath,
      ignore: ['**/*.zip']
    });
    archive.finalize();
  });
}

async function main() {
  console.log('Building LovaPilot release from', ROOT);

  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });
  copyRecursive(ROOT, DIST);

  patchIntegrityGuard(DIST);
  obfuscateJs(DIST);
  writeIntegrityManifest(DIST);

  await zipDist(DIST, ZIP_PATH);

  console.log('\nDone!');
  console.log('  Folder:', DIST);
  console.log('  ZIP:   ', ZIP_PATH);
  console.log('\nLoad unpacked from dist/ folder in chrome://extensions');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
