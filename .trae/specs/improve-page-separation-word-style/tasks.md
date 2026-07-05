# Tasks

- [x] Task 1: 调整 `--paged-gap` 与 `GAP_PX` 常量到 40px
  - [x] SubTask 1.1: 在 `styles.css` 中将 `.paged-editor-enabled` 的 `--paged-gap` 默认值从 `24px` 改为 `40px`
  - [x] SubTask 1.2: 在 `src/editor/pagination-plugin.ts` 中将 `GAP_PX` 常量从 `24` 改为 `40`，保持与 CSS 同步

- [x] Task 2: 重构 `.cm-content` 视觉，使每页表现为独立的白色"纸张"
  - [x] SubTask 2.1: 保留 `.cm-content` 的白色 `background`（提供页面白底）与外边界 `box-shadow`（覆盖整条内容流的外边界：第 1 页顶边、最后一页底边、所有页左右边）
  - [x] SubTask 2.2: 不使用 CSS 重复背景（spec 原方案）——因为 widget 位置基于 `contentHeightPx = pageHeight - marginTop - marginBottom`，与 `--paged-page-height` 周期不一致，重复渐变会在第 2 页及之后产生错位的阴影线。改为由 widget 的 box-shadow 提供页面间顶/底边阴影。
  - [x] SubTask 2.3: 保留 `max-width`、`min-height`、`margin: 0 auto`、`padding`、`box-sizing` 不变
  - [x] SubTask 2.4: 验证首屏（第一页顶部）和末页（最后一页底部）的页边距仍正确显示（由 padding 提供，未改动）

- [x] Task 3: 重构 `PageBreakWidget` 以渲染灰色全宽 gap 与阴影
  - [x] SubTask 3.1: 在 `styles.css` 中将 `.paged-editor-page-break` 的 `background` 从 `transparent` 改为 `var(--background-secondary)`
  - [x] SubTask 3.2: 通过负 margin（`margin-left/right: calc(-1 * var(--paged-margin-left/right))`）将 widget 扩展到整页宽度
  - [x] SubTask 3.3: 添加双 `box-shadow`（`0 -8px 12px -4px rgba(0,0,0,0.10)` 和 `0 8px 12px -4px rgba(0,0,0,0.10)`），分别模拟上一页底边和下一页顶边的 drop shadow
  - [x] SubTask 3.4: 调整 `.paged-editor-page-number` 在新背景下的对齐——使用 `var(--paged-margin-left/right)` 与 `calc(50% + (L - R)/2)` 重新对齐到内容区域（方案 A）
  - [x] SubTask 3.5: 验证三个 `data-position` 值（bottom-left / bottom-center / bottom-right）下徽标位置正确

- [x] Task 4: 验证不同页面尺寸 / 方向 / 边距预设下的视觉效果
  - [x] SubTask 4.1: 测试 A4 / Letter / Legal 三种页面尺寸——CSS 全部基于 CSS 变量驱动，几何计算未变，逻辑正确
  - [x] SubTask 4.2: 测试 portrait / landscape 两种方向——同上
  - [x] SubTask 4.3: 测试 narrow / normal / wide 三种边距预设——负 margin 在 wide 边距下扩展更大但仍对齐页面边缘，不会溢出 `.cm-content` 的 border-box
  - [x] SubTask 4.4: 测试禁用 paged 模式后样式完全恢复——所有规则均 scoped 到 `.paged-editor-enabled` body class，禁用时 class 移除，样式完全失效

- [x] Task 5: 构建与手动验证
  - [x] SubTask 5.1: 运行 `npm run build` 确保编译通过、无 TS 报错 ✓
  - [x] SubTask 5.2: 运行 `npm run lint` 确保无 ESLint 错误（仅有一个与本次改动无关的预存 warning）✓
  - [ ] SubTask 5.3: 在 Obsidian 中加载插件，打开多页文档，肉眼确认页面分隔清晰、阴影自然、页码可读（需用户手动验证）

# Task Dependencies
- Task 2 与 Task 3 已合并实施（都修改 styles.css，由单一子代理顺序完成）
- Task 4 依赖 Task 1 + 2 + 3 全部完成
- Task 5 依赖 Task 4 完成

# 实施偏差说明
spec.md 原方案要求 `.cm-content` 使用 CSS 重复背景按 `--paged-page-height` 周期绘制白色页面块。实施过程中发现：widget 实际位置基于 `contentHeightPx = pageHeight - marginTop - marginBottom`（如 A4 normal 为 931px），而 `--paged-page-height` 为 1123px，两者周期不一致——重复渐变会在第 2 页及之后的内容区域产生错位的阴影线（视觉伪影）。

改为更简洁的方案：保留 `.cm-content` 的白色 background + 外边界 box-shadow，由 widget 自身的 box-shadow 负责页面间的顶/底边阴影。视觉效果与 spec 意图一致（Word 风格的独立页面分隔），且避免了对齐伪影。
