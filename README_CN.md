# Paged A4 Editor（分页 A4 编辑器）

一款 [Obsidian](https://obsidian.md) 插件，将编辑器和阅读视图渲染为 A4 风格的分页页面，并自动插入页码——类似 Microsoft Word 的**页面布局**视图。

你的笔记不再是无限滚动的文档，而是显示为独立的页面，页面之间有灰色间隙，可自定义页面尺寸、页边距和页码样式。

## 功能特性

- **分页编辑视图** — CodeMirror 6 编辑器被切分为视觉页面，带有真实的纸张阴影和页面间的灰色桌面背景。
- **分页阅读视图** — 阅读模式通过 JS 插入真实分页符来镜像编辑器的分页（不仅仅是 CSS），确保导出/打印输出与所见一致。
- **基于字符数的尺寸配置** — 不使用固定纸张尺寸，页面尺寸由每行字符数和每页行数推导而来。提供一键**重置为 A4 标准值**按钮。
- **页边距预设** — Normal（25.4 mm）、Narrow（12.7 mm）或 Wide（50.8 mm）。边距应用于每一页，包括中间页。
- **自动页码** — 在每个页面边界渲染页码徽标。可选择位置（左下 / 居中 / 右下）和格式（`1`、`Page 1 of n`、`第 1 页`）。
- **字体变化响应** — 当 Obsidian 的字体或外观设置改变时，页面几何尺寸会自动重新测量。
- **移动端适配** — 尽可能避免桌面专属 API；插件在移动端也可工作，但针对桌面端优化（`isDesktopOnly: true`）。

## 安装

### 从社区插件目录安装（发布后）

1. 打开 **Settings → Community plugins**。
2. 搜索 "Paged A4 Editor"。
3. 点击 **Install**，然后 **Enable**。

### 手动安装

1. 从 [最新发布版本](https://github.com/7Dt3V5TmzAtfur/obsidian-paged-a4-editor/releases) 下载 `main.js`、`manifest.json` 和 `styles.css`。
2. 将它们复制到 `<vault>/.obsidian/plugins/paged-a4-editor/` 目录下。
3. 重新加载 Obsidian，在 **Settings → Community plugins** 中启用插件。

## 使用方法

启用后，编辑器和阅读视图会自动切换为分页布局。打开 **Settings → Paged A4 Editor** 进行配置：

| 设置项 | 说明 | 范围 |
|---|---|---|
| **Enable paged mode** | 开启/关闭分页布局。 | — |
| **每行字符数** | 每行可显示的字符数量。重置按钮可恢复 A4 标准值（80）。 | 30–300 |
| **每页行数** | 每页可显示的行数。重置按钮可恢复 A4 标准值（40）。 | 15–80 |
| **Margin preset** | 内容区域周围的页边距。 | Normal / Narrow / Wide |
| **Page number position** | 页码徽标的水平位置。 | 左下 / 居中 / 右下 |
| **Page number format** | 页码的文本样式。 | `1` / `Page 1 of n` / `第 1 页` |

### A4 标准值

重置按钮恢复的值基于标准 A4 页面（210 × 297 mm）、Normal 边距（25.4 mm）和 Obsidian 默认 ~16 px 字体推导而来：

- **每行 80 字符**
- **每页 40 行**

## 开发

本项目使用 TypeScript 和 [esbuild](https://esbuild.github.io/) 进行打包。

### 环境要求

- Node.js 18+（`node --version`）
- npm

### 初始化

```bash
npm install        # 安装依赖
npm run dev        # 监听模式 — 保存时自动重新编译
npm run build      # 生产构建（类型检查 + 打包）
npm run lint       # 运行 ESLint（含 Obsidian 专用规则）
```

### 项目结构

```
src/
  main.ts                    # 插件入口，生命周期管理，CSS 变量
  settings.ts                # 设置接口、默认值和设置页 UI
  editor/
    pagination-plugin.ts     # CodeMirror 6 ViewPlugin，编辑器分页
    page-break-widget.ts     # 页面之间渲染的 WidgetType
  reading/
    reading-pagination.ts    # 阅读模式分页管理器
  utils/
    page-layout.ts           # 页面几何尺寸计算
    page-sizes.ts            # 边距预设和单位转换
    text-metrics.ts          # 基于 DOM 的字符宽度/行高测量
styles.css                   # 所有视觉样式（页面、间隙、页码）
manifest.json                # Obsidian 插件清单
```

### 分页原理

插件采用**几何**分页策略：每个块的绝对像素偏移（从内容区起点算起）除以内容高度，得到其页码索引。当连续块之间的页码索引增加时，插入一个分页 widget。这避免了对整个文档的扫描——仅测量可见视口。

页面几何尺寸由以下公式驱动：

```
contentWidthPx  = charsPerLine × charWidthPx
contentHeightPx = linesPerPage × lineHeightPx
```

其中 `charWidthPx` 和 `lineHeightPx` 在运行时通过隐藏的 DOM 探针从实际编辑器字体测量得到。

## 发布新版本

- 更新 `manifest.json` 中的 `version`（语义化版本）。
- 更新 `versions.json`，添加 `"new-plugin-version": "minimum-obsidian-version"`。
- 使用与版本号完全一致的 tag 创建 GitHub Release（不加 `v` 前缀）。
- 上传 `manifest.json`、`main.js` 和 `styles.css` 作为 release 附件。
- 发布 release。

> 在 `manifest.json` 中更新 `minAppVersion` 后，运行 `npm version patch|minor|major`——它会自动更新 `manifest.json` 和 `package.json` 中的版本号，并向 `versions.json` 添加新版本条目。

## 将插件添加到社区插件列表

- 查看 [插件指南](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)。
- 发布初始版本。
- 在 [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) 提交 Pull Request 来添加你的插件。

## 许可证

参见 [LICENSE](LICENSE)。

## API 文档

参见 https://docs.obsidian.md
