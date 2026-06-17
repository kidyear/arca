'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

if (!app.includes('state.changed.get(e.path)')) {
  throw new Error('changed marker must look up records by full entry path, not file name');
}

if (/state\.changed\.get\(e\.name\)/.test(app)) {
  throw new Error('changed marker still uses e.name; duplicate names can look selected together');
}

if (!app.includes('const changedPath = state.cwd.replace(/\\/$/, \'\') + state.sep + top;')) {
  throw new Error('filesystem change records must be keyed by the visible child full path');
}

if (!app.includes('state.changed.get(changedPath)')) {
  throw new Error('filesystem change records must reuse changedPath as the Map key');
}

console.log('changed-marker-path-key contract ok');
