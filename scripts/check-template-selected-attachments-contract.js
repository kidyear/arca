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
assertIncludes('template still falls back to explicit attach error', app, "toast('这个模板需要先把文件拖进对话区作为附件', true);");
assertIncludes('template picker copy mentions select or drag', app, '选卡片 → 选/拖文件 → 填一两句 → 开工');
assertIncludes('template file hint mentions selected files', app, '选中文件或拖进对话区作为附件');
assertIncludes('selected attachment summary helper', app, 'function templateAttachmentContextSummary()');
assertIncludes('attachment summary prioritizes queued chat attachments', app, 'const queued = chat && chat.attachments && chat.attachments.length ? chat.attachments : [];');
assertIncludes('attachment summary shows queued attachment source', app, '将使用对话附件');
assertIncludes('attachment summary shows selected file source', app, '将使用当前选中');
assertIncludes('selected attachment summary shows count', app, '个文件：');
assertIncludes('template runner renders selected attachment summary', app, 'const attachmentHint = templateAttachmentContextSummary();');
assertIncludes('template runner appends selected attachment summary', app, 'ctx.appendChild(attachmentHint);');
assertIncludes('selected attachment summary has a quiet visual style', css, '.tpl-selected-files');
assertIncludes('template attachment context slot', app, "ctx.id = 'tpl-attachment-context';");
assertIncludes('template attachment context refresh helper', app, 'function refreshTemplateAttachmentContextSummary()');
assertIncludes('template attachment context refresh clears stale source', app, 'host.replaceChildren();');
assertIncludes('selection changes refresh template attachment context', app, 'refreshTemplateAttachmentContextSummary();');
assertIncludes('chat attachment chip render refreshes template attachment context', app, 'this.refreshTemplateAttachmentContext();');
assertIncludes('chat refresh helper delegates to template context refresh', app, 'refreshTemplateAttachmentContext() { refreshTemplateAttachmentContextSummary(); }');

console.log('template-selected-attachments contract ok');
