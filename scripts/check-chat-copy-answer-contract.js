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

const copyText = sliceFunction(app, 'copyText');
const formatCopyFailMessage = sliceFunction(app, 'formatCopyFailMessage');
const appendAssistantCopyAction = sliceFunction(app, 'appendAssistantCopyAction');
const updateAssistantCopyActionState = sliceFunction(app, 'updateAssistantCopyActionState');
const enhanceChatCodeBlocks = sliceFunction(app, 'enhanceChatCodeBlocks');
const tableToTsv = sliceFunction(app, 'chatTableToTsv');
const enhanceChatTables = sliceFunction(app, 'enhanceChatTables');
const openChat = app.slice(app.indexOf('async openChat(id)'), app.indexOf('\n  newChat()', app.indexOf('async openChat(id)')));
const send = app.slice(app.indexOf('async send(forcedText, displayText)'), app.indexOf('\n  stop()', app.indexOf('async send(forcedText, displayText)')));

assertIncludes('generic copy helper uses desktop bridge when available', copyText, 'window.fanboxClipboard.copyText(text)');
assertIncludes('generic copy helper falls back to navigator clipboard', copyText, 'navigator.clipboard.writeText(text)');
assertIncludes('generic copy failure default is desktop-neutral', copyText, "failMsg = '复制失败'");
assertIncludes('generic copy helper catches concrete error', copyText, 'catch (err)');
assertIncludes('generic copy helper shows concrete error reason', copyText, 'toast(formatCopyFailMessage(failMsg, err), true);');
assertIncludes('copy failure formatter exists', app, 'function formatCopyFailMessage(failMsg, err)');
assertIncludes('copy failure formatter uses friendly error text', formatCopyFailMessage, "friendlyErrorText(err, '')");
assertIncludes('path copy failure is also desktop-neutral', app, "'复制路径失败，路径：' + text");
assertIncludes('assistant copy state helper disables blank replies', updateAssistantCopyActionState, 'btn.disabled = !hasText;');
assertIncludes('assistant copy state helper explains disabled reason', updateAssistantCopyActionState, "btn.title = hasText ? '复制这条 AI 回复' : '回复生成后可复制';");
assertIncludes('assistant copy action has label', appendAssistantCopyAction, '复制回复');
assertIncludes('assistant copy action initializes disabled state', appendAssistantCopyAction, 'updateAssistantCopyActionState(btn, getText);');
assertIncludes('assistant copy action copies raw answer text', appendAssistantCopyAction, 'copyText(text, \'已复制回复\')');
assertIncludes('assistant copy action does not show for blank text', appendAssistantCopyAction, 'if (!text.trim())');
assertIncludes('code block enhancer marks processed blocks', enhanceChatCodeBlocks, 'pre.dataset.copyEnhanced = \'1\';');
assertIncludes('code block enhancer creates button', enhanceChatCodeBlocks, 'btn.className = \'chat-code-copy\';');
assertIncludes('code block copy action copies raw code text', enhanceChatCodeBlocks, 'copyText(code.innerText || code.textContent || \'\', \'已复制代码块\')');
assertIncludes('code block enhancer creates terminal button', enhanceChatCodeBlocks, 'termBtn.className = \'chat-code-send-term\';');
assertIncludes('code block terminal action uses safe terminal context paste', enhanceChatCodeBlocks, "term.sendContext(code.innerText || code.textContent || '', 'AI 回复代码块')");
assertIncludes('code block terminal action does not auto execute', enhanceChatCodeBlocks, "toast('已发到终端，确认后再回车')");
assertIncludes('table to tsv keeps rows', tableToTsv, 'return rows.map((row)');
assertIncludes('table to tsv joins cells with tabs', tableToTsv, ".join('\\t')");
assertIncludes('table enhancer marks processed tables', enhanceChatTables, 'table.dataset.copyEnhanced = \'1\';');
assertIncludes('table enhancer wraps table', enhanceChatTables, 'wrap.className = \'chat-table-wrap\';');
assertIncludes('table enhancer creates copy button', enhanceChatTables, 'btn.className = \'chat-table-copy\';');
assertIncludes('table copy action copies tsv text', enhanceChatTables, 'copyText(chatTableToTsv(table), \'已复制表格\')');
assertIncludes('historical assistant messages get copy action', openChat, 'appendAssistantCopyAction(a, () => m.text || \'\');');
assertIncludes('historical assistant code blocks are enhanced', openChat, 'enhanceChatCodeBlocks(md);');
assertIncludes('historical assistant tables are enhanced', openChat, 'enhanceChatTables(md);');
assertIncludes('streaming assistant accumulates copyable answer', send, 'let assistantCopyText = \'\';');
assertIncludes('streaming assistant stores copy button', send, 'const assistantCopyBtn = appendAssistantCopyAction(a, () => assistantCopyText);');
assertIncludes('streaming text updates copy buffer', send, 'assistantCopyText += ev.delta || \'\';');
assertIncludes('streaming text enables copy button', send, 'updateAssistantCopyActionState(assistantCopyBtn, () => assistantCopyText);');
assertIncludes('streaming assistant code blocks are enhanced', send, 'enhanceChatCodeBlocks(mdDiv);');
assertIncludes('streaming assistant tables are enhanced', send, 'enhanceChatTables(mdDiv);');
assertIncludes('copy button style exists', css, '.chat-copy-answer');
assertIncludes('disabled copy button style exists', css, '.chat-copy-answer:disabled');
assertIncludes('code block copy style exists', css, '.chat-code-copy');
assertIncludes('code block terminal style exists', css, '.chat-code-send-term');
assertIncludes('table copy style exists', css, '.chat-table-copy');

console.log('chat-copy-answer contract ok');
