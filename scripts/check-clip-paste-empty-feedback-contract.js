'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

const clipPaste = sliceFunction(app, 'clipPaste');
assertIncludes('clipPaste checks internal and system clipboard', clipPaste, 'window.fanboxClipboard.readFiles');
assertIncludes('clipPaste remembers system clipboard read errors', clipPaste, "let clipReadError = '';");
assertIncludes('clipPaste stores readFiles error message', clipPaste, "clipReadError = friendlyErrorText(r, '读取失败');");
assertIncludes('clipPaste reports clipboard read failure separately', clipPaste, "if (clipReadError) { toast('读取剪贴板失败：' + friendlyErrorText(clipReadError), true); return; }");
assertIncludes('clipPaste gives feedback for empty clipboard', clipPaste, "toast('剪贴板中没有可粘贴的文件', true);");
assertIncludes('clipPaste stops after empty clipboard feedback', clipPaste, "if (!clip || !clip.paths.length) { toast('剪贴板中没有可粘贴的文件', true); return; }");
assertIncludes('clipPaste adds operation context to copy/move failure', clipPaste, "const pasteErrPrefix = clip.op === 'cut' ? '移动失败：' : '粘贴失败：';");
assertIncludes('clipPaste reports copy/move failure with context', clipPaste, "if (lastErr) toast(pasteErrPrefix + lastErr, true);");

console.log('clip-paste-empty-feedback contract ok');
