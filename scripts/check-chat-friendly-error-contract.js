'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('friendly chat error helper exists', app, 'function friendlyChatError(message)');
assertIncludes('network/relay errors become actionable Chinese', app, "return 'AI 服务暂时没有响应，请检查网络、本机中转或稍后重试';");
assertIncludes('auth errors become API key guidance', app, "return 'AI 认证失败，请检查 API key 或重新保存服务商设置';");
assertIncludes('rate limit errors become retry/quota guidance', app, "return 'AI 服务限流或额度不足，请稍后重试或检查额度';");
assertIncludes('model errors become model settings guidance', app, "return '模型不可用，请检查 AI 设置里的模型名称';");
assertIncludes('HTTP details are normalized before display', app, 'function friendlyChatHttpError(status, statusText, detail)');
assertIncludes('HTTP chat error uses friendly helper', app, 'const message = friendlyChatHttpError(res.status, res.statusText, detail);');
assertIncludes('stream chat error uses friendly helper', app, 'const friendly = friendlyChatError(ev.message);');
assertIncludes('chat error renders friendly text', app, "er.textContent = '⚠ ' + friendly;");
assertIncludes('chat error actions helper exists', app, 'function appendChatErrorActions(container, rawMessage, friendlyMessage, retry)');
assertIncludes('chat auth/model error can open settings', app, 'settings.textContent = \'打开设置\';');
assertIncludes('chat auth/model action opens settings modal', app, 'settings.onclick = () => aiSettings.open();');
assertIncludes('chat retry action exists', app, 'retryBtn.textContent = \'重试\';');
assertIncludes('chat retry action calls resend callback', app, 'retryBtn.onclick = () => retry();');
assertIncludes('chat error renderer attaches actions', app, 'appendChatErrorActions(er, ev.message, friendly, () => this.send());');
assertIncludes('chat error actions style exists', fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8'), '.chat-error-actions');
assertIncludes('chat error action button style exists', fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8'), '.chat-error-action');
assertIncludes('draft restore still uses raw message for stopped detection', app, 'restoreFailedChatDraft(ev.message);');
assertIncludes('catch network errors go through normal error event', app, "onEvent({ type: 'error', message: e.message });");

if (/er\.textContent\s*=\s*['"`]⚠\s*['"`]\s*\+\s*ev\.message/.test(app)) {
  throw new Error('chat UI must not render raw ev.message directly');
}
if (/onEvent\(\{\s*type:\s*'error',\s*message:\s*'连接中断: '\s*\+\s*e\.message\s*\}\)/.test(app)) {
  throw new Error('chat catch block must not prefix and expose raw network errors');
}

console.log('chat-friendly-error contract ok');
