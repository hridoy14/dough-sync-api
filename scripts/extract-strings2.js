import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['pageHook.js', 'sidepanel.js', 'content.js', 'lovable-feature-api.js'];

for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  const decoded = [];
  const re = /['"]([a-zA-Z0-9_#./:?#=\-\s]{3,120})['"]/g;
  let x;
  while ((x = re.exec(s))) decoded.push(x[1]);
  const interesting = [...new Set(decoded)].filter((v) =>
    /lov|power|prompt|credit|token|native|proxy|send|relay|bypass|command|strategy|bridge|hook|fetch|api/i.test(v)
  );
  console.log('\n===', f, '===');
  interesting.sort().forEach((v) => console.log(v));
}
