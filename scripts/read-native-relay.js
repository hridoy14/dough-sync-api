import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const s = fs.readFileSync(path.join(root, 'content-bridge.js'), 'utf8');
const start = s.indexOf('function _0x4a2dac');
console.log(s.slice(start, start + 2200));
