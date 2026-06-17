'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

const toggleChangesPanel = sliceFunction(app, 'toggleChangesPanel');
const openChangedPath = sliceFunction(app, 'openChangedPath');
const renderChangesBadge = sliceFunction(app, 'renderChangesBadge');
const init = sliceFunction(app, 'init');
assertIncludes('startup initializes changes button title', init, 'renderChangesBadge();');
assertIncludes('changes button title helper reads button', renderChangesBadge, "const btn = $('#btn-changes');");
assertIncludes('changes badge clears text when empty', renderChangesBadge, "b.textContent = '';");
assertIncludes('changes badge shows visible count', renderChangesBadge, "b.textContent = state.changeLog.length > 99 ? '99+' : String(state.changeLog.length);");
assertIncludes('changes button title mentions empty state', renderChangesBadge, '暂无 AI 文件输出');
assertIncludes('changes button title mentions latest output', renderChangesBadge, '最新：');
assertIncludes('changes button title uses latest changed file name', renderChangesBadge, 'state.changeLog[0].name');
assertIncludes('changes panel open helper navigates to output dir', openChangedPath, 'await navigate(dirOf(p));');
assertIncludes('changes panel open helper selects output file', openChangedPath, 'applySelection(p);');
assertIncludes('changes panel open helper previews output file', openChangedPath, 'openPreview(e);');
assertIncludes('changes panel open helper records recent file', openChangedPath, 'recordRecent(p);');
assertIncludes('changes panel existing popup uses cleanup', toggleChangesPanel, 'existing._cleanup');
assertIncludes('changes panel has unified close helper', toggleChangesPanel, 'const closePop = () =>');
assertIncludes('changes panel removes escape listener', toggleChangesPanel, "document.removeEventListener('keydown', onPopKey, true)");
assertIncludes('changes panel escape closes popup', toggleChangesPanel, "if (ev.key === 'Escape'");
assertIncludes('changes panel escape respects handled dialogs', toggleChangesPanel, 'if (ev.defaultPrevented) return;');
assertIncludes('changes panel escape ignores confirm dialog', toggleChangesPanel, "document.querySelector('.input-overlay')");
assertIncludes('changes panel escape captures before global shortcuts', toggleChangesPanel, "document.addEventListener('keydown', onPopKey, true)");
assertIncludes('changes panel header copy button', toggleChangesPanel, 'id="cp-copy-all"');
assertIncludes('changes panel header copy label', toggleChangesPanel, '复制全部路径');
assertIncludes('changes panel latest open button', toggleChangesPanel, 'id="cp-open-latest"');
assertIncludes('changes panel latest open label', toggleChangesPanel, '打开最新');
assertIncludes('changes panel latest open handler', toggleChangesPanel, "const openLatest = $('#cp-open-latest');");
assertIncludes('changes panel latest uses newest change', toggleChangesPanel, 'state.changeLog[0].path');
assertIncludes('changes panel latest uses shared open helper', toggleChangesPanel, 'openChangedPath(state.changeLog[0].path)');
assertIncludes('changes panel copy handler', toggleChangesPanel, "const copyAll = $('#cp-copy-all');");
assertIncludes('changes panel copy uses changeLog paths', toggleChangesPanel, 'state.changeLog.map((c) => c.path)');
assertIncludes('changes panel copy uses shared copyPaths', toggleChangesPanel, 'copyPaths(paths);');
assertIncludes('changes panel row copy button', toggleChangesPanel, 'class="cp-copy-one"');
assertIncludes('changes panel row copy label', toggleChangesPanel, '复制路径');
assertIncludes('changes panel row copy handler', toggleChangesPanel, "const copyOne = ev.target.closest('.cp-copy-one');");
assertIncludes('changes panel row copy stops opening row', toggleChangesPanel, 'if (copyOne)');
assertIncludes('changes panel row copy uses row path', toggleChangesPanel, 'copyPath(row.dataset.path);');
assertIncludes('changes panel row title carries full path', toggleChangesPanel, 'title="${escapeHtml(c.path)}"');
assertIncludes('changes panel row is keyboard focusable', toggleChangesPanel, 'tabindex="0"');
assertIncludes('changes panel row has button role', toggleChangesPanel, 'role="button"');
assertIncludes('changes panel row keyboard handler', toggleChangesPanel, 'row.onkeydown = (ev) =>');
assertIncludes('changes panel row enter opens file', toggleChangesPanel, "ev.key === 'Enter'");
assertIncludes('changes panel row space opens file', toggleChangesPanel, "ev.key === ' '");
assertIncludes('changes panel row keyboard reuses click flow', toggleChangesPanel, 'row.click();');
assertIncludes('changes panel row uses shared open helper', toggleChangesPanel, 'openChangedPath(row.dataset.path)');
assertIncludes('changes panel clear asks confirmation', toggleChangesPanel, 'await confirmDialog');
assertIncludes('changes panel clear warning text', toggleChangesPanel, '清空本会话变更记录');
assertIncludes('changes panel clear keeps state on cancel', toggleChangesPanel, 'if (!ok) return;');
assertIncludes('changes panel position clamps right edge', toggleChangesPanel, 'Math.max(8, window.innerWidth - r.right)');
assertIncludes('changes panel ignores confirm dialog outside click', toggleChangesPanel, "ev.target.closest('.input-overlay')");

console.log('change-panel-copy contract ok');
