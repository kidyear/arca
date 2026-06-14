'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const style = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

const listDrives = server.slice(server.indexOf('async function listDrives'), server.indexOf('async function readConfig'));

assertIncludes('listDrives', listDrives, 'fsp.statfs(root)');
assertIncludes('listDrives', listDrives, 'const total =');
assertIncludes('listDrives', listDrives, 'const free =');
assertIncludes('listDrives', listDrives, 'const used =');
assertIncludes('listDrives', listDrives, 'usedRatio');
assertIncludes('listDrives', listDrives, 'freeRatio');

assertIncludes('app', app, 'function fmtDriveFree');
assertIncludes('app', app, 'drive-capacity');
assertIncludes('app', app, 'drive-bar');
assertIncludes('app', app, 'drive-used');
assertIncludes('app', app, 'drive.free');
assertIncludes('app', app, 'drive.total');
assertIncludes('app', app, 'drive.usedRatio');

assertIncludes('style', style, '.nav-list li.drive-root');
assertIncludes('style', style, '.drive-capacity');
assertIncludes('style', style, '.drive-bar');
assertIncludes('style', style, '.drive-used');

assertIncludes('docs', docs, '盘符容量显示');

console.log('drive-usage contract ok');
