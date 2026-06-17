'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('chat path regex exists', app, 'const CHAT_PATH_RE =');
assertIncludes('relative local path resolver exists', app, 'function resolveChatLocalPath(raw, baseDir = state.cwd)');
assertIncludes('relative path joins current directory', app, "return joinLocalPath(baseDir, text.replace(/^[.][\\\\/]/, ''));");
assertIncludes('chat path action accepts base directory', app, 'function chatPathActionNode(raw, baseDir = state.cwd)');
assertIncludes('chat path enhancement accepts base directory', app, 'function enhanceChatPathActions(root, baseDir = state.cwd)');
assertIncludes('chat path opener exists', app, 'async function openChatPathReference(raw)');
assertIncludes('chat path open failure keeps backend reason', app, "toast('没找到路径：' + baseOf(p) + (st && st.error ? '（' + st.error + '）' : ''), true);");
assertIncludes('tool path extractor exists', app, 'function chatToolPathFromArgs(name, args = {})');
assertIncludes('tool path line renderer exists', app, 'function renderChatToolLine(ev)');
assertIncludes('chat path action markup exists', app, 'chat-path-action');
assertIncludes('chat path action resolves relative paths before rendering', app, 'const path = resolveChatLocalPath(raw, baseDir) || normalizeChatPath(raw);');
assertIncludes('open path action exists', app, "dataset.chatPathAct = 'open'");
assertIncludes('copy path action exists', app, "dataset.chatPathAct = 'copy'");
assertIncludes('history render enhances paths with chat cwd', app, 'enhanceChatPathActions(md, r.chat && r.chat.cwd);');
assertIncludes('stream render enhances paths with send cwd', app, 'enhanceChatPathActions(mdDiv, payload.cwd);');
assertIncludes('chat path enhancement skips code blocks', app, "parent.closest('a, button, pre, .chat-path-action')");
if (app.includes("parent.closest('a, button, pre, code, .chat-path-action')")) {
  throw new Error('chat path enhancement must not skip inline code paths; AI usually formats paths with backticks');
}
assertIncludes('stream tool event uses tool renderer', app, 'const line = renderChatToolLine(ev);');
assertIncludes('tool renderer appends file path action', app, 'line.appendChild(chatPathActionNode(toolPath));');
assertIncludes('tool path extractor resolves relative paths', app, 'return resolveChatLocalPath(p);');
assertIncludes('path action style exists', css, '.chat-path-action');
assertIncludes('tool path action style exists', css, '.chat-tool .chat-path-action');
assertIncludes('path open button style exists', css, '.chat-path-open');

console.log('chat-path-actions contract ok');
