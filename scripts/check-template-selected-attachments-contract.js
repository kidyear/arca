'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('selected template attachment helper', app, 'function templateSelectedAttachmentPaths()');
assertIncludes('helper uses current file selection', app, 'selEntries().filter((e) => e && !e.isDir && !e.isDrive)');
assertIncludes('template run picks selected files before failing', app, 'const picked = templateSelectedAttachmentPaths();');
assertIncludes('template run attaches every selected file', app, 'picked.forEach((p) => chat.addAttachment(p));');
assertIncludes('template run gives feedback', app, '已用当前选中的');
assertIncludes('template still falls back to explicit attach error', app, "toast('这个模板需要先把文件拖进对话区作为附件', true);");
assertIncludes('template picker copy mentions select or drag', app, '选卡片 → 选/拖文件 → 填一两句 → 开工');
assertIncludes('template file hint mentions selected files', app, '选中文件或拖进对话区作为附件');

console.log('template-selected-attachments contract ok');
