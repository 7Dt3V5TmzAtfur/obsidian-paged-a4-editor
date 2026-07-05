# 修复中间页面缺少上下边距 Spec

## Why
page-break widget 的高度仅为 `--paged-gap`（40px），不包含页边距。`.cm-content` / `.markdown-preview-sizer` 的 `padding`（上下边距）只在整个内容流的开头和结尾应用一次，导致中间页面没有任何可见的上下边距——内容直接紧贴灰色 gap。用户设定 margin preset（如 normal = 96px）但中间页面看不到这个边距值。

## What Changes
- **增高 page-break widget**：高度从 `var(--paged-gap)` 改为 `calc(var(--paged-margin-bottom) + var(--paged-gap) + var(--paged-margin-top))`，使每个 widget 包含上一页的下边距 + 灰色间隔 + 下一页的上边距
- **三段式背景**：widget 背景从纯灰色改为白-灰-白三段渐变（上段白 = 上一页下边距，中段灰 = 页面间隔，下段白 = 下一页上边距），视觉上每页都有完整的上下边距
- **页码位置调整**：页码从 `bottom: 0` 改为 `bottom: var(--paged-margin-top)`，保持在灰色 gap 区域底部
- **更新分页算法的高度计算**：`pagination-plugin.ts` 和 `reading-pagination.ts` 中 `naturalHeight` / `naturalContentHeight` 的减项从 `GAP_PX` 改为实际 widget 高度（`marginTopPx + GAP_PX + marginBottomPx`），保持总页数稳定

## Impact
- Affected specs:
  - `improve-page-separation-word-style` — widget 视觉变化（高度增大、背景从纯灰变三段渐变）
  - `polish-visual-and-adapt-reading-mode` — 同上
  - `add-reading-mode-real-pagination` — `GAP_PX` 减项需更新
  - `replace-paper-size-with-char-line-config` — 无直接影响
- Affected code:
  - `styles.css` — widget 高度、背景渐变、页码位置
  - `src/editor/pagination-plugin.ts` — `naturalHeight` 计算的减项
  - `src/reading/reading-pagination.ts` — `naturalContentHeight` 计算的减项

## MODIFIED Requirements

### Requirement: page-break widget 视觉表现（原：纯灰色 gap，高度 40px）
原实现：
- `height: var(--paged-gap)`（40px）
- `background: var(--background-secondary)`（纯灰）
- 页码 `bottom: 0`

修改后：
- `height: calc(var(--paged-margin-bottom) + var(--paged-gap) + var(--paged-margin-top))`
- 背景为三段线性渐变：白（marginBottomPx）→ 灰（gap）→ 白（marginTopPx），用硬色阶过渡
- 页码 `bottom: var(--paged-margin-top)`（位于灰色 gap 区域底部）
- widget 仍通过负 margin 扩展到整页宽度

#### Scenario: 中间页面边距可见
- **WHEN** 文档内容超过一页
- **THEN** 每个 page-break widget 显示为三段：上段白色（上一页下边距）、中段灰色（页面间隔）、下段白色（下一页上边距）
- **AND** 上段白色高度 = `--paged-margin-bottom`
- **AND** 中段灰色高度 = `--paged-gap`（40px）
- **AND** 下段白色高度 = `--paged-margin-top`
- **AND** 页码显示在灰色 gap 区域底部

### Requirement: naturalHeight 计算（原：减去 prevWidgetCount × GAP_PX）
原实现：
- 编辑模式：`view.contentHeight - this.prevWidgetCount * GAP_PX`
- 阅读模式：`measuredScrollHeight - paddingTop - paddingBottom - previousBreakCount * GAP_PX`

修改后：
- 编辑模式：`view.contentHeight - this.prevWidgetCount * (marginTopPx + GAP_PX + marginBottomPx)`
- 阅读模式：`measuredScrollHeight - paddingTop - paddingBottom - previousBreakCount * (marginTopPx + GAP_PX + marginBottomPx)`
- 其中 `marginTopPx` 和 `marginBottomPx` 从 `getContentBox()` 返回值获取

## REMOVED Requirements
无
