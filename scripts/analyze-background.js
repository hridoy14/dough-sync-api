import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const s = fs.readFileSync(path.join(root, 'background.js'), 'utf8');

for (const term of ['ToLovable', 'qlSendViaW', 'sendPrompt', 'proxy', 'deliverPrompt', 'relay']) {
  let pos = 0;
  let c = 0;
  while ((pos = s.indexOf(term, pos)) !== -1 && c < 2) {
    console.log(`\n=== ${term} @ ${pos} ===`);
    console.log(s.slice(pos - 80, pos + 200).replace(/\n/g, ' '));
    pos++;
    c++;
  }
}
