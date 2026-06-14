'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

const propertiesPanel = sliceFunction(app, 'propertiesPanel');
assertIncludes('propertiesPanel', propertiesPanel, "single.kind === 'shortcut'");
assertIncludes('propertiesPanel', propertiesPanel, 'id="prop-copy-target"');
assertIncludes('propertiesPanel', propertiesPanel, '复制目标路径');
assertIncludes('propertiesPanel', propertiesPanel, 'id="prop-reveal-target"');
assertIncludes('propertiesPanel', propertiesPanel, '打开目标位置');
assertIncludes('propertiesPanel', propertiesPanel, 'shortcutTargetInfo(single)');
assertIncludes('propertiesPanel', propertiesPanel, 'copyPaths([r.target])');
assertIncludes('propertiesPanel', propertiesPanel, 'revealShortcutTarget(single)');

assertIncludes('docs', docs, '快捷方式属性面板');

console.log('shortcut-properties-actions contract ok');
