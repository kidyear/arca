'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(source, name) {
  const markers = [`async function ${name}(`, `function ${name}(`];
  let start = -1;
  for (const marker of markers) {
    start = source.indexOf(marker);
    if (start >= 0) break;
  }
  if (start < 0) throw new Error(`${name} function missing`);
  const next = source.indexOf('\nasync function ', start + 1);
  const nextPlain = source.indexOf('\nfunction ', start + 1);
  const ends = [next, nextPlain].filter((i) => i >= 0);
  return source.slice(start, ends.length ? Math.min(...ends) : undefined);
}

[
  'openDocxPreview',
  'commitRename',
  'trashSelection',
  'deleteSelectionPermanent',
  'clipSet',
  'clipPaste',
  'shortcutClipboard',
  'pasteShortcutFromClipboard',
  'doTrash',
  'doDeletePermanent',
  'doCreate',
  'addNetworkLocation',
].forEach((name) => {
  const body = sliceFunction(app, name);
  assertIncludes(`${name} uses friendlyErrorText`, body, 'friendlyErrorText(');
});

[
  "toast('保存失败: ' + err.message, true)",
  "toast('重命名失败：' + r.error, true)",
  "toast('删除失败：' + r.error, true)",
  "toast('永久删除失败：' + r.error, true)",
  "toast('新建失败：' + r.error, true)",
  "toast('读取剪贴板失败：' + clipReadError, true)",
  "toast('读取剪贴板失败：' + clip.error, true)",
  "toast('网络位置不可用：' + ((r && r.error) || '无法访问'), true)",
  "toast('添加失败：' + saved.error, true)",
  "error: err.message",
].forEach((bad) => {
  if (app.includes(bad)) throw new Error(`raw file operation error text remains: ${bad}`);
});

console.log('file-operation-friendly-error contract ok');
