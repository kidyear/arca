'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function sliceFunction(name) {
  const start = app.indexOf(`  ${name}()`);
  if (start < 0) throw new Error(`${name} missing`);
  const next = app.indexOf('\n  // 打开旧会话', start + 1);
  return app.slice(start, next < 0 ? app.length : next);
}

const renderChatList = sliceFunction('renderChatList');

if (!renderChatList.includes('await confirmDialog')) {
  throw new Error('chat delete must ask for confirmation before calling the delete API');
}

if (!renderChatList.includes('删除这个对话？')) {
  throw new Error('chat delete confirmation should use a clear Chinese prompt');
}

if (!renderChatList.includes('fullTitle')) {
  throw new Error('chat delete confirmation should include the chat title context');
}

const confirmIndex = renderChatList.indexOf('await confirmDialog');
const deleteIndex = renderChatList.indexOf('/api/ai/chat-delete');
if (confirmIndex < 0 || deleteIndex < 0 || confirmIndex > deleteIndex) {
  throw new Error('chat delete confirmation must happen before /api/ai/chat-delete');
}

if (!/if\s*\([^)]*confirm[^)]*\)\s*return;/.test(renderChatList) && !/if\s*\(\s*!ok\s*\)\s*return;/.test(renderChatList)) {
  throw new Error('chat delete cancel path must return before deleting');
}

console.log('chat-delete-confirm contract ok');
