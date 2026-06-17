'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'public', 'i18n-dict.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nasync function ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('copyFile helper exists', app, 'async function copyFile(p)');
const copyFile = sliceFunction(app, 'copyFile');
assertIncludes('copyFile catches desktop clipboard bridge rejection', copyFile, "window.fanboxClipboard.copyFile(p).catch((err) => ({ ok: false, error: friendlyErrorText(err) }))");
assertIncludes('copyFile success message remains clear', copyFile, '已复制文件，可在系统文件管理器里粘贴');
assertIncludes('copyFile failure includes error detail', copyFile, "复制文件失败：' + (r.error || '未知错误')");
assertIncludes('copy file tooltip i18n uses Windows-neutral file manager wording', i18n, "'复制文件（系统文件管理器可粘贴）': 'Copy file (paste in system file manager)'");
assertIncludes('copy file success i18n uses Windows-neutral file manager wording', i18n, "'已复制文件，可在系统文件管理器里粘贴': 'File copied — paste it in the system file manager'");
assertIncludes('reveal success i18n uses file manager wording', i18n, "'已在文件管理器中显示': 'Revealed in file manager'");
assertIncludes('copyImage helper exists', app, 'async function copyImage(p)');
const copyImage = sliceFunction(app, 'copyImage');
assertIncludes('copyImage catches desktop clipboard bridge rejection', copyImage, "window.fanboxClipboard.copyImage(p).catch((err) => ({ ok: false, error: friendlyErrorText(err) }))");
assertIncludes('copyImage success message remains clear', copyImage, '已复制图片，可粘贴到其它应用');
assertIncludes('copyImage failure falls back to unknown error', copyImage, "复制图片失败：' + (r.error || '未知错误')");

console.log('preview-copy-file-error contract ok');
