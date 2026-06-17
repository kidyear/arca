'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceAsyncFunction(source, name) {
  const start = source.indexOf(`async function ${name}`);
  if (start < 0) throw new Error(`${name} function missing`);
  const next = source.indexOf('\nasync function ', start + 1);
  return source.slice(start, next > start ? next : undefined);
}

const enterEditMode = sliceAsyncFunction(app, 'enterEditMode');
const mdEditor = sliceAsyncFunction(app, 'mdEditor');

assertIncludes('plain text editor save has unknown fallback', enterEditMode, "toast('保存失败：' + (r.error || '未知错误'), true);");
assertIncludes('markdown editor save has unknown fallback', mdEditor, "toast('保存失败：' + (r.error || '未知错误'), true);");
assertIncludes('markdown editor keeps status feedback', mdEditor, "setStatus('保存失败');");

if (enterEditMode.includes("toast('保存失败：' + (r.error || ''), true)")) {
  throw new Error('plain text editor save failure must not leave an empty toast suffix');
}
if (mdEditor.includes("toast('保存失败：' + (r.error || ''), true)")) {
  throw new Error('markdown editor save failure must not leave an empty toast suffix');
}

console.log('text-editor-save-error contract ok');
