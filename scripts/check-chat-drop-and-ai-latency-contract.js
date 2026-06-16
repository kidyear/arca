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
assertIncludes('agent prompt prepends prior context', ai, 'priorChatContextForAgent(chat),');
assertIncludes('sdk startup is imported for warm agent pool', ai, 'startup: _startup');
assertIncludes('warm agent pool exists', ai, 'const warmAgents = new Map()');
assertIncludes('direct chat starts next agent warmup', ai, 'prepareWarmAgent({ prov, chat, approvalMode, enableDocx: false })');
assertIncludes('agent path tries warm query before cold query', ai, 'const warm = await takeWarmAgent(warmKey)');
assertIncludes('warm agent query is used when ready', ai, 'warm.handle.query(prompt)');
assertIncludes('warm agent cleanup closes single-use handle', ai, 'warm.handle.close()');

console.log('chat-drop-and-ai-latency contract ok');
