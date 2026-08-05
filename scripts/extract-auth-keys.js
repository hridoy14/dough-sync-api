import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const f of ['lovable-auth.js', 'pageHook.js', 'background.js', 'content.js']) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  const parts = [];
  const re = /['"]([a-zA-Z0-9_]{2,50})['"]/g;
  let m;
  while ((m = re.exec(s))) parts.push(m[1]);
  const uniq = [...new Set(parts)].filter((v) =>
    /token|cookie|project|storage|local|auth|session|bearer|jwt|lovable/i.test(v)
  );
  console.log('\n===', f, '===');
  uniq.sort().forEach((v) => console.log(v));
}
