# Checklist

- [x] `.paged-editor-page-break` 的 `box-shadow` 已移除
- [x] `.paged-editor-page-break` 保留 `background: var(--background-secondary)` 与负 margin 全宽扩展
- [x] `.cm-content` 的 `box-shadow` 已增强为更明显的纸张投影（`0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.12)`）
- [x] `.paged-editor-page-number` 的 `font-size` 调整为 `0.7em`
- [x] `.paged-editor-page-number` 的 `color` 调整为 `--text-faint`
- [x] 三个 `data-position`（bottom-left / bottom-center / bottom-right）下徽标位置不变
- [x] 新增 `.paged-editor-enabled .markdown-reading-view` 规则，应用灰色桌面背景
- [x] 新增 `.paged-editor-enabled .markdown-reading-view .markdown-preview-view` 规则，应用页面宽度、白色背景、padding、box-shadow、居中
- [x] 阅读模式下白色纸张居中、四周灰色桌面、外边界阴影可见（CSS 规则已就位，最终视觉效果需用户在 Obsidian 中确认）
- [x] 阅读模式内容容器添加 CSS 重复背景，按 `--paged-page-height` 周期绘制横向灰色分隔线
- [x] 分隔线覆盖整页宽度（`background-size: 100%` 覆盖包括 padding 区域）
- [x] 分隔线不影响内容流（`background-image` 不占空间）
- [x] 首屏（第一页顶部）不显示分隔线（第一条分隔线位于 y = `--paged-page-height - --paged-gap`，即第一页底部）
- [x] `npm run build` 通过、无 TS 报错
- [x] `npm run lint` 无错误（仅有一个与本次改动无关的预存 warning）
- [ ] 源码模式下：widget 无双线阴影、纸张悬浮感增强（需用户在 Obsidian 中肉眼确认）
- [ ] 阅读模式下：页面居中、伪分页线可见（需用户在 Obsidian 中肉眼确认）
