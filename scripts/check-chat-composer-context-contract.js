'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('composer context hint exists', html, 'id="chat-context-hint"');
assertIncludes('composer context hint style exists', css, '.chat-context-hint');
assertIncludes('composer context hidden style exists', css, '.chat-context-hint.hidden');
assertIncludes('selected file helper exists', app, 'function chatSelectedFilePaths()');
assertIncludes('context summary updater exists', app, 'function refreshChatComposerContext()');
assertIncludes('attachment state takes priority', app, '已附加 ');
assertIncludes('selected files are described as not auto-attached', app, '当前选中 ');
assertIncludes('attachable selection helper exists', app, 'function chatSelectedAttachablePaths()');
assertIncludes('attachable selection excludes drive roots', app, 'filter((e) => e && !e.isDrive)');
assertIncludes('drive selections are explained', app, '当前选中的是磁盘');
assertIncludes('selected files can be explicitly attached', app, 'function attachSelectedFilesToChat()');
assertIncludes('attach selected button exists', app, 'chat-use-selected');
assertIncludes('attach selected button copy exists', app, '附加选中');
assertIncludes('attach selected uses same path-only helper', app, 'chatSelectedAttachablePaths().forEach((p) => chat.addAttachment(p));');
assertIncludes('attach selected button style exists', css, '.chat-use-selected');
assertIncludes('attachment chip open button exists', app, "open.className = 'chat-chip-open'");
assertIncludes('attachment chip open calls path opener', app, 'openChatPathReference(p)');
assertIncludes('attachment chip open has full path title', app, 'open.title = p;');
assertIncludes('attachment chip open style exists', css, '.chat-chip-open');
assertIncludes('attachment chip copy button exists', app, "copy.className = 'chat-chip-copy'");
assertIncludes('attachment chip copy calls copyPath', app, 'copy.onclick = () => copyPath(p);');
assertIncludes('attachment chip copy label exists', app, "copy.textContent = '复制';");
assertIncludes('attachment chip copy style exists', css, '.chat-chip-copy');
assertIncludes('clear attachments helper exists', app, 'function clearChatAttachments()');
assertIncludes('clear attachments resets queue', app, 'chat.attachments = [];');
assertIncludes('clear attachments rerenders chips', app, 'chat.renderChips();');
assertIncludes('clear attachments button exists', app, 'chat-clear-attachments');
assertIncludes('clear attachments button copy exists', app, '清空附件');
assertIncludes('clear attachments button style exists', css, '.chat-clear-attachments');
assertIncludes('sent attachment renderer exists', app, 'function renderSentAttachmentSummary(paths)');
assertIncludes('sent attachment summary uses path chips', app, 'at.appendChild(chatPathActionNode(p));');
assertIncludes('sent attachment summary no longer plain text only', app, 'u.appendChild(renderSentAttachmentSummary(payload.attachments));');
assertIncludes('sent attachment summary style exists', css, '.chat-user-atts .chat-path-action');
assertIncludes('selection repaint refreshes chat context', app, 'refreshChatComposerContext();');
assertIncludes('attachment chip render refreshes chat context', app, 'refreshChatComposerContext();');
assertIncludes('chat init refreshes context', app, 'this.refreshComposerContext();');
assertIncludes('chat helper delegates to context refresh', app, 'refreshComposerContext() { refreshChatComposerContext(); }');

console.log('chat-composer-context contract ok');
