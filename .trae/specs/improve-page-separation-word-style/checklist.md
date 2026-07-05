# Checklist

- [x] `--paged-gap` 在 `styles.css` 中已从 24px 改为 40px
- [x] `GAP_PX` 常量在 `src/editor/pagination-plugin.ts` 中已同步为 40
- [x] `.cm-content` 保留白色 `background`（提供页面白底）+ box-shadow（外边界阴影：第 1 页顶边、最后一页底边、所有页左右边）
- [x] 页面间的视觉分隔由 `PageBreakWidget` 的灰色背景与 box-shadow 提供（替代 spec 原案的重复背景方案，避免 widget 位置与 `--paged-page-height` 周期不一致导致的阴影错位）
- [x] 每页顶部和底部边缘有柔和阴影（widget 的双向 box-shadow `0 ±8px 12px -4px rgba(0,0,0,0.10)`）
- [x] `PageBreakWidget` 的 `background` 为灰色桌面色（`var(--background-secondary)`），不再是 `transparent`
- [x] widget 通过负 margin 扩展到整页宽度（覆盖左右页边距）
- [x] gap 顶部和底部有阴影（widget box-shadow 双向投射）
- [x] 页码徽标在灰色 gap 背景上仍清晰可读（`--text-muted` 颜色保留）
- [x] 三个 `data-position`（bottom-left / bottom-center / bottom-right）下徽标位置正确（用 `var(--paged-margin-left/right)` 重新对齐到内容区域）
- [x] A4 / Letter / Legal 三种页面尺寸下视觉正常（CSS 变量驱动，几何计算未变）
- [x] portrait / landscape 两种方向下视觉正常（同上）
- [x] narrow / normal / wide 三种边距预设下 widget 不溢出、视觉正常（负 margin 仍对齐页面边缘）
- [x] 禁用 paged 模式后样式完全恢复（所有规则 scoped 到 `.paged-editor-enabled` body class）
- [x] `npm run build` 通过、无 TS 报错
- [x] `npm run lint` 无错误（仅有一个与本次改动无关的预存 warning）
- [ ] 在 Obsidian 中肉眼确认：多页文档的页面分隔清晰，模仿 Word 风格（需用户手动验证）
