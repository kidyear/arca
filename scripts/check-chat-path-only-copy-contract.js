'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('chat empty explains path-only drag', html, '拖文件进来只附加路径');
assertIncludes('chat composer placeholder explains path-only drag', html, '拖文件进来只附加路径');
assertIncludes('chat drop overlay says path-only', css, "content: '松开 · 只附加路径给 AI'");
assertIncludes('guide explains terminal path insertion', app, '把文件/文件夹拖进终端</b> 只插入路径');
assertIncludes('template explicit attachment error says path', app, "toast('这个模板需要先把文件路径附加到对话区', true);");
assertIncludes('template picker mentions path attach', app, '选卡片 → 选文件/拖路径 → 填一两句 → 开工');
assertIncludes('template file hint mentions path attach', app, '选中文件或拖进对话区附加路径');
assertIncludes('docs records path-only copy polish', docs, '路径附件文案去歧义');

if (html.includes('拖文件进来作为附件')) throw new Error('chat composer must not imply uploading file content');
if (html.includes('把文件拖进来当附件')) throw new Error('chat empty state must not imply uploading file content');
if (css.includes('作为附件发给 AI')) throw new Error('drop overlay must say path-only');
if (app.includes('拖进对话区作为附件')) throw new Error('template copy must say path attachment');

console.log('chat-path-only-copy contract ok');
