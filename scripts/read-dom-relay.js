import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const s = fs.readFileSync(path.join(root, 'content-bridge.js'), 'utf8');
const start = s.indexOf('async function _0x41d6');
console.log(s.slice(start, start + 3500));
