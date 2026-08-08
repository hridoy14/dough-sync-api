import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function findActions(file) {
  const s = fs.readFileSync(path.join(root, file), 'utf8');
  const hits = new Set();
  const patterns = [
    /action['"]?\s*:\s*['"]([a-zA-Z]+)['"]/g,
    /['"]([a-zA-Z]{4,16})['"]\s*\+\s*['"]([a-zA-Z]{4,16})['"]/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(s))) {
      if (m[2]) hits.add(m[1] + m[2]);
      else hits.add(m[1]);
    }
  }
  return [...hits]
    .filter((h) => /send|proxy|relay|prompt|deliver|fetch|lov|message/i.test(h))
    .sort();
}

for (const f of ['background.js', 'sidepanel.js', 'content-bridge.js', 'content.js']) {
  console.log('\n===', f, '===');
  findActions(f).forEach((h) => console.log(h));
}
