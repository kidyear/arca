'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
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

function sliceAsyncFunction(text, name) {
  const start = text.indexOf(`async function ${name}(`);
  if (start < 0) throw new Error(`missing async function ${name}`);
  const next = text.indexOf('\nasync function ', start + 1);
  const nextPlain = text.indexOf('\nfunction ', start + 1);
  const ends = [next, nextPlain].filter((i) => i >= 0);
  return text.slice(start, ends.length ? Math.min(...ends) : undefined);
}

assertIncludes('server', server, 'UNDO_TRASH_DIR');
assertIncludes('server', server, 'async function trashPathUndoable');
assertIncludes('server', server, 'async function trashPathSystemUndoable');
assertIncludes('server', server, 'async function restoreTrashedPath');
assertIncludes('server', server, 'async function restoreSystemTrashedPath');
assertIncludes('server system recycle original location', server, 'System.Recycle.DeletedFrom');
assertIncludes('server system recycle restore verb', server, 'InvokeVerb');
assertIncludes('server system recycle kind', server, "trashKind = 'system'");
assertIncludes('server app trash fallback kind', server, "trashKind: 'app'");
assertIncludes('server route', server, "p === '/api/trash-undoable'");
assertIncludes('server route', server, "p === '/api/trash-restore'");
assertIncludes('server route trashKind', server, 'b.trashKind');

assertIncludes('trash undo item helper', sliceFunction(app, 'trashUndoItemFromResult'), 'trashKind: result.trashKind');
assertIncludes('doTrash', sliceAsyncFunction(app, 'doTrash'), "/api/trash-undoable");
assertIncludes('doTrash undo', sliceAsyncFunction(app, 'doTrash'), "pushUndo({ type: 'trash'");
assertIncludes('doTrash trash item helper', sliceAsyncFunction(app, 'doTrash'), 'trashUndoItemFromResult');
assertIncludes('trashSelection', sliceAsyncFunction(app, 'trashSelection'), "/api/trash-undoable");
assertIncludes('trashSelection undo', sliceAsyncFunction(app, 'trashSelection'), "pushUndo({ type: 'trash'");
assertIncludes('trashSelection trash item helper', sliceAsyncFunction(app, 'trashSelection'), 'trashUndoItemFromResult');
assertIncludes('trashSelection tracks last delete error', sliceAsyncFunction(app, 'trashSelection'), "let fail = 0, lastErr = '';");
assertIncludes('trashSelection preserves delete error reason', sliceAsyncFunction(app, 'trashSelection'), "lastErr = friendlyErrorText(r, '删除失败');");
assertIncludes('trashSelection reports delete error reason', sliceAsyncFunction(app, 'trashSelection'), "toast(fail ? `完成，${fail} 项删除失败${lastErr ? `：${lastErr}` : ''}` : `已把 ${items.length} 项移到废纸篓，Ctrl+Z 可恢复`);");
assertIncludes('deleteSelectionPermanent tracks last delete error', sliceAsyncFunction(app, 'deleteSelectionPermanent'), "let fail = 0, lastErr = '';");
assertIncludes('deleteSelectionPermanent preserves delete error reason', sliceAsyncFunction(app, 'deleteSelectionPermanent'), "lastErr = friendlyErrorText(r, '永久删除失败');");
assertIncludes('deleteSelectionPermanent reports delete error reason', sliceAsyncFunction(app, 'deleteSelectionPermanent'), "toast(fail ? `完成，${fail} 项永久删除失败${lastErr ? `：${lastErr}` : ''}` : `已永久删除 ${items.length} 项`);");
assertIncludes('undoLast trash branch', sliceAsyncFunction(app, 'undoLast'), "op.type === 'trash'");
assertIncludes('undoLast restore route', sliceAsyncFunction(app, 'undoLast'), "/api/trash-restore");
assertIncludes('undoLast restore kind', sliceAsyncFunction(app, 'undoLast'), 'trashKind: it.trashKind');
assertIncludes('undoLast trash tracks restore error reason', sliceAsyncFunction(app, 'undoLast'), "let fail = 0, restored = [], lastErr = '';");
assertIncludes('undoLast trash preserves restore error reason', sliceAsyncFunction(app, 'undoLast'), "lastErr = r.error || '恢复失败';");
assertIncludes('undoLast trash reports restore error reason', sliceAsyncFunction(app, 'undoLast'), "toast(fail ? `撤销删除完成，${fail} 项恢复失败${lastErr ? `：${lastErr}` : ''}` : `已恢复 ${restored.length} 项`);");
assertIncludes('undoLast redo', sliceAsyncFunction(app, 'undoLast'), 'pushRedo({ ...op');
assertIncludes('redoLast trash branch', sliceAsyncFunction(app, 'redoLast'), "op.type === 'trash'");
assertIncludes('redoLast undoable route', sliceAsyncFunction(app, 'redoLast'), "/api/trash-undoable");
assertIncludes('redoLast trash item helper', sliceAsyncFunction(app, 'redoLast'), 'trashUndoItemFromResult');
assertIncludes('redoLast trash tracks delete error reason', sliceAsyncFunction(app, 'redoLast'), "let fail = 0, trashed = [], lastErr = '';");
assertIncludes('redoLast trash preserves delete error reason', sliceAsyncFunction(app, 'redoLast'), "lastErr = r.error || '删除失败';");
assertIncludes('redoLast trash reports delete error reason', sliceAsyncFunction(app, 'redoLast'), "toast(fail ? `重做删除完成，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已重做删除 ${trashed.length} 项`);");
assertIncludes('redoLast push undo', sliceAsyncFunction(app, 'redoLast'), "pushUndo({ ...op");

assertIncludes('docs', docs, 'Ctrl+Z 撤销回收站删除');
assertIncludes('docs', docs, '系统回收站优先');

console.log('trash-undo contract ok');
