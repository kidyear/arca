const fs = require('fs');

function assert(cond, msg) {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}

const server = fs.readFileSync('server.js', 'utf8');
const app = fs.readFileSync('public/app.js', 'utf8');
const docs = fs.readFileSync('docs/公司版-工作清单.md', 'utf8');

assert(server.includes('async function resolveShortcutTarget'), 'server.js must expose a Windows .lnk target resolver');
assert(server.includes('CreateShortcut($env:FANBOX_SHORTCUT_PATH)'), 'shortcut resolver should use WScript.Shell.CreateShortcut to read .lnk metadata');
assert(server.includes('TargetPath'), 'shortcut resolver must return the shortcut TargetPath');
assert(server.includes("if (p === '/api/shortcut/target'"), 'server.js must route /api/shortcut/target');
assert(server.includes('return sendJSON(res, 200, await resolveShortcutTarget'), '/api/shortcut/target must call resolveShortcutTarget');

assert(app.includes("apiPost('/api/shortcut/target'"), 'frontend must request shortcut target metadata');
assert(app.includes('async function openShortcutTarget'), 'frontend must open shortcut targets through a dedicated helper');
assert(app.includes('async function revealShortcutTarget'), 'frontend must reveal shortcut targets through a dedicated helper');
assert(app.includes("e.kind === 'shortcut'"), 'shortcut entries must get dedicated open/context/properties behavior');
assert(app.includes('打开目标位置'), 'shortcut context menu must include open target location');
assert(app.includes('目标路径'), 'shortcut properties must display target path');

assert(docs.includes('快捷方式目标'), 'work checklist must document shortcut target behavior');

console.log('shortcut-target contract ok');
