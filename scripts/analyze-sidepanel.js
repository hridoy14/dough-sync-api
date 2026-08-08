import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const s = fs.readFileSync(path.join(root, 'sidepanel.js'), 'utf8');

// Find chrome.runtime.sendMessage payloads
const idxs = [];
let pos = 0;
while ((pos = s.indexOf('sendM', pos)) !== -1) {
  idxs.push(pos);
  pos++;
}
console.log('sendMessage count', idxs.length);
for (const i of idxs) {
  console.log('\n---', i, '---');
  console.log(s.slice(i - 250, i + 350).replace(/\n/g, ' '));
}
