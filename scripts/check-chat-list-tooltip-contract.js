'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

const start = app.indexOf('renderChatList()');
if (start < 0) throw new Error('missing renderChatList');
const end = app.indexOf('\n  // 打开旧会话', start);
const renderChatList = app.slice(start, end);

assertIncludes('chat list row computes full title', renderChatList, "const fullTitle = c.title || '未命名';");
assertIncludes('chat list row computes full cwd', renderChatList, "const fullCwd = c.cwd || '';");
assertIncludes('chat list row title combines title and cwd', renderChatList, "row.title = `${fullTitle}\\n${fullCwd || '未绑定目录'}`;");
assertIncludes('chat list visible title uses computed full title', renderChatList, '${escapeHtml(fullTitle)}');
assertIncludes('chat list visible cwd still uses tilde shortening', renderChatList, 'tilde(fullCwd)');

console.log('chat-list-tooltip contract ok');
