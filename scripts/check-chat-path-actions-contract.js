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
assertIncludes('chat path enhancement exists', app, 'function enhanceChatPathActions(root)');
assertIncludes('chat path opener exists', app, 'async function openChatPathReference(raw)');
assertIncludes('tool path extractor exists', app, 'function chatToolPathFromArgs(name, args = {})');
assertIncludes('tool path line renderer exists', app, 'function renderChatToolLine(ev)');
assertIncludes('chat path action markup exists', app, 'chat-path-action');
assertIncludes('open path action exists', app, "dataset.chatPathAct = 'open'");
assertIncludes('copy path action exists', app, "dataset.chatPathAct = 'copy'");
assertIncludes('history render enhances paths', app, 'enhanceChatPathActions(md);');
assertIncludes('stream render enhances paths', app, 'enhanceChatPathActions(mdDiv);');
assertIncludes('stream tool event uses tool renderer', app, 'const line = renderChatToolLine(ev);');
assertIncludes('tool renderer appends file path action', app, 'line.appendChild(chatPathActionNode(toolPath));');
assertIncludes('tool path extractor resolves relative paths', app, 'return resolveChatLocalPath(p);');
assertIncludes('path action style exists', css, '.chat-path-action');
assertIncludes('tool path action style exists', css, '.chat-tool .chat-path-action');
assertIncludes('path open button style exists', css, '.chat-path-open');

console.log('chat-path-actions contract ok');
