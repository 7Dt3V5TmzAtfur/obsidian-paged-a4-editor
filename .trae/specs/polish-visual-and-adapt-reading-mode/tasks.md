# Tasks

- [x] Task 1: 简化 `PageBreakWidget` 视觉，移除双向 box-shadow
  - [x] SubTask 1.1: 在 `styles.css` 中删除 `.paged-editor-page-break` 的 `box-shadow` 属性
  - [x] SubTask 1.2: 保留 `background: var(--background-secondary)`、负 margin 全宽扩展、`height: var(--paged-gap)`、`position: relative` 不变
  - [x] SubTask 1.3: 验证移除阴影后 gap 仍清晰可辨（靠白 vs 灰对比）

- [x] Task 2: 强化 `.cm-content` 外边界阴影
  - [x] SubTask 2.1: 将 `.cm-content` 的 `box-shadow` 从 `0 0 0 1px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.08)` 调整为 `0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.12)`
  - [x] SubTask 2.2: 验证阴影在浅色 / 深色主题下都可见（使用 `rgba` 而非固定颜色）

- [x] Task 3: 页码徽标克制化
  - [x] SubTask 3.1: 将 `.paged-editor-page-number` 的 `font-size` 从 `0.75em` 调整为 `0.7em`
  - [x] SubTask 3.2: 将 `color` 从 `--text-muted` 调整为 `--text-faint`
  - [x] SubTask 3.3: 验证三个 `data-position` 下徽标位置不变

- [x] Task 4: 新增阅读模式页面视觉样式
  - [x] SubTask 4.1: 在 `styles.css` 中新增 `.paged-editor-enabled .markdown-reading-view .markdown-preview-view` 规则，应用 `max-width: var(--paged-page-width)`、`margin: 0 auto`、`background: var(--background-primary)`、`padding: var(--paged-margin-*)`、`box-sizing: border-box`
  - [x] SubTask 4.2: 为阅读模式的外层容器（`.markdown-reading-view`）应用灰色桌面背景
  - [x] SubTask 4.3: 应用与 `.cm-content` 一致的外边界 box-shadow 到阅读模式
  - [x] SubTask 4.4: 验证阅读模式下白色纸张居中、四周灰色桌面、阴影可见

- [x] Task 5: 阅读模式伪分页视觉提示
  - [x] SubTask 5.1: 为阅读模式的内容容器添加 CSS 重复背景，按 `--paged-page-height` 周期绘制横向灰色分隔线
  - [x] SubTask 5.2: 分隔线应覆盖整页宽度（包括 padding 区域），颜色为 `--background-secondary`，高度约 `var(--paged-gap)`
  - [x] SubTask 5.3: 验证分隔线不影响内容流（`background-image` 不占空间）
  - [x] SubTask 5.4: 验证首屏（第一页顶部）不显示分隔线（背景定位起始为 `var(--paged-page-height) - var(--paged-gap)`）

- [x] Task 6: 构建与验证
  - [x] SubTask 6.1: 运行 `npm run build` 确保编译通过 ✓
  - [x] SubTask 6.2: 运行 `npm run lint` 确保无错误（仅有一个与本次改动无关的预存 warning）✓
  - [ ] SubTask 6.3: 在 Obsidian 中肉眼确认：源码模式下 widget 无双线阴影、纸张悬浮感增强；阅读模式下页面居中、伪分页线可见（需用户手动验证）

# Task Dependencies
- Task 1、2、3 互相独立，已由单一子代理顺序实施
- Task 4、5 都针对阅读模式，Task 5 在 Task 4 完成后实施
- Task 6 依赖 Task 1-5 全部完成
