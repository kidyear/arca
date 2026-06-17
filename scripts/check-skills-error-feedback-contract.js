'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const dict = fs.readFileSync(path.join(__dirname, '..', 'public', 'i18n-dict.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

const skillsViewStart = app.indexOf('const skillsView =');
if (skillsViewStart < 0) throw new Error('skillsView missing');
const skillsViewEnd = app.indexOf('\n// 把 skill 注入当前终端', skillsViewStart);
if (skillsViewEnd < 0) throw new Error('skillsView end marker missing');
const skillsView = app.slice(skillsViewStart, skillsViewEnd);

assertIncludes('skills toggle failure has unknown fallback', skillsView, "toast('操作失败：' + (r.error || '未知错误'), true);");
assertIncludes('skills trash failure has unknown fallback', skillsView, "toast('删除失败：' + (r.error || '未知错误'), true);");
assertIncludes('operation failure i18n exists', dict, '/^操作失败：([\\s\\S]*)$/');
assertIncludes('delete failure i18n exists', dict, '/^删除失败：([\\s\\S]*)$/');

if (skillsView.includes("toast('操作失败：' + (r.error || ''), true)")) {
  throw new Error('skills toggle failure must not leave an empty toast suffix');
}
if (skillsView.includes("toast('删除失败：' + (r.error || ''), true)")) {
  throw new Error('skills trash failure must not leave an empty toast suffix');
}

console.log('skills-error-feedback contract ok');
