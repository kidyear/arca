# Windows 开发环境搭建（一次性，约 20 分钟）

在 Windows 上继续开发灵匣，不用再 mac/win 两头跑。

## 1. 装工具

1. **Git**：https://git-scm.com/download/win （一路下一步）
2. **Node.js 20 LTS**：https://nodejs.org/ （装的时候勾上 "Automatically install the necessary tools" 会顺带装编译工具；没勾也行，见下一条）
3. **VS Build Tools**（node-pty 原生模块编译需要；只想改网页版可跳过）：
   https://visualstudio.microsoft.com/visual-cpp-build-tools/ → 勾选「使用 C++ 的桌面开发」
4. **Claude Code**：`npm install -g @anthropic-ai/claude-code`（或用 npm 装的 claude 桌面版）

## 2. 拉代码

```powershell
git clone https://github.com/kidyear/arca.git
cd arca
npm install          # 如果 node-pty 编译报错且暂时不需要内嵌终端: npm install --ignore-scripts
```

> 私库,首次 git 操作会弹 GitHub 登录(浏览器授权 kidyear 账号即可)。

## 3. 跑起来

```powershell
npm start            # 网页版 http://localhost:4567 —— 日常开发用这个,改完刷新就生效
npm run app          # Electron 桌面版(需要 node-pty 编译成功)
```

AI 对话需要先在界面 ⚙ 设置里配 DeepSeek key（key 存本机 `~/.fanbox/config.json`，不进 git）。

## 4. 上游同步（origin 已指向开源 fanbox）

```powershell
git remote add seavo https://github.com/kidyear/arca.git   # clone 下来 origin 就是 seavo 的话跳过
git remote add upstream https://github.com/alchaincyf/fanbox.git
```

> 注意:在 mac 上的仓库里 origin=上游、seavo=私库;Windows 上 clone 私库后 origin=私库,
> 上游请加成 upstream,同步命令对应换成 `git fetch upstream --tags && git merge <tag>`。

## 5. 交接给 Claude Code

项目根目录有 `CLAUDE.md`（打开项目自动生效）+ `docs/公司版-工作清单.md`（全部上下文）。
在项目目录里启动 `claude`，把交接提示词贴进去即可无缝续上。
