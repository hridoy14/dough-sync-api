import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'background.js'), 'utf8');

// Pull only decoder helpers (stop before chrome.* listeners)
const end = code.indexOf('chrome[a0_0x56f5f1');
const decoderCode = code.slice(0, end);

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(decoderCode, sandbox);

const actionArg = -0xc9d + -0xec1 * -0x1 + 0x31 * -0x7;
console.log('relay action arg', actionArg, '=>', sandbox.a0_0x11fe(actionArg));

// content-bridge relay action - search for onMessage listener comparing action
const cb = fs.readFileSync(path.join(root, 'content-bridge.js'), 'utf8');
const m = cb.match(/request\[_0x[a-f0-9]+\(([^)]+)\)\]===_0x[a-f0-9]+\(([^)]+)\)/);
if (m) {
  const cbEnd = cb.indexOf('chrome.runtime.onMessage');
  const cbDecoder = cb.slice(0, cb.indexOf('chrome.runtime.onMessage'));
  const sb2 = {};
  vm.createContext(sb2);
  try {
    vm.runInContext(cbDecoder, sb2);
    const arg2 = eval(m[2]);
    const decoderName = m[0].split('===')[1].split('(')[0];
    console.log('content-bridge action', decoderName, arg2, '=>', sb2[decoderName.replace('_0x', '_0x')](arg2));
  } catch (e) {
    console.log('cb decode err', e.message);
  }
}

// Find all action === patterns in content-bridge
const re = /===(_0x[a-f0-9]+)\((-?0x[a-f0-9]+(?:\+-?0x[a-f0-9]+)*)\)/g;
let hit;
const sb3 = {};
vm.createContext(sb3);
vm.runInContext(cb.slice(0, cb.indexOf('chrome.runtime.onMessage')), sb3);
while ((hit = re.exec(cb)) !== null) {
  try {
    const val = sb3._0x309d(eval(hit[2])) || sb3.a0_0x13c7?.(eval(hit[2]));
    if (val && /prompt|relay|send|message/i.test(val)) console.log('cb action candidate:', val);
  } catch (e) { /* ignore */ }
}
