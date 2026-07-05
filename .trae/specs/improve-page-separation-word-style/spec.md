# 改进 A4 页面分隔（Word 风格）Spec

## Why
当前 A4 分页布局将整个 `.cm-content` 渲染为一整张连续的白色"纸张"，页面之间的分隔仅靠 `PageBreakWidget`（高度 24px、`background: transparent`）插入。由于 widget 背景透明，gap 区域实际显示的是 `.cm-content` 的白色背景，而非灰色桌面背景——因此页面之间几乎没有视觉分隔，看起来像一张长纸，而非 Word "打印布局" 视图中的多张独立页面。用户难以分辨一页结束、下一页开始的位置。

## What Changes
- **让页面之间的 gap 显示为灰色桌面背景**（而非白色），使每页看起来像独立的纸张
- **将 gap 扩展到整页宽度**（覆盖左右页边距区域，而非仅内容区域），模仿 Word 的页面分隔效果
- **增大 `--paged-gap`**：从 24px 提升到约 40px，使分隔更明显
- **为每页底边和顶边添加柔和阴影**，暗示每页是独立的物理纸张
- **页码徽标渲染在灰色 gap 区域中**，确保可见且与灰色背景对比清晰
- **保持向后兼容**：现有设置（page size / orientation / margin / page number position / format）行为不变

## Impact
- Affected specs: 无（首个 spec）
- Affected code:
  - `styles.css` — 主要视觉改动（背景、阴影、gap 宽度、widget 全宽渲染）
  - `src/main.ts` — 可能新增 CSS 变量（如 `--paged-desktop-bg`）以便统一引用桌面背景色
  - `src/editor/page-break-widget.ts` — 可能调整 widget DOM 结构以支持全宽 gap 与阴影（如增加内部子元素 / 数据属性）
  - `src/editor/pagination-plugin.ts` — `GAP_PX` 常量需与新的 `--paged-gap` 同步（24 → 40）

## ADDED Requirements

### Requirement: Word 风格的页面分隔
系统 SHALL 在每两个相邻页面之间渲染一段可见的灰色"桌面" gap，模仿 Microsoft Word "打印布局" 视图中页面之间的分隔效果。

#### Scenario: 多页文档
- **WHEN** 文档内容超过一页
- **THEN** 相邻页面之间显示一段灰色 gap（背景色为 `--background-secondary` 或更深的桌面色）
- **AND** gap 的高度约为 40px（明显大于段落间距，足以让人识别为页面分隔）
- **AND** gap 的宽度覆盖整页（从页面左边缘延伸到右边缘，包括左右页边距区域，而非仅内容区）
- **AND** gap 区域中不会显示任何白色背景

#### Scenario: 单页文档
- **WHEN** 文档内容少于一页
- **THEN** 仅显示一张白色页面
- **AND** 页面四周被灰色桌面背景包围

### Requirement: 页面边缘阴影
系统 SHALL 在每个页面的底边和顶边渲染柔和的阴影，使每页看起来像独立的物理纸张，而非连续的长纸。

#### Scenario: 页面边界
- **WHEN** 在两页之间渲染 page break
- **THEN** 上一页的底边显示柔和的 drop shadow（向下扩散）
- **AND** 下一页的顶边显示柔和的 drop shadow（向下投射，模拟纸张抬起）
- **AND** 阴影颜色为半透明黑（如 `rgba(0,0,0,0.08)` ~ `rgba(0,0,0,0.15)`）
- **AND** 阴影模糊半径适中（4-12px），不过分突兀

### Requirement: 页码徽标在灰色 gap 中渲染
系统 SHALL 将页码徽标渲染在灰色 gap 区域内（而非白色页面上），保持可见性。

#### Scenario: 页码显示
- **WHEN** 渲染 page-break widget
- **THEN** 页码徽标位于灰色 gap 区域的底部（紧邻下一页顶部）
- **AND** 徽标颜色（`--text-muted`）在灰色背景上仍可读
- **AND** 徽标水平位置遵循 `pageNumberPosition` 设置（bottom-left / bottom-center / bottom-right）
- **AND** 徽标不会被阴影遮挡

## MODIFIED Requirements

### Requirement: 页面渲染（原 `.cm-content` 单一白色矩形）
原实现：`.cm-content` 为整张白色矩形，padding 提供页边距，box-shadow 提供页面边缘阴影。所有页面共享同一白色背景。

修改后：`.cm-content` 仍承担内容容器的角色，但视觉上每页应表现为独立的白色"纸张"。
- `.cm-content` 的连续白色背景应被替换为按页重复的白色块（通过 CSS 重复背景实现）
- 每页底部和顶部边缘应有独立阴影
- 页边距仍由 padding 提供，行为不变
- `max-width`、`min-height`、`margin: 0 auto` 保持不变

### Requirement: PageBreakWidget 视觉表现
原实现：`height: var(--paged-gap)`、`background: transparent`、`position: relative`，仅承载页码徽标。

修改后：
- 高度提升至约 40px（与 `--paged-gap` 同步）
- 背景显示为灰色桌面色（`--background-secondary` 或专用 `--paged-desktop-bg`）
- 通过负 margin 或绝对定位扩展到整页宽度（覆盖左右页边距）
- 内部可包含两个伪元素或子元素，分别渲染上一页底边阴影和下一页顶边阴影
- 页码徽标仍位于底部，水平位置由 `data-position` 属性控制

## REMOVED Requirements
无（本变更不删除任何现有功能，仅为视觉增强）
