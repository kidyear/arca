'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const ai = fs.readFileSync(path.join(root, 'ai.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('chat drop accepts multi-path drags', app, 'application/x-fanbox-paths');
assertIncludes('chat drop uses shared internal path parser', app, 'const droppedPaths = internalDragPaths(e.dataTransfer);');
assertIncludes('chat drop attaches every internal path', app, 'droppedPaths.forEach((p) => this.addAttachment(p));');
assertIncludes('chat drop rejects browser-only system files clearly', app, '网页版拿不到系统文件路径');
assertIncludes('chat drop keeps path-only semantics', app, '没有拿到真实文件路径');
assertIncludes('chat drop validates text/plain before attaching', app, 'looksLikePath(p)');
assertIncludes('chat drop reports non-path text', app, '拖入的内容不是可读取的文件路径');
if (/host\.addEventListener\('drop'[\s\S]*?saveTemp/.test(app)) {
  throw new Error('chat drop must not copy files to temp; it should attach paths only');
}

assertIncludes('docx tools are gated', ai, 'function shouldEnableDocxTools');
assertIncludes('docx tools are optional for query', ai, 'const mcpServers = enableDocx ?');
assertIncludes('query omits docx mcp when disabled', ai, '...(mcpServers ? { mcpServers } : {})');
assertIncludes('chat prep timing log exists', ai, 'prep=${Date.now() - t0}ms');
assertIncludes('first token timing log exists', ai, 'first_text=${Date.now() - t0}ms');
assertIncludes('relay timing log exists', ai, 'relay ${req.method}');
assertIncludes('thinking notification flag exists', ai, 'let thinkingNotified = false;');
assertIncludes('thinking stream is status-only', ai, "send({ type: 'think' });");
if (ai.includes("send({ type: 'think', delta: ev.delta.thinking })")) {
  throw new Error('thinking_delta must not be streamed verbatim to the UI');
}
assertIncludes('direct chat closes SSE stream', ai, 'await runDirectChat({ prov, chat, text, send, signal: ac.signal, startedAt: t0 });\n        res.end();');
assertIncludes('approval modes exist', ai, "const APPROVAL_MODES = new Set(['ask', 'smart', 'auto'])");
assertIncludes('approval mode config is returned', ai, 'approvalMode: ai.approvalMode ||');
assertIncludes('approval mode config is saved', ai, 'cfg.ai.approvalMode = approvalMode');
assertIncludes('approval mode decision helper exists', ai, 'function approvalDecision');
assertIncludes('approval mode all allow', ai, "mode === 'auto'");
assertIncludes('approval mode smart allowlist', ai, "mode === 'smart' && AUTO_ALLOW.has(toolName)");
assertIncludes('approval setting UI exists', app, '#ai-approval-mode button');
assertIncludes('agent receives prior direct chat context', ai, 'function priorChatContextForAgent(chat)');
assertIncludes('agent context tells model to resolve references', ai, '默认指向最近一轮助手已经产出的内容');
assertIncludes('agent prior context keeps tool summaries', ai, "(m.role === 'tool' && (m.detail || m.name))");
assertIncludes('agent prior context labels tool summaries', ai, "const label = m.role === 'tool' ? '工具' : (m.role === 'assistant' ? '助手' : '用户');");
assertIncludes('agent prior context formats tool detail', ai, "let text = m.role === 'tool' ? `${m.name || 'tool'}：${m.detail || ''}` : String(m.text || '').trim();");
assertIncludes('agent prior context includes historic attachment paths', ai, "const att = Array.isArray(m.attachments) && m.attachments.length ? `\\n附件路径：${m.attachments.join('\\n')}` : '';");
assertIncludes('agent prior context appends attachment paths to user lines', ai, 'const line = `${label}：${text}${att}`;');
assertIncludes('agent prompt prepends prior context', ai, 'priorChatContextForAgent(chat),');
assertIncludes('agent path accumulates assistant text for future context', ai, 'let agentAnswer = \'\';');
assertIncludes('agent path accumulates tool messages for history', ai, 'const agentToolMessages = [];');
assertIncludes('agent streamed text is remembered', ai, 'agentAnswer += ev.delta.text || \'\';');
assertIncludes('agent assistant message text fallback is remembered', ai, "if (!firstTextLogged && b.type === 'text') agentAnswer += b.text || '';");
assertIncludes('agent tool calls are remembered for history', ai, "agentToolMessages.push({ role: 'tool', name: b.name, detail: toolDetail(b.name, b.input) });");
assertIncludes('agent history message builder exists', ai, 'const agentHistoryMessages = [{ role: \'user\', text, attachments: [...(attachments || [])] }];');
assertIncludes('agent history stores tool messages before final assistant text', ai, 'agentHistoryMessages.push(...agentToolMessages);');
assertIncludes('agent history skips blank assistant bubbles', ai, "if (agentAnswer.trim()) agentHistoryMessages.push({ role: 'assistant', text: agentAnswer });");
assertIncludes('agent path stores user tool and assistant messages', ai, 'c.messages = [...(c.messages || []), ...agentHistoryMessages].slice(-40);');
assertIncludes('chat history merge helper exists', ai, 'function mergeChatHistory(transcriptMessages, lightMessages)');
assertIncludes('chat history merge preserves light history order first', ai, 'if ((lightMessages || []).length) {');
assertIncludes('chat history merge appends transcript gaps after light history', ai, 'for (const m of lightMessages || []) add(m, true);');
assertIncludes('chat history merge enriches duplicates with light metadata', ai, 'out[seen.get(key)] = { ...out[seen.get(key)], ...m };');
assertIncludes('chat history endpoint reads transcript even with light messages', ai, 'const transcriptMessages = chat.sessionId ? await readTranscript(chat.cwd, chat.sessionId) : [];');
assertIncludes('chat history endpoint returns merged history', ai, 'const messages = mergeChatHistory(transcriptMessages, lightMessages);');
assertIncludes('transcript user prompt cleaner exists', ai, 'function visibleTranscriptUserText(text)');
assertIncludes('transcript internal context prompt is detected', ai, "if (!s.startsWith('以下是本对话前文。')) return s;");
assertIncludes('transcript string user text is cleaned', ai, 'const text = visibleTranscriptUserText(content);');
assertIncludes('transcript array user text is cleaned', ai, 'const text = visibleTranscriptUserText(b.text);');
assertIncludes('sdk startup is imported for warm agent pool', ai, 'startup: _startup');
assertIncludes('warm agent pool exists', ai, 'const warmAgents = new Map()');
assertIncludes('direct chat starts next agent warmup', ai, 'prepareWarmAgent({ prov, chat, approvalMode, enableDocx: false })');
assertIncludes('agent path tries warm query before cold query', ai, 'const warm = await takeWarmAgent(warmKey)');
assertIncludes('warm agent query is used when ready', ai, 'warm.handle.query(prompt)');
assertIncludes('warm agent cleanup closes single-use handle', ai, 'warm.handle.close()');

console.log('chat-drop-and-ai-latency contract ok');
