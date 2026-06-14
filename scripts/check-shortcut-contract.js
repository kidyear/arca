const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(ROOT, 'docs', '公司版-工作清单.md'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(/async function createShortcut\(/.test(server), 'server.js must expose createShortcut');
assert(server.includes('[Console]::OutputEncoding'), 'PowerShell JSON helpers must force UTF-8 stdout for Chinese shortcut names');
assert(server.includes('WScript.Shell'), 'Windows shortcut creation must use the Shell COM shortcut API');
assert(server.includes('FANBOX_SHORTCUT_TARGET'), 'shortcut target path must be passed through environment variables');
assert(server.includes("if (p === '/api/shortcut' && req.method === 'POST')"), 'server.js must route POST /api/shortcut');
assert(server.includes('return sendJSON(res, 200, await createShortcut'), '/api/shortcut must call createShortcut');

assert(/async function createShortcutForEntries\(/.test(app), 'public/app.js must expose createShortcutForEntries');
assert(app.includes("apiPost('/api/shortcut'"), 'frontend must call /api/shortcut');
assert(app.includes("pushUndo({ type: 'shortcut'"), 'created shortcuts must have a dedicated undo/redo operation');
assert(app.includes("if (op.type === 'shortcut')"), 'undo/redo must handle created shortcuts explicitly');
assert(app.includes('创建快捷方式'), 'context menu must contain 创建快捷方式');

assert(docs.includes('创建快捷方式'), 'work checklist must document shortcut creation');

console.log('shortcut contract ok');
