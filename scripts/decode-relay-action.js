import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'background.js'), 'utf8');

// Extract sendPromptOnTab action by evaluating decoder near the function
const marker = "chrome[_0x20d4aa(-0x2448+0x1431+0x116b)]['sendM'+_0x21b84e(0x264)+'e'](_0x4c0496,{'action':";
const idx = code.indexOf('sendPromptOnTab');
const chunk = code.slice(idx, idx + 1200);
console.log(chunk);
