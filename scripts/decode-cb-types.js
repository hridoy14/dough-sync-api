import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cb = fs.readFileSync(path.join(root, 'content-bridge.js'), 'utf8');
const stop = cb.indexOf('function _0x4a2dac');
const decoder = cb.slice(0, stop);
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(decoder, sandbox);

const a0_0x13c7 = sandbox.a0_0x13c7;
const _0x309d = sandbox._0x309d;

const exprs = {
  postType: '0xd3c+0x26a9*-0x1+0x1a49',
  listenEvent: '0x1dd0+-0x1*0x11a5+0x27*-0x49',
  removeEvent: '0x1ff9+0x165a+-0x3547',
  responseType: '0x1*0x19f9+0x3*0x47+-0x11e*0x17',
  successKey: '0x1ef',
  relayAction: '-0x137b*-0x2+-0x1*-0x180b+-0x3df6',
  view: '0x532+0xd2b+0x1*-0x112e',
  thread: '0x1bf'
};

for (const [name, expr] of Object.entries(exprs)) {
  const arg = eval(expr);
  const val = a0_0x13c7(arg) || _0x309d(arg);
  console.log(name, arg, '=>', val);
}
