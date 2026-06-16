'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, needle) {
  if (!app.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('write approval shows content without path duplicate', "if (name === 'Write') return approvalContentPreview(a.content);");
assertIncludes('edit approval shows replacement without path duplicate', "if (name === 'Edit' || name === 'MultiEdit') return approvalEditPreview(a);");
assertIncludes('approval content helper exists', 'function approvalContentPreview(content)');
assertIncludes('approval edit helper exists', 'function approvalEditPreview(a)');

if (/if \(name === 'Write'\) return `\$\{a\.file_path \|\| ''\}/.test(app)) {
  throw new Error('Write approval detail must not repeat file_path already shown in target chip');
}
if (/if \(name === 'Edit' \|\| name === 'MultiEdit'\) return `\$\{a\.file_path \|\| ''\}/.test(app)) {
  throw new Error('Edit approval detail must not repeat file_path already shown in target chip');
}

console.log('chat-approval-detail contract ok');
