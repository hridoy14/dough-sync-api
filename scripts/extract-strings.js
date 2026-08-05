import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'background.js',
  'lovable-feature-api.js',
  'content-bridge.js',
  'pageHook.js',
  'content.js',
  'license-guard.js',
  'extension-config.js'
];

const re = /['"]([a-zA-Z0-9_./:?#=-]{4,120})['"]/g;

for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  const m = new Set();
  let x;
  while ((x = re.exec(s))) {
    if (/lov|power|prompt|credit|token|native|proxy|send|api|project|license|gringow|command|strategy/i.test(x[1])) {
      m.add(x[1]);
    }
  }
  console.log('===', f, '===');
  [...m].sort().forEach((v) => console.log(v));
}
