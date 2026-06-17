'use strict';

const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'public', 'app.js');
const bytes = fs.readFileSync(appPath);
const nulPositions = [];
for (let i = 0; i < bytes.length; i += 1) {
  if (bytes[i] === 0) nulPositions.push(i);
}

if (nulPositions.length) {
  throw new Error(`public/app.js contains NUL bytes at offsets ${nulPositions.slice(0, 8).join(', ')}`);
}

const app = bytes.toString('utf8');
if (!app.includes("cwd0 + '\\u001f' + x.cand + '\\u001f' + x.tail")) {
  throw new Error('terminal link verification cache key should use escaped text separator, not raw binary bytes');
}

console.log('source-text-clean contract ok');
