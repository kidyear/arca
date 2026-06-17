'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceAsyncFunction(text, name) {
  const start = text.indexOf(`async function ${name}(`);
  if (start < 0) throw new Error(`missing async function ${name}`);
  const next = text.indexOf('\nasync function ', start + 1);
  const nextPlain = text.indexOf('\nfunction ', start + 1);
  const ends = [next, nextPlain].filter((i) => i >= 0);
  return text.slice(start, ends.length ? Math.min(...ends) : undefined);
}

const undoLast = sliceAsyncFunction(app, 'undoLast');
const redoLast = sliceAsyncFunction(app, 'redoLast');

assertIncludes('undo copy tracks last error', undoLast, "let fail = 0, lastErr = '';");
assertIncludes('undo copy preserves backend reason', undoLast, "lastErr = r.error || '撤销复制失败';");
assertIncludes('undo copy reports backend reason', undoLast, "toast(fail ? `撤销复制完成，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已撤销复制 ${op.items.length} 项`);");

assertIncludes('undo move tracks last error', undoLast, "let fail = 0, restored = [], redoItems = [], lastErr = '';");
assertIncludes('undo move preserves backend reason', undoLast, "lastErr = r.error || '撤销移动失败';");
assertIncludes('undo move reports backend reason', undoLast, "toast(fail ? `撤销移动完成，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已撤销移动 ${op.items.length} 项`);");

assertIncludes('undo shortcut tracks last error', undoLast, "let fail = 0, lastErr = '';");
assertIncludes('undo shortcut preserves backend reason', undoLast, "lastErr = r.error || '撤销快捷方式失败';");
assertIncludes('undo shortcut reports backend reason', undoLast, "toast(fail ? `撤销快捷方式完成，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已撤销快捷方式 ${op.items.length} 项`);");

assertIncludes('redo copy tracks last error', redoLast, "let fail = 0, copied = [], lastErr = '';");
assertIncludes('redo copy preserves backend reason', redoLast, "lastErr = r.error || '重做复制失败';");
assertIncludes('redo copy reports backend reason', redoLast, "toast(fail ? `重做复制完成，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已重做复制 ${copied.length} 项`);");

assertIncludes('redo move tracks last error', redoLast, "let fail = 0, moved = [], lastErr = '';");
assertIncludes('redo move preserves backend reason', redoLast, "lastErr = r.error || '重做移动失败';");
assertIncludes('redo move reports backend reason', redoLast, "toast(fail ? `重做移动完成，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已重做移动 ${moved.length} 项`);");

assertIncludes('redo shortcut tracks last error', redoLast, "let fail = 0, created = [], lastErr = '';");
assertIncludes('redo shortcut preserves backend reason', redoLast, "lastErr = r.error || '重做快捷方式失败';");
assertIncludes('redo shortcut reports backend reason', redoLast, "toast(fail ? `重做快捷方式完成，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已重做快捷方式 ${created.length} 项`);");

console.log('undo-redo-file-error contract ok');
