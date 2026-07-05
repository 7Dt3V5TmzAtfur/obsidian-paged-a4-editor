# 视觉打磨 + 阅读模式适配 Spec

## Why
当前实现存在两个问题：
1. **丑**：`PageBreakWidget` 的双向 `box-shadow`（`0 -8px 12px -4px rgba(0,0,0,0.10)` 和 `0 8px 12px -4px rgba(0,0,0,0.10)`）在每个灰色 gap 上下各生成一条阴影线，叠加 gap 本身形成"阴影+灰条+阴影"的视觉噪声；且 widget 通过负 margin 扩展到整页宽度后，box-shadow 也随之延伸到页面左右边缘外，产生侧边阴影伪影。整体观感不像 Word 的"纸面"而像"灰条+双线"。
2. **阅读模式未适配**：所有 CSS 规则只针对 `.markdown-source-view.mod-cm6`（CM6 源码编辑视图），完全未覆盖 `.markdown-reading-view` / `.markdown-preview-view`。用户切到阅读模式时分页样式全部失效。

## What Changes
- **简化 widget 视觉**：移除双向 `box-shadow`，让 gap 区域只显示干净的灰色桌面色，靠"白页 vs 灰底"的对比表达页面分隔（更接近 Word）
- **强化页面外边界阴影**：把 `.cm-content` 的 box-shadow 调整为更明显的"纸张投影"效果（更大的模糊半径、合适的不透明度），让整条白色内容流看起来像放在桌面上的纸
- **页码徽标微调**：调整为更克制的样式（更小字号 / 更淡颜色），避免在 gap 中过于显眼
- **新增阅读模式样式**：为 `.markdown-reading-view` / `.markdown-preview-view` / `.markdown-preview-sizer` 添加与源码模式一致的页面宽度约束、白色背景、外边界阴影、居中布局
- **阅读模式的"伪分页"视觉提示**：通过 CSS 重复背景在阅读模式中按 `--paged-page-height` 周期绘制灰色 gap 横线，作为页面边界的视觉提示（不真正打断内容，仅作占位提示；真正的阅读模式分页超出本次范围）

## Impact
- Affected specs:
  - `improve-page-separation-word-style`（上一个 spec 的视觉方案，本次将微调其 widget 阴影策略）
- Affected code:
  - `styles.css` — 主要改动：widget 阴影、`.cm-content` 阴影、阅读模式新增规则
  - 无 TS 代码改动（纯 CSS）
  - `src/main.ts` — 无需改动（CSS 变量已通过 body class + inline style 注入，阅读模式自动继承）

## ADDED Requirements

### Requirement: 阅读模式页面视觉
系统 SHALL 在阅读模式（`.markdown-reading-view`）下应用与源码模式一致的 Word 风格页面视觉：白色纸张、灰色桌面、外边界阴影、居中、页面宽度约束。

#### Scenario: 阅读模式启用 paged 模式
- **WHEN** 用户启用 paged 模式并切换到阅读模式
- **THEN** `.markdown-reading-view` 内的渲染内容显示在居中的白色"纸张"上
- **AND** 纸张宽度为 `--paged-page-width`
- **AND** 纸张左右留有页边距（`--paged-margin-left/right` 作为 padding）
- **AND** 纸张四周有柔和的外边界阴影
- **AND** 纸张之外的区域显示为灰色桌面背景（`--background-secondary`）

#### Scenario: 阅读模式伪分页视觉提示
- **WHEN** 阅读模式下内容超过一页高度
- **THEN** 每隔 `--paged-page-height` 的位置出现一条横向灰色分隔线（作为页面边界的视觉提示）
- **AND** 分隔线宽度覆盖整页（包括 padding 区域）
- **AND** 分隔线不真正打断内容流（内容可以跨越分隔线，仅作视觉占位）
- **AND** 分隔线颜色与桌面背景一致（`--background-secondary`），透明度让用户能识别但不喧宾夺主

### Requirement: 页码徽标克制化
系统 SHALL 让页码徽标在 gap 中保持克制，不抢夺视觉焦点。

#### Scenario: 页码徽标显示
- **WHEN** 渲染 page-break widget
- **THEN** 页码徽标字号不大于 0.7em
- **AND** 颜色为 `--text-faint` 或更淡
- **AND** 徽标不带有背景色 / 边框（保持纯文字）

## MODIFIED Requirements

### Requirement: PageBreakWidget 视觉表现（原：灰色全宽 gap + 双向 box-shadow）
原实现：
- `background: var(--background-secondary)`
- `margin-left/right: calc(-1 * var(--paged-margin-*))` 扩展到整页宽度
- `box-shadow: 0 -8px 12px -4px rgba(0,0,0,0.10), 0 8px 12px -4px rgba(0,0,0,0.10)`（双向阴影）

修改后：
- 保留 `background: var(--background-secondary)` 与负 margin 全宽扩展
- **移除 box-shadow**（消除双线视觉噪声与侧边伪影）
- 页面分隔的视觉由"白页 vs 灰 gap"的对比表达，而非阴影线
- 保留 `height: var(--paged-gap)`、`position: relative` 不变

### Requirement: `.cm-content` 外边界阴影（原：`0 0 0 1px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.08)`）
原实现：阴影过弱，纸张感不明显。

修改后：
- 增强阴影：使用更大的模糊半径与更合适的不透明度，让白色"纸张"在灰色桌面上有明显的悬浮感
- 推荐值：`0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.12)`（具体数值可在实施时微调）
- 保留 `background: var(--background-primary)` 不变

## REMOVED Requirements
无（本变更不删除任何功能）
