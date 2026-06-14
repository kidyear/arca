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

const driveUsage = server.slice(server.indexOf('async function driveUsage'), server.indexOf('async function listDrives'));
const listDrives = server.slice(server.indexOf('async function listDrives'), server.indexOf('async function readConfig'));

assertIncludes('driveUsage', driveUsage, 'fsp.statfs(root)');
assertIncludes('driveUsage', driveUsage, 'const total =');
assertIncludes('driveUsage', driveUsage, 'const free =');
assertIncludes('driveUsage', driveUsage, 'const used =');
assertIncludes('driveUsage', driveUsage, 'usedRatio');
assertIncludes('driveUsage', driveUsage, 'freeRatio');
assertIncludes('listDrives', listDrives, 'Object.assign(drive, await driveUsage(root))');

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
