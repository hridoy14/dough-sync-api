import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['content-bridge.js', 'background.js', 'sidepanel.js', 'pageHook.js', 'content.js'];

for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  const parts = [];
  const re = /['"]([a-zA-Z0-9_#./:?#=\-\s]{2,100})['"]/g;
  let m;
  while ((m = re.exec(s))) parts.push(m[1]);
  const uniq = [...new Set(parts)].filter((v) =>
    /lov|power|prompt|credit|token|native|proxy|send|relay|bypass|command|strategy|bridge|hook|fetch|api|license|project|message|postMessage|ql_|disabled|fallback|dom|inject/i.test(v)
  );
  console.log('\n===', f, `(${uniq.length}) ===`);
  uniq.sort().forEach((v) => console.log(v));
}
