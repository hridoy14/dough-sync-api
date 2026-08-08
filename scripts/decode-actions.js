import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function evalDecoder(file, decoderName, hexArg) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  const sandbox = { console, window: {}, chrome: {}, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const fn = sandbox[decoderName];
  if (!fn) {
    console.log(file, 'missing', decoderName);
    return null;
  }
  return fn(hexArg);
}

// background sendPromptOnTab action: _0x20d4aa(-0xc9d+-0xec1*-0x1+0x31*-0x7)
const bgAction = evalDecoder('background.js', 'a0_0x11fe', -0xc9d + -0xec1 * -0x1 + 0x31 * -0x7);
console.log('background relay action:', bgAction);

// content-bridge message listener action
const cb = fs.readFileSync(path.join(root, 'content-bridge.js'), 'utf8');
const actionMatch = cb.match(/request\[['"]action['"]\]\s*===\s*(_0x[a-f0-9]+)\(([^)]+)\)/);
if (actionMatch) {
  const decoded = evalDecoder('content-bridge.js', actionMatch[1], eval(actionMatch[2]));
  console.log('content-bridge action:', decoded);
}

// native postMessage type
const typeIdx = cb.indexOf("'type':");
const chunk = cb.slice(cb.indexOf('function _0x4a2dac'), cb.indexOf('function _0x4a2dac') + 2500);
const typeCall = chunk.match(/'type':(_0x[a-f0-9]+\([^)]+\))/);
if (typeCall) {
  const expr = typeCall[1];
  const fnMatch = expr.match(/^(_0x[a-f0-9]+)\((.+)\)$/);
  if (fnMatch) {
    const decoded = evalDecoder('content-bridge.js', 'a0_0x13c7', eval(fnMatch[2]));
    console.log('native postMessage type:', decoded);
  }
}
