<div align="center">

# 灵匣 Arca

**文件夹操作 × AI Agent 的结合体 —— 匣中有灵：文件信手可得，活儿交给 AI 办。**

深圳信步科技 SEAVO 内部工具 · Windows / macOS

</div>

---

## 它是什么

灵匣是一个把**文件管理**和 **AI 助手**装进同一个匣子的桌面工具：

- **左手文件**：浏览、预览、编辑本地文件——Word/Excel 应用内直接看直接改，图片标注、压缩包预览、Markdown 富文本编辑
- **右手 AI**：对话面板里的 AI 能读你的文件、替你整理归档、写摘要、翻译、对比报价、审合同——像一个坐在文件堆里的助理
- **Word AI 审阅**：让 AI 像审阅者一样给 .docx 打批注、做修订（标准 Word 审阅标记，可逐条接受/拒绝）
- **任务模板**：按部门预置的卡片（文控/采购/品质/通用），填空即用，不用学写提示词

## 给员工的三步上手

1. 安装 `Arca-Setup-<版本>.exe`（SmartScreen 提示时点「更多信息 → 仍要运行」）
2. 右下角 ⚙ 设置 → 选服务商 → 粘贴你领到的 API key → 选模型
3. 点「对话」，从模板挑一张卡片，或直接说你要干什么

数据不出公司：文件都在本机，AI 请求只发往配置的模型服务商，更新走公司内网。

## 技术底

- Electron 桌面应用，零外部运行时依赖
- AI 引擎为 Claude Code 内嵌引擎（Agent SDK），通过 Anthropic 兼容端点支持 DeepSeek / Kimi / 智谱 / MiniMax 等国产模型
- 发版：打 tag 自动构建（GitHub Actions），员工端从内网更新源自动发现新版本

## 开发

```bash
npm install
npm start          # 网页版 http://localhost:4567
npm run app        # 桌面版
npm run dist:win   # Windows 安装包（需在 Windows 上构建）
```

维护文档见 [docs/公司版-工作清单.md](docs/公司版-工作清单.md)（能力清单/发版流程/踩坑录）。

## License

MIT（见 [LICENSE](LICENSE)）。
