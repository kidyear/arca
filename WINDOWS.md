# 翻箱 FanBox · Windows 版构建与分发指南

本仓库已完成 Windows 适配（v1.4.0 基础上）。本文说明怎么打出安装包、怎么分发给员工、以及 Windows 版与 mac 版的行为差异。

## 怎么打安装包

node-pty 是原生 C++ 模块，**Windows 安装包必须在 Windows 环境编译**，mac 上无法交叉打包。两条路任选：

### 路线 A：GitHub Actions（推荐，零环境）

1. 把本仓库推到你自己的 GitHub 仓库（公司组织或私有仓库均可）。
2. 仓库页 → **Actions** → **Build Windows Installer** → **Run workflow** 手动触发；
   或打 tag 触发并自动发 Release：`git tag v1.4.0-win.1 && git push --tags`。
3. 等待约 5–10 分钟，从 Actions 的 Artifacts（或 Releases 页）下载 `LingXia-Setup-<版本>.exe`。

### 路线 B：本地 Windows 机器

前置：Node.js 20 LTS、Visual Studio Build Tools（含「使用 C++ 的桌面开发」工作负载）、Python 3。

```powershell
npm ci
npm run dist:win    # = electron-rebuild -f -w node-pty && electron-builder --win
# 产物：dist\LingXia-Setup-<版本>.exe
```

国内网络 Electron 二进制下载被挡时：

```powershell
$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://registry.npmmirror.com/-/binary/"
npm run dist:win
```

## 分发给员工

- 安装包是标准 NSIS 向导（非一键静默），员工可自选安装目录，装完桌面/开始菜单有「翻箱 FanBox」快捷方式。
- **安装包未做代码签名**，首次运行 Windows SmartScreen 会提示「未知发布者」：点「更多信息 → 仍要运行」即可。要彻底消除提示需要企业代码签名证书（EV 证书立即生效，普通 OV 证书需积累信誉）。
- 员工机器**无需安装 Node.js**，运行时已打进安装包。
- 数据与 mac 版一致：全部本地运行、只监听 127.0.0.1、无外网请求。
- 内置的「新版本提醒」在 Windows 版**默认关闭**（上游 Releases 只有 mac dmg，避免误导）。两种重新启用方式：
  - **内网更新源（推荐，员工不必能连 GitHub）**：在任何内网 HTTP 服务器（nginx / IIS / 一个静态目录）放两个东西——安装包本身，和一个 `latest.json`：
    ```json
    { "version": "1.0.0", "url": "http://你的内网服务器/fanbox/LingXia-Setup-1.0.0.exe" }
    ```
    然后让员工机器的 `~/.fanbox/config.json` 里有 `"updateUrl": "http://你的内网服务器/fanbox/latest.json"`（或设环境变量 `FANBOX_UPDATE_URL`）。发新版 = 把新安装包扔上去 + 改一行 latest.json 的版本号，所有员工启动时右下角会弹更新提示，点击直接从内网下载，全程不出公司网络。
  - GitHub Releases：设环境变量 `FANBOX_UPDATE_REPO=你的org/fanbox`（要求员工能访问 GitHub）。

## Windows 版行为差异（相对 mac 版）

| 能力 | Windows 行为 |
|---|---|
| 内嵌终端 | 默认启动 **PowerShell**（ConPTY，UTF-8/中文正常），Claude Code 等 agent 照常跑 |
| 图片缩略图 | 系统自带 PowerShell + System.Drawing 生成（jpg/png/gif/bmp/tiff），**webp/heic/avif 回退为矢量图标** |
| 视频/PDF 缩略图 | 无系统级抽帧工具，回退为矢量图标（预览功能不受影响） |
| 内容搜索 | 无 Spotlight，走内置纯 Node 全文扫描（行为同 mac 的 grep 兜底） |
| 删除文件 | 进系统回收站（PowerShell SendToRecycleBin） |
| 复制文件本体 | PowerShell Set-Clipboard，资源管理器可直接粘贴 |
| 「定位到终端目录」 | 不支持（mac 用 lsof 实现），回退为当前浏览目录 |
| 快捷键 | 界面标签显示 **Ctrl+**（监听本来就同时认 Cmd/Ctrl，无需改习惯） |
| 标题栏 | 系统原生标题栏（mac 的隐藏式红绿灯样式不适用） |

## 适配改动清单（代码审查用）

- `server.js`：缩略图加 win32 分支（PowerShell System.Drawing，路径经环境变量传递防注入）；内容搜索非 darwin 直接走 grep；`/fs/` 路由修正盘符路径前导斜杠；默认根目录增加 OneDrive 桌面/文档候选。
- `electron/main.js`：窗口 chrome 按平台分支；终端默认 shell（win → PowerShell）与 locale 注入仅类 Unix；`clip:file` 加 PowerShell 实现；`pty:cwd` 非 darwin 优雅降级;更新检测 win 默认关闭（`FANBOX_UPDATE_REPO` 可开）。
- `public/app.js`：路径拆分/拼接全面兼容 `\`；变更噪声过滤加 AppData/$RECYCLE.BIN/Thumbs.db 等；终端路径点击识别支持 `C:\` 盘符路径；⌘ 标签按平台显示为 Ctrl+。
- `public/style.css`：交通灯避让与自绘拖拽区限定 `plat-darwin`。
- `package.json`：新增 `build.win`（NSIS x64）+ `nsis` 配置 + `dist:win` 脚本；`build/icon.ico`（256/48/32/16 四尺寸）。
- `.github/workflows/build-windows.yml`：Windows runner 上 rebuild node-pty 并产出安装包。
