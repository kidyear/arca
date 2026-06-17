'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

function assertRuntimeDependency(name) {
  if (!server.includes(`require('${name}')`) && !server.includes(`require("${name}")`)) return;
  if (!pkg.dependencies || !pkg.dependencies[name]) {
    throw new Error(`server.js requires ${name}, so it must be in dependencies for packaged Electron builds`);
  }
  if (pkg.devDependencies && pkg.devDependencies[name]) {
    throw new Error(`${name} must not remain in devDependencies when server.js requires it at runtime`);
  }
}

assertRuntimeDependency('jszip');
assertRuntimeDependency('xlsx');

console.log('server-runtime-deps contract ok');
