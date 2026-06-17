'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('selected template attachment helper', app, 'function templateSelectedAttachmentPaths()');
assertIncludes('helper uses current file selection', app, 'selEntries().filter((e) => e && !e.isDir && !e.isDrive)');
assertIncludes('template run picks selected files before failing', app, 'const picked = templateSelectedAttachmentPaths();');
assertIncludes('template run attaches every selected file', app, 'picked.forEach((p) => chat.addAttachment(p));');
assertIncludes('template run gives feedback', app, '已用当前选中的');
assertIncludes('template still falls back to explicit attach error', app, "toast('这个模板需要先把文件路径附加到对话区', true);");
assertIncludes('template picker copy mentions select or drag', app, '选卡片 → 选文件/拖路径 → 填一两句 → 开工');
assertIncludes('template file hint mentions selected files', app, '选中文件或拖进对话区附加路径');
assertIncludes('selected attachment summary helper', app, 'function templateAttachmentContextSummary()');
assertIncludes('attachment summary prioritizes queued chat attachments', app, 'const queued = chat && chat.attachments && chat.attachments.length ? chat.attachments : [];');
assertIncludes('attachment summary shows queued attachment source', app, '将使用对话附件');
assertIncludes('attachment summary shows selected file source', app, '将使用当前选中');
assertIncludes('selected attachment summary shows count', app, '个文件：');
assertIncludes('template runner renders selected attachment summary', app, 'const attachmentHint = templateAttachmentContextSummary();');
assertIncludes('template runner appends selected attachment summary', app, 'ctx.appendChild(attachmentHint);');
assertIncludes('template runner defines one submit path', app, 'const submitTemplate = () => this.run(t, inputs);');
assertIncludes('template field Enter listener exists', app, "inp.addEventListener('keydown', (ev) => {");
assertIncludes('template field Enter triggers submit', app, "if (ev.key === 'Enter' && !ev.isComposing) {");
assertIncludes('template field Enter prevents newline/form side effects', app, 'ev.preventDefault();');
assertIncludes('template field Enter reuses button action', app, 'submitTemplate();');
assertIncludes('template field Escape returns to picker', app, "if (ev.key === 'Escape' && !ev.isComposing) {");
assertIncludes('template field Escape refocuses search', app, 'this.renderPicker(box, { focusSearch: true });');
assertIncludes('template required field marks invalid inline', app, "inputs[f.key].setAttribute('aria-invalid', 'true');");
assertIncludes('template required field marks parent invalid', app, "inputs[f.key].closest('.tpl-field')?.classList.add('invalid');");
assertIncludes('template field input clears invalid state', app, "inp.setAttribute('aria-invalid', 'false');");
assertIncludes('template field input clears parent invalid state', app, "lab.classList.remove('invalid');");
assertIncludes('template runner schedules first field focus', app, 'requestAnimationFrame(() => {');
assertIncludes('template runner finds first field input', app, "const firstInput = form.querySelector('.tpl-field input');");
assertIncludes('template runner focuses first field without scroll jump', app, 'firstInput.focus({ preventScroll: true });');
assertIncludes('selected attachment summary has a quiet visual style', css, '.tpl-selected-files');
assertIncludes('template invalid field styles input border', css, '.tpl-field.invalid input');
assertIncludes('template invalid field styles label text', css, '.tpl-field.invalid span');
assertIncludes('template attachment context slot', app, "ctx.id = 'tpl-attachment-context';");
assertIncludes('template attachment context refresh helper', app, 'function refreshTemplateAttachmentContextSummary()');
assertIncludes('template attachment context refresh clears stale source', app, 'host.replaceChildren();');
assertIncludes('selection changes refresh template attachment context', app, 'refreshTemplateAttachmentContextSummary();');
assertIncludes('chat attachment chip render refreshes template attachment context', app, 'this.refreshTemplateAttachmentContext();');
assertIncludes('chat refresh helper delegates to template context refresh', app, 'refreshTemplateAttachmentContext() { refreshTemplateAttachmentContextSummary(); }');
assertIncludes('template can swap queued attachments to current selection', app, 'function useSelectedFilesForTemplateAttachment()');
assertIncludes('template swap replaces chat attachments', app, 'chat.attachments = templateSelectedAttachmentPaths();');
assertIncludes('template swap rerenders chips', app, 'chat.renderChips();');
assertIncludes('template swap action label', app, '改用当前选中');
assertIncludes('template swap button style', css, '.tpl-use-selected');
assertIncludes('template detects non-file selections', app, 'function templateSelectedNonFileCount()');
assertIncludes('template non-file selection excludes files', app, 'selEntries().filter((e) => e && (e.isDir || e.isDrive)).length');
assertIncludes('template context warns when selection has no files', app, '当前选择不含可用文件');
assertIncludes('template run explains folder selection mismatch', app, '当前选中的是文件夹或磁盘，这个模板需要文件附件');
assertIncludes('template invalid selection style', css, '.tpl-selected-files.warn');

console.log('template-selected-attachments contract ok');
