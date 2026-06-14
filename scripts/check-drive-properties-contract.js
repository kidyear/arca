'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

const statPath = server.slice(server.indexOf('async function statPath'), server.indexOf('async function readFile'));
const props = app.slice(app.indexOf('function propertiesPanel'), app.indexOf('async function showPropertiesSelection'));

assertIncludes('server', server, 'async function driveUsage');
assertIncludes('statPath', statPath, 'path.parse(real).root');
assertIncludes('statPath', statPath, 'Object.assign(info, await driveUsage(real))');
assertIncludes('driveUsage', server, 'fsp.statfs(root)');
assertIncludes('driveUsage', server, 'usedRatio');
assertIncludes('propertiesPanel', props, "single.total && single.free");
assertIncludes('propertiesPanel', props, "['可用空间'");
assertIncludes('propertiesPanel', props, "['总容量'");
assertIncludes('propertiesPanel', props, "['已用比例'");
assertIncludes('propertiesPanel', props, "Math.round(single.usedRatio * 100)");
assertIncludes('docs', docs, '盘符属性容量');

console.log('drive-properties contract ok');
