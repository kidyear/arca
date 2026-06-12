# 灵匣 Arca — 开发须知

公司内部 AI 工作台（文件管理 × AI Agent），深圳信步科技 SEAVO。基于 FanBox 深度定制（对外介绍不提基座，LICENSE 保留即合规）。

## 必读

**接手任何任务前，先读 [docs/公司版-工作清单.md](docs/公司版-工作清单.md)**——能力清单、发版流程、踩坑录、待办、命名决策（含否决名单，别再提那些名字）都在里面，它是跨会话交接的唯一事实源。

## 架构速览

- 零构建运行时：`server.js`（零依赖 Node 后端）+ `public/app.js`（原生 JS 前端，~4000 行）+ `electron/`（桌面壳）
- AI = Claude Code 内嵌引擎（`@anthropic-ai/claude-agent-sdk`），适配层在 `ai.js`：
  - Provider 走 Anthropic 兼容端点（DeepSeek 默认），第三方用 `ANTHROPIC_AUTH_TOKEN`
  - **引擎不直连外网**：`ANTHROPIC_BASE_URL` 指本机 `/api/ai/relay`，Node 反向代理到真端点（员工机器杀软掐未签名子进程外联，这是血泪教训）
  - 引擎二进制必须从 `app.asar.unpacked` 真实路径 spawn（`engineBinaryPath()`），asar 逻辑路径 spawn 必失败
- Word AI 审阅：`@eigenpal/docx-editor-agents` DocxReviewer + SDK 进程内 MCP 工具（`buildDocxServer`）
- vendor 全部本地化（离线可用）：docx-editor/SheetJS/xterm/milkdown/monaco，构建命令 `npm run build:docx` 等

## 开发与验证

```bash
npm install            # Windows 需 VS Build Tools(C++ 工作负载),node-pty 要编译;只开发网页版可 --ignore-scripts
npm start              # 网页版 http://localhost:4567(改前端/后端逻辑用这个最快)
npm run app            # Electron 桌面版
node --check <file>    # 任何 JS 改动后必跑
```

- 改 `ai.js`/`server.js` 要重启 server；改 `public/*` 刷新页面即可
- AI 链路 E2E：用配置好的 DeepSeek key 发真实对话验证（流式/工具/审批）
- 真机诊断日志：`~/.fanbox/engine.log`

## 规矩

- 兼容层不改名：`~/.fanbox` 目录、`FANBOX_*` 环境变量、`fb_*` localStorage 键、代码注释里的"翻箱"——员工无感知 + 减小上游合并冲突面
- 可见文案全中文，新增词条同步 `public/i18n-dict.js`（按中文原文做 key）
- 皮肤遵守 SEAVO 设计系统：唯一强调色火焰橘红 #E94A16、近直角 var(--radius)、永不发光；新 UI 在 seavo 主题下别用胶囊圆角
- 交互对标 Windows 资源管理器（单击选中/双击打开/Ctrl 多选/Delete 回收站）
- 上游同步：`git fetch origin --tags && git merge <tag>`（origin=alchaincyf/fanbox），合并后必审新增 execFile 的 Windows 兼容性
- 发版：改 `package.json` version → commit → `git tag vX.Y.Z` → `git push seavo main --tags`（seavo=kidyear/arca）→ Actions 自动出 `Arca-Setup-*.exe` 并发 Release → exe 拷内网 `192.168.11.156` 的 `C:\inetpub\wwwroot\arca\` + 改 `latest.json`
