'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, needle) {
  if (!app.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('tool line stores normalized path', 'line.dataset.path = normalizeChatPath(toolPath);');
assertIncludes('tool line stores tool name', 'line.dataset.tool = ev.name;');
assertIncludes('tool file sync helper exists', 'async function syncChatToolFileDone(line)');
assertIncludes('read tools are not treated as changes', "if (!CHAT_MUTATING_FILE_TOOLS.has(line.dataset.tool)) return;");
assertIncludes('mutating file tool set exists', 'const CHAT_MUTATING_FILE_TOOLS = new Set');
assertIncludes('tool file sync records change', 'recordChange(dirOf(p), baseOf(p));');
assertIncludes('tool file sync refreshes current dir', 'await refresh();');
assertIncludes('tool file sync selects finished path', 'selectVisiblePaths([p]);');
assertIncludes('tool_done triggers file sync', 'syncChatToolFileDone(line).catch(() => {});');

console.log('chat-tool-file-sync contract ok');
