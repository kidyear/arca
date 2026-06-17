'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceObjectMethod(src, name) {
  const start = src.indexOf(`  ${name}(`);
  if (start < 0) throw new Error(`missing chat method ${name}`);
  let depth = 0;
  let seen = false;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') { depth += 1; seen = true; }
    if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`chat method ${name} did not close`);
}

assertIncludes('chat input autosize method exists', app, 'resizeInput()');

const resizeInput = sliceObjectMethod(app, 'resizeInput');
assertIncludes('autosize resets height before measuring', resizeInput, "input.style.height = 'auto';");
assertIncludes('autosize clamps to css max height', resizeInput, 'Math.min(input.scrollHeight');
assertIncludes('autosize writes pixel height', resizeInput, "input.style.height = next + 'px';");
assertIncludes('autosize switches overflow when capped', resizeInput, 'input.style.overflowY');

assertIncludes('input event resizes and updates composer', app, "input.addEventListener('input', () => { this.resizeInput(); this.updateComposer(); });");
assertIncludes('new chat resets input size', app, 'this.resizeInput();');
assertIncludes('send clearing input resizes', app, "if (forcedText === undefined) { input.value = ''; this.resizeInput(); }");
assertIncludes('draft restore resizes input', app, 'this.resizeInput();\n        restored = true;');
assertIncludes('preview selection dispatches input for autosize', app, "input.dispatchEvent(new Event('input', { bubbles: true }));");

assertIncludes('chat input css keeps manual resize disabled', css, '#chat-input {');
assertIncludes('chat input css has max height', css, 'max-height:');
assertIncludes('chat input css starts with hidden overflow', css, 'overflow-y: hidden;');

assertIncludes('docs mention chat input autosize', docs, '对话输入框自动增高');

console.log('chat-input-autosize contract ok');
