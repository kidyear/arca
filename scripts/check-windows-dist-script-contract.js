'use strict';

const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

if (!pkg.build || pkg.build.npmRebuild !== false) {
  throw new Error('package build.npmRebuild must stay false for local Windows packaging');
}

if (pkg.scripts['dist:win'] !== 'electron-builder --win') {
  throw new Error('dist:win should package with electron-builder only; native rebuild belongs in the explicit rebuild script/CI');
}

if (!pkg.scripts.rebuild || !pkg.scripts.rebuild.includes('electron-rebuild')) {
  throw new Error('explicit rebuild script should remain available for machines that need it');
}

console.log('windows-dist-script contract ok');
