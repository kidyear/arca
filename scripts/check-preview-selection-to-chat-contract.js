'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'public', 'i18n-dict.js'), 'utf8');
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

assertIncludes('preview selection to chat helper exists', app, 'function sendPreviewSelectionToChat(text)');
const helper = sliceFunction(app, 'sendPreviewSelectionToChat');
assertIncludes('helper opens chat panel through chat controller', helper, 'chat.open();');
if (helper.includes("$('#terminal-panel').classList.remove('hidden')")) {
  throw new Error('preview selection should use chat.open() instead of duplicating panel open logic');
}
assertIncludes('helper keeps context source path', helper, "来源：${state.selected || '当前预览'}");
assertIncludes('helper adds source path as attachment', helper, 'if (source) chat.addAttachment(source);');
assertIncludes('helper inserts quoted selection into composer', helper, 'input.value = input.value ? `${input.value.trimEnd()}\\n\\n${block}` : block;');
assertIncludes('helper refreshes composer height', helper, "input.dispatchEvent(new Event('input', { bubbles: true }));");
assertIncludes('helper focuses composer', helper, 'input.focus();');
assertIncludes('helper gives clear staged chat feedback', helper, "toast('已放进对话输入框，补一句要求再发送')");
if (helper.includes('chat.send()')) throw new Error('preview selection should stage text in composer, not auto-send');

const bind = sliceFunction(app, 'bindSelectionToTerminal');
assertIncludes('selection popover creates grouped actions', bind, "btn.className = 'sel-send-group';");
assertIncludes('selection popover offers chat action', bind, '发到对话');
assertIncludes('selection chat action calls helper', bind, 'sendPreviewSelectionToChat(text);');
assertIncludes('selection terminal action remains available', bind, '发到终端');
assertIncludes('selection terminal action gives clear confirmation feedback', bind, "toast('已发到终端，确认后再回车')");
if (bind.includes('已甩进终端')) throw new Error('preview selection terminal feedback should not use casual fling wording');
assertIncludes('selection popover schedules show once', bind, 'const scheduleShow = () => { clearTimeout(selTimer); selTimer = setTimeout(show, 10); };');
assertIncludes('selection popover still reacts to mouse selection', bind, "body.addEventListener('mouseup', scheduleShow);");
assertIncludes('selection popover reacts to keyboard selection', bind, "body.addEventListener('keyup', scheduleShow);");
assertIncludes('selection popover reacts to browser selection changes', bind, "document.addEventListener('selectionchange', scheduleShow);");

assertIncludes('selection action group style exists', css, '.sel-send-group');
assertIncludes('selection action button style exists', css, '.sel-send-group .sel-send');
assertIncludes('i18n covers preview selection chat action', i18n, "'发到对话': 'Send to chat'");
assertIncludes('i18n covers staged chat feedback', i18n, "'已放进对话输入框，补一句要求再发送': 'Added to the chat input — add your request, then send'");
assertIncludes('i18n covers terminal feedback', i18n, "'已发到终端，确认后再回车': 'Sent to terminal — review it, then press Enter'");
assertIncludes('docs records preview selection chat bridge', docs, '预览选中文本发到 AI 对话');

console.log('preview-selection-to-chat contract ok');
