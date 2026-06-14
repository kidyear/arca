'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function assertNotIncludes(label, text, needle) {
  if (text.includes(needle)) throw new Error(`${label} must not include: ${needle}`);
}

assertIncludes('server', server, 'const DRIVE_PROBE_CONCURRENCY');
assertIncludes('server', server, 'const DRIVE_PROBE_TIMEOUT_MS');
assertIncludes('server', server, 'async function listDrives');
assertIncludes('server', server, "if (p === '/api/drives')");
assertIncludes('server', server, "withTimeout(fsp.stat(root)");
assertIncludes('server', server, 'await mapLimit(letters, DRIVE_PROBE_CONCURRENCY');
assertNotIncludes('defaultRoots', server.slice(server.indexOf('function defaultRoots'), server.indexOf('// ---------- 静态资源 ----------')), "candidates.push([`${letter}: 盘`, `${letter}:\\\\`])");

assertIncludes('index', index, '此电脑');
assertIncludes('index', index, 'id="drives-list"');
assertIncludes('app', app, 'drives: []');
assertIncludes('app', app, 'async function loadDrives');
assertIncludes('app', app, "api('/api/drives')");
assertIncludes('app', app, "const ul = $('#drives-list')");
assertIncludes('app', app, 'navDriveLi');
assertIncludes('app', app, 'loadDrives()');

assertIncludes('docs', docs, '此电脑盘符区');

console.log('drives-sidebar contract ok');
