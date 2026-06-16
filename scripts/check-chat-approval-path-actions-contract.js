'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('approval path extractor exists', app, 'function approvalPathFromArgs(name, args = {})');
assertIncludes('approval path resolves relative paths', app, 'return resolveChatLocalPath(p);');
assertIncludes('approval card creates target row', app, "const target = document.createElement('div');");
assertIncludes('approval target class exists', app, "target.className = 'ap-target';");
assertIncludes('approval target uses path action node', app, 'target.appendChild(chatPathActionNode(apPath));');
assertIncludes('approval card inserts target before detail', app, "card.insertBefore(target, card.querySelector('.ap-detail'));");
assertIncludes('approval path action style exists', css, '.ap-target .chat-path-action');

console.log('chat-approval-path-actions contract ok');
