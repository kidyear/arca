'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

const doneLabel = sliceFunction(app, 'aiToolDoneLabel');
const renderTool = sliceFunction(app, 'renderChatToolLine');
const send = app.slice(app.indexOf('async send(forcedText, displayText)'), app.indexOf('\n  stop()', app.indexOf('async send(forcedText, displayText)')));

assertIncludes('write tool completes as generated file', doneLabel, "case 'Write': return '已生成文件';");
assertIncludes('edit tool completes as modified file', doneLabel, "case 'Edit': return '已修改文件';");
assertIncludes('multi edit completes as modified files', doneLabel, "case 'MultiEdit': return '已批量修改';");
assertIncludes('render tool exposes status node', renderTool, 'class="ct-state ct-spin"');
assertIncludes('render tool exposes label node', renderTool, 'class="ct-label"');
assertIncludes('tool done finds pending line by status node', send, "const stateNode = line && line.querySelector('.ct-state');");
assertIncludes('tool done replaces label with completed user-facing text', send, "labelNode.textContent = aiToolDoneLabel(line.dataset.tool);");
assertIncludes('tool done marks completed line', send, "line.classList.add('done');");
assertIncludes('done tool style exists', css, '.chat-tool.done');

console.log('chat-tool-done-ux contract ok');
