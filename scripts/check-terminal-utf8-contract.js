'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('electron helper', main, 'function terminalShellConfig');
assertIncludes('electron pty spawn uses helper', main, 'terminalShellConfig(cwd)');
assertIncludes('windows shell', main, "shellPath: 'powershell.exe'");
assertIncludes('windows no logo', main, "'-NoLogo'");
assertIncludes('windows keep shell', main, "'-NoExit'");
assertIncludes('windows no profile', main, "'-NoProfile'");
assertIncludes('windows command bootstrap', main, "'-Command'");
assertIncludes('windows codepage', main, 'chcp.com 65001');
assertIncludes('windows input encoding', main, '[Console]::InputEncoding');
assertIncludes('windows output encoding', main, '[Console]::OutputEncoding');
assertIncludes('powershell output encoding', main, '$OutputEncoding');
assertIncludes('python utf8 mode env', main, "PYTHONUTF8: '1'");
assertIncludes('python utf8 env', main, "PYTHONIOENCODING: 'utf-8'");
assertIncludes('pager utf8 env', main, "LESSCHARSET: 'utf-8'");
assertIncludes('pty spawn args', main, 'shellArgs');
assertIncludes('docs terminal verified', docs, '终端中文');

console.log('terminal-utf8 contract ok');
