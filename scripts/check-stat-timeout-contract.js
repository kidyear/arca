'use strict';

const fs = require('fs');
const path = require('path');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('server stat timeout constant', server, 'PATH_STAT_TIMEOUT_MS');

const statPath = sliceFunction(server, 'statPath');
assertIncludes('statPath', statPath, 'withTimeout(fsp.lstat(real), PATH_STAT_TIMEOUT_MS)');
assertIncludes('statPath', statPath, 'throw new Error');
assertIncludes('statPath', statPath, '访问超时');

const addNetworkLocation = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
assertIncludes('network location error path', addNetworkLocation, '网络位置不可用：');

console.log('stat-timeout contract ok');
