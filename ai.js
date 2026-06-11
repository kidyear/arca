'use strict';
/**
 * 翻箱 FanBox — AI 对话后端 v2：Claude Code 引擎适配器
 *
 * 不再自研 agent 循环。对话面板只是「皮肤」，底下跑的是完整的 Claude Code
 * （@anthropic-ai/claude-agent-sdk，内嵌引擎，无需用户另装 claude 命令）：
 * 提示词工程、上下文压缩、工具设计、子代理……全部原装继承，能力不打折。
 *
 * 模型路由：Claude 官方之外，DeepSeek / Kimi / 智谱 / MiniMax 都提供
 * Anthropic 兼容端点（就是为接 Claude Code 而设），换个 baseUrl + key 即切换。
 * Claude 官方不填 key 时直接用本机已登录的 Claude Code 账号（订阅额度）。
 *
 * 会话：引擎自带持久化与续聊（resume）。这里维护一份轻量索引 ~/.fanbox/chats.json
 * 供左侧会话列表用；历史消息回显直接读引擎的 transcript（~/.claude/projects/…）。
 *
 * 安全闸门：危险工具（写文件/执行命令）经 canUseTool 回调转发给前端弹
 * 「允许 / 拒绝」卡片，批准才放行。key 明文存本机，数据只发往所选模型 API。
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
// SDK 是 ESM-only；Electron 33 内置 Node 20 不支持 require(esm)，必须动态 import（懒加载）
let _query = null;
async function getQuery() {
  if (!_query) ({ query: _query } = await import('@anthropic-ai/claude-agent-sdk'));
  return _query;
}

// ---------- Provider 预设（全部 Anthropic 兼容端点）----------
const PROVIDERS = {
  claude:   { label: 'Claude (官方)', baseUrl: '', models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'], keyUrl: 'https://platform.claude.com/settings/keys', note: '不填 key 时用本机已登录的 Claude Code 账号（订阅额度）' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/anthropic', models: ['deepseek-v4-pro', 'deepseek-v4-flash'], keyUrl: 'https://platform.deepseek.com/api_keys' },
  kimi:     { label: 'Kimi 月之暗面', baseUrl: 'https://api.moonshot.cn/anthropic', models: ['kimi-latest'], keyUrl: 'https://platform.moonshot.cn/console/api-keys' },
  zhipu:    { label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/anthropic', models: ['glm-4.6'], keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys' },
  minimax:  { label: 'MiniMax', baseUrl: 'https://api.minimaxi.com/anthropic', models: ['MiniMax-M2'], keyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key' },
  custom:   { label: '自定义中转 (Anthropic 兼容)', baseUrl: '', models: [], keyUrl: '' },
};

// 无需审批直接放行的只读/低危工具；其余（Write/Edit/Bash/…）走前端「允许/拒绝」卡片
const AUTO_ALLOW = new Set(['Read', 'Glob', 'Grep', 'TodoWrite', 'Task', 'WebFetch', 'WebSearch', 'NotebookRead', 'ToolSearch', 'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet']);

// v1（自研引擎）时代存下的 OpenAI 兼容 baseUrl，对新引擎是错的——读到就当没存，回落到预设
const LEGACY_BASEURLS = new Set([
  'https://api.deepseek.com/v1', 'https://api.moonshot.cn/v1', 'https://open.bigmodel.cn/api/paas/v4',
  'https://api.minimaxi.com/v1', 'https://api.openai.com/v1',
]);

module.exports = function createAI(ctx) {
  // ctx: { HOME, PLATFORM, readConfig, updateConfig, resolvePath }
  const CHATS_FILE = path.join(ctx.HOME, '.fanbox', 'chats.json');
  const pendingApprovals = new Map(); // approvalId -> resolve(bool)
  const running = new Map();          // chatId -> AbortController

  // ---------- 会话索引 ----------
  async function readChats() {
    try { return JSON.parse(await fsp.readFile(CHATS_FILE, 'utf8')); } catch { return []; }
  }
  let _chatsChain = Promise.resolve();
  function updateChats(mutator) {
    const run = _chatsChain.then(async () => {
      const chats = await readChats();
      const out = (await mutator(chats)) || chats;
      await fsp.mkdir(path.dirname(CHATS_FILE), { recursive: true });
      const tmp = `${CHATS_FILE}.tmp-${process.pid}`;
      await fsp.writeFile(tmp, JSON.stringify(out, null, 2));
      await fsp.rename(tmp, CHATS_FILE);
      return out;
    });
    _chatsChain = run.catch(() => {});
    return run;
  }

  // ---------- 配置 ----------
  async function getAIConfig() {
    const cfg = await ctx.readConfig();
    const ai = cfg.ai || { active: 'deepseek', providers: {} };
    for (const p of Object.values(ai.providers || {})) {
      if (p.baseUrl && LEGACY_BASEURLS.has(p.baseUrl.replace(/\/+$/, ''))) delete p.baseUrl;
    }
    return ai;
  }
  async function saveAIConfig(patch) {
    await ctx.updateConfig((cfg) => {
      cfg.ai = cfg.ai || { active: 'deepseek', providers: {} };
      const { provider, apiKey, model, baseUrl, activate } = patch;
      if (provider && PROVIDERS[provider]) {
        const p = cfg.ai.providers[provider] || {};
        if (apiKey !== undefined && apiKey !== '') p.apiKey = apiKey;
        if (apiKey === null) delete p.apiKey;
        if (model !== undefined) p.model = model;
        if (baseUrl !== undefined) p.baseUrl = baseUrl;
        cfg.ai.providers[provider] = p;
        if (activate) cfg.ai.active = provider;
      }
    });
  }
  async function activeProvider() {
    const ai = await getAIConfig();
    const key = ai.active || 'deepseek';
    const preset = PROVIDERS[key];
    const user = (ai.providers && ai.providers[key]) || {};
    const baseUrl = (user.baseUrl || preset.baseUrl || '').replace(/\/+$/, '');
    const model = user.model || preset.models[0] || '';
    if (key !== 'claude' && !user.apiKey) throw new Error(`还没配置 ${preset.label} 的 API key — 点右上角 ⚙ 设置`);
    if (key === 'custom' && !baseUrl) throw new Error('自定义中转需要填 Base URL — 点右上角 ⚙ 设置');
    if (!model) throw new Error('还没选择模型 — 点右上角 ⚙ 设置');
    return { key, label: preset.label, baseUrl, model, apiKey: user.apiKey || '' };
  }

  // ---------- 引擎 transcript 回显（读 ~/.claude/projects/<cwd-slug>/<sessionId>.jsonl）----------
  function projectSlug(cwd) { return String(cwd).replace(/[\\/.:]/g, '-'); }
  async function readTranscript(cwd, sessionId) {
    // 引擎按真实路径（symlink 解析后）存 transcript：/tmp → /private/tmp 这类都要试一遍
    const candidates = [cwd];
    try { const real = await fsp.realpath(cwd); if (real !== cwd) candidates.push(real); } catch { /* */ }
    const projRoot = path.join(os.homedir(), '.claude', 'projects');
    let raw = null;
    for (const c of candidates) {
      try { raw = await fsp.readFile(path.join(projRoot, projectSlug(c), `${sessionId}.jsonl`), 'utf8'); break; } catch { /* 试下一个 */ }
    }
    if (raw === null) {
      // 兜底：sessionId 全局唯一，扫一遍所有项目目录（cwd 被移动/删除后路径推导会失效）
      try {
        for (const d of await fsp.readdir(projRoot)) {
          try { raw = await fsp.readFile(path.join(projRoot, d, `${sessionId}.jsonl`), 'utf8'); break; } catch { /* */ }
        }
      } catch { /* */ }
    }
    if (raw === null) return [];
    const msgs = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let j; try { j = JSON.parse(line); } catch { continue; }
      // 只回显主线：用户文字、助手文字、助手工具调用名（子代理内部过程不回显）
      if (j.isSidechain) continue;
      const content = j.message && j.message.content;
      if (!Array.isArray(content)) {
        if (j.type === 'user' && typeof content === 'string' && content.trim()) msgs.push({ role: 'user', text: content });
        continue;
      }
      for (const b of content) {
        if (j.type === 'user' && b.type === 'text' && b.text && !b.text.startsWith('<')) msgs.push({ role: 'user', text: b.text });
        else if (j.type === 'assistant' && b.type === 'text' && b.text) msgs.push({ role: 'assistant', text: b.text });
        else if (j.type === 'assistant' && b.type === 'tool_use') msgs.push({ role: 'tool', name: b.name, detail: toolDetail(b.name, b.input) });
      }
    }
    return msgs;
  }
  function toolDetail(name, input) {
    const a = input || {};
    return String(a.file_path || a.path || a.command || a.pattern || a.query || a.url || a.description || '').slice(0, 140);
  }

  // ---------- HTTP 路由 ----------
  async function handle(req, res, url) {
    const p = url.pathname;
    if (!p.startsWith('/api/ai/')) return false;

    if (p === '/api/ai/providers' && req.method === 'GET') {
      const ai = await getAIConfig();
      const out = {};
      for (const [k, v] of Object.entries(PROVIDERS)) {
        const u = (ai.providers && ai.providers[k]) || {};
        out[k] = { label: v.label, baseUrl: u.baseUrl || v.baseUrl, models: v.models, keyUrl: v.keyUrl, note: v.note || '', hasKey: !!u.apiKey, model: u.model || v.models[0] || '' };
      }
      sendJSON(res, 200, { active: ai.active || 'deepseek', providers: out });
      return true;
    }
    if (p === '/api/ai/config' && req.method === 'POST') {
      await saveAIConfig(await readBody(req));
      sendJSON(res, 200, { ok: true });
      return true;
    }
    if (p === '/api/ai/models' && req.method === 'POST') {
      // Anthropic 兼容端点不一定都实现 /v1/models；拉不到就回落预设列表
      try {
        const body = await readBody(req);
        const preset = PROVIDERS[body.provider]; if (!preset) throw new Error('未知 provider');
        const ai = await getAIConfig();
        const u = (ai.providers && ai.providers[body.provider]) || {};
        const apiKey = body.apiKey || u.apiKey;
        const baseUrl = (body.baseUrl || u.baseUrl || preset.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
        if (!apiKey) throw new Error('该服务商需要先填 API key 才能拉取');
        const r = await fetch(`${baseUrl}/v1/models`, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } });
        if (!r.ok) throw new Error(`API ${r.status}`);
        const j = await r.json();
        const ids = (j.data || []).map((m) => m.id).filter(Boolean).sort();
        if (!ids.length) throw new Error('该端点没有返回模型列表');
        sendJSON(res, 200, { ok: true, models: ids });
      } catch (e) { sendJSON(res, 200, { ok: false, error: `${e.message}（可直接手填模型 ID）` }); }
      return true;
    }
    if (p === '/api/ai/chats' && req.method === 'GET') {
      const chats = await readChats();
      sendJSON(res, 200, { chats: chats.sort((a, b) => b.ts - a.ts) });
      return true;
    }
    if (p === '/api/ai/chat-history' && req.method === 'GET') {
      const id = url.searchParams.get('id');
      const chat = (await readChats()).find((c) => c.id === id);
      if (!chat || !chat.sessionId) { sendJSON(res, 200, { messages: [] }); return true; }
      sendJSON(res, 200, { messages: await readTranscript(chat.cwd, chat.sessionId), chat });
      return true;
    }
    if (p === '/api/ai/chat-delete' && req.method === 'POST') {
      const { id } = await readBody(req);
      await updateChats((chats) => chats.filter((c) => c.id !== id));
      sendJSON(res, 200, { ok: true });
      return true;
    }
    if (p === '/api/ai/approve' && req.method === 'POST') {
      const { id, approve } = await readBody(req);
      const resolve = pendingApprovals.get(id);
      if (resolve) resolve(!!approve);
      sendJSON(res, 200, { ok: !!resolve });
      return true;
    }
    if (p === '/api/ai/stop' && req.method === 'POST') {
      const { chatId } = await readBody(req);
      const ac = running.get(chatId);
      if (ac) { try { ac.abort(); } catch { /* */ } }
      sendJSON(res, 200, { ok: true });
      return true;
    }
    if (p === '/api/ai/chat' && req.method === 'POST') {
      await handleChat(req, res);
      return true;
    }
    return false;
  }

  // ---------- 对话主流程：一次用户消息 = 一次引擎 query ----------
  async function handleChat(req, res) {
    const { chatId, text, attachments, cwd } = await readBody(req);
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const send = (obj) => { try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch { /* 客户端断开 */ } };
    let runKey = chatId;
    try {
      const prov = await activeProvider();
      // 找到/新建会话记录。resume 要求 cwd 一致，所以会话固定在创建时的目录
      const chats = await readChats();
      let chat = chats.find((c) => c.id === chatId);
      if (!chat) {
        chat = { id: 'c' + crypto.randomBytes(8).toString('hex'), title: (text || '新对话').slice(0, 40), sessionId: null, cwd: cwd || ctx.HOME, provider: prov.key, model: prov.model, ts: Date.now() };
        await updateChats((list) => { list.push(chat); return list; });
      }
      send({ type: 'chat', id: chat.id, title: chat.title });
      send({ type: 'meta', provider: prov.label, model: prov.model });

      // 第三方模型：环境变量指到它的 Anthropic 兼容端点；小模型任务也指过去（别打到官方 haiku）
      const env = { ...process.env };
      // 引擎的更新检查/遥测/错误上报等非必要外联一律关掉——员工机器只跟所选模型 API 通信
      env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
      env.DISABLE_TELEMETRY = '1';
      env.DISABLE_ERROR_REPORTING = '1';
      if (prov.key !== 'claude') {
        // 第三方端点统一走 Bearer 认证（DeepSeek 等官方指引就是 ANTHROPIC_AUTH_TOKEN）。
        // 注意要 delete 而不是置空串——空串环境变量照样占住认证优先级
        env.ANTHROPIC_BASE_URL = prov.baseUrl;
        env.ANTHROPIC_AUTH_TOKEN = prov.apiKey;
        delete env.ANTHROPIC_API_KEY;
        env.ANTHROPIC_MODEL = prov.model;
        env.ANTHROPIC_SMALL_FAST_MODEL = prov.model;
        env.ANTHROPIC_DEFAULT_HAIKU_MODEL = prov.model;
      } else if (prov.apiKey) {
        env.ANTHROPIC_API_KEY = prov.apiKey;
        delete env.ANTHROPIC_AUTH_TOKEN;
      }

      const prompt = [text, ...(attachments || []).map((a) => `（附件，请按需读取：${a}）`)].filter(Boolean).join('\n');
      const query = await getQuery();
      const ac = new AbortController();
      runKey = chat.id;
      running.set(runKey, ac);
      req.on('close', () => { try { ac.abort(); } catch { /* */ } });

      const q = query({
        prompt,
        options: {
          cwd: chat.cwd,
          model: prov.model,
          resume: chat.sessionId || undefined,
          permissionMode: 'default',
          includePartialMessages: true,
          maxTurns: 100,
          abortController: ac,
          env,
          systemPrompt: {
            type: 'preset', preset: 'claude_code',
            append: [
              '你在「翻箱 FanBox」的对话面板里工作，用户可能不熟悉技术——回答说人话、保持简洁、始终用中文。',
              '产出尽量落成文件（写到当前工作目录），并在回答里给出文件路径。',
              '删除、覆盖、批量改动前先用一两句话说明影响。',
            ].join('\n'),
          },
          canUseTool: async (toolName, input, { signal }) => {
            if (AUTO_ALLOW.has(toolName)) return { behavior: 'allow', updatedInput: input };
            const id = crypto.randomBytes(8).toString('hex');
            send({ type: 'approval', id, name: toolName, args: input });
            const ok = await new Promise((resolve) => {
              const timer = setTimeout(() => { pendingApprovals.delete(id); resolve(false); }, 5 * 60 * 1000);
              const done = (v) => { clearTimeout(timer); pendingApprovals.delete(id); resolve(v); };
              pendingApprovals.set(id, done);
              if (signal) signal.addEventListener('abort', () => done(false), { once: true });
            });
            send({ type: 'approval_done', name: toolName, ok });
            return ok ? { behavior: 'allow', updatedInput: input } : { behavior: 'deny', message: '用户拒绝了这次操作，请换个方式或询问用户' };
          },
        },
      });

      for await (const msg of q) {
        if (msg.type === 'system' && msg.subtype === 'init') {
          if (msg.session_id && msg.session_id !== chat.sessionId) {
            chat.sessionId = msg.session_id;
            await updateChats((list) => { const c = list.find((x) => x.id === chat.id); if (c) c.sessionId = msg.session_id; return list; });
          }
        } else if (msg.type === 'stream_event') {
          // 逐 token 流式：只转发主线（忽略子代理内部输出）
          if (msg.parent_tool_use_id) continue;
          const ev = msg.event;
          if (ev.type === 'content_block_delta') {
            if (ev.delta.type === 'text_delta') send({ type: 'text', delta: ev.delta.text });
            else if (ev.delta.type === 'thinking_delta' && ev.delta.thinking) send({ type: 'think', delta: ev.delta.thinking });
          }
        } else if (msg.type === 'assistant') {
          // 文本已经流过了，这里只取工具调用事件
          if (msg.parent_tool_use_id) continue;
          for (const b of (msg.message && msg.message.content) || []) {
            if (b.type === 'tool_use') send({ type: 'tool', name: b.name, args: b.input });
          }
        } else if (msg.type === 'user') {
          if (!msg.parent_tool_use_id) send({ type: 'tool_done' });
        } else if (msg.type === 'result') {
          await updateChats((list) => { const c = list.find((x) => x.id === chat.id); if (c) c.ts = Date.now(); return list; });
          if (msg.is_error && msg.subtype !== 'success') send({ type: 'error', message: String(msg.result || msg.subtype).slice(0, 500) });
          send({ type: 'done', cost: msg.total_cost_usd, turns: msg.num_turns });
        }
      }
    } catch (e) {
      const aborted = e.name === 'AbortError' || /abort/i.test(e.message || '');
      send({ type: 'error', message: aborted ? '已停止' : e.message });
      send({ type: 'done' });
    } finally {
      running.delete(runKey);
    }
    res.end();
  }

  return { handle };
};

// ---------- 小工具 ----------
function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => { buf += c; if (buf.length > 8 * 1024 * 1024) { reject(new Error('请求过大')); req.destroy(); } });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
