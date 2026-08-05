import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const s = fs.readFileSync(path.join(root, 'content-bridge.js'), 'utf8');

let pos = 0;
while ((pos = s.indexOf("'nativ'", pos)) !== -1) {
  console.log('--- nativ at', pos);
  console.log(s.slice(pos - 200, pos + 350).replace(/\n/g, ' '));
  pos++;
}

console.log('\n=== form#input contexts ===');
pos = 0;
while ((pos = s.indexOf('form#', pos)) !== -1) {
  console.log(s.slice(pos - 100, pos + 200).replace(/\n/g, ' '));
  pos++;
}
