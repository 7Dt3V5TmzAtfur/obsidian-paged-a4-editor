# 阅读模式真实分页 Spec

## Why
上一轮 spec（`polish-visual-and-adapt-reading-mode`）只为阅读模式添加了 CSS 伪分页线（背景渐变），明确写了"真正的阅读模式分页超出本次范围"。当前阅读模式存在四个问题：
1. **没有页码**：阅读模式下没有任何页码徽标
2. **没有真实分页**：只有 CSS 背景画的灰色横线，内容会跨越横线，没有真正的页面分隔
3. **没有页边距**：`.markdown-preview-view` 的 padding 没有真正生效为可见的页边距（白底未铺到页面边缘，或被 `.markdown-preview-sizer` 的默认 max-width 覆盖）
4. **与编辑模式不一致**：编辑模式有真实分页 + 页码 + 页边距 + 灰色 gap，阅读模式都没有

## What Changes
- **新增 JS 模块** `src/reading/reading-pagination.ts`：基于 DOM 测量为阅读模式插入真实分页元素（灰色 gap + 页码徽标），算法与编辑模式的 `pagination-plugin.ts` 一致
- **DOM 结构调整**：将"纸张"样式从 `.markdown-preview-view` 下移到 `.markdown-preview-sizer`（实际内容容器），覆盖 Obsidian 默认的 max-width
- **注册生命周期**：在 `main.ts` 中注册阅读模式分页，监听 workspace 布局变化、内容变化（MutationObserver）、设置变化、窗口 resize
- **复用 CSS 类**：阅读模式的分页元素复用编辑模式的 `.paged-editor-page-break` / `.paged-editor-page-number` 类，视觉风格一致
- **移除上一轮的 CSS 伪分页线**：删除 `.markdown-preview-view` 上的 `background-image` 重复渐变（被真实分页元素取代）
- **清理逻辑**：禁用 paged 模式或卸载插件时，移除所有已插入的分页元素

## Impact
- Affected specs:
  - `polish-visual-and-adapt-reading-mode`（移除其 CSS 伪分页线，由真实分页取代）
- Affected code:
  - `src/reading/reading-pagination.ts` — 新建模块，核心分页逻辑
  - `src/main.ts` — 注册阅读模式分页，在 `applyPagination()` 中触发重新分页
  - `styles.css` — 调整阅读模式选择器（从 `.markdown-preview-view` 改为 `.markdown-preview-sizer`），移除伪分页线背景，确保页边距生效

## ADDED Requirements

### Requirement: 阅读模式真实分页
系统 SHALL 在阅读模式下通过 JS DOM 测量插入真实分页元素，使内容被灰色 gap 真正分隔为多页，而非仅用背景线提示。

#### Scenario: 多页文档在阅读模式
- **WHEN** 用户启用 paged 模式，切换到阅读模式，文档内容超过一页
- **THEN** `.markdown-preview-sizer` 的子元素之间插入 `<div class="paged-editor-page-break">` 分页元素
- **AND** 分页元素高度为 `--paged-gap`，背景为 `var(--background-secondary)`
- **AND** 分页元素通过负 margin 扩展到整页宽度（覆盖左右页边距）
- **AND** 后续内容被推到下一页，不会跨越分页元素
- **AND** 单个块（如长代码块、表格）若高于一页，允许其跨越分页（与编辑模式一致）

#### Scenario: 单页文档在阅读模式
- **WHEN** 文档内容少于一页
- **THEN** 不插入分页元素
- **AND** 内容显示在居中的白色纸张上

### Requirement: 阅读模式页码徽标
系统 SHALL 在阅读模式的每个分页元素中渲染页码徽标，与编辑模式视觉一致。

#### Scenario: 页码显示
- **WHEN** 在阅读模式渲染分页元素
- **THEN** 分页元素内包含 `<span class="paged-editor-page-number">` 子元素
- **AND** 页码文本格式遵循 `pageNumberFormat` 设置（number / page-x-of-y / chinese）
- **AND** 页码水平位置遵循 `pageNumberPosition` 设置（bottom-left / bottom-center / bottom-right）
- **AND** 末页底部也显示页码（通过在内容末尾追加一个分页元素实现，与编辑模式一致）

### Requirement: 阅读模式页边距
系统 SHALL 在阅读模式中显示可见的页边距（白色 padding 区域）。

#### Scenario: 页边距可见
- **WHEN** 启用 paged 模式并切换到阅读模式
- **THEN** `.markdown-preview-sizer` 应用 `padding: var(--paged-margin-*)` 作为页边距
- **AND** padding 区域显示为白色（纸张背景色）
- **AND** `.markdown-preview-sizer` 的 max-width 被覆盖为 `var(--paged-page-width)`（覆盖 Obsidian 默认的 readable line length）
- **AND** 内容被限制在 padding 之内（不延伸到页面边缘）

### Requirement: 阅读模式重新分页触发
系统 SHALL 在以下事件触发阅读模式的重新分页（debounced）：

#### Scenario: 内容变化
- **WHEN** `.markdown-preview-sizer` 的子元素变化（MutationObserver 检测 childList 变化）
- **THEN** 在 200ms debounce 后重新分页

#### Scenario: 设置变化
- **WHEN** 用户更改 page size / orientation / margin preset / page number 设置
- **THEN** 所有可见阅读视图立即重新分页

#### Scenario: 窗口 resize
- **WHEN** 窗口尺寸变化
- **THEN** 在 200ms debounce 后重新分页

#### Scenario: 切换标签页 / 打开新文件
- **WHEN** 用户切换到另一个标签页或打开新文件进入阅读模式
- **THEN** 新可见的阅读视图被分页

### Requirement: 阅读模式分页清理
系统 SHALL 在禁用 paged 模式或卸载插件时，移除所有已插入的分页元素。

#### Scenario: 禁用 paged 模式
- **WHEN** 用户禁用 paged 模式
- **THEN** 所有阅读视图中的 `.paged-editor-page-break` 元素被移除
- **AND** 阅读视图恢复 Obsidian 默认样式

#### Scenario: 卸载插件
- **WHEN** 插件被卸载
- **THEN** 所有 MutationObserver 被断开
- **AND** 所有已插入的分页元素被移除

## MODIFIED Requirements

### Requirement: 阅读模式页面视觉（原：CSS-only，针对 `.markdown-preview-view`）
原实现（`polish-visual-and-adapt-reading-mode` spec）：
- `.markdown-preview-view` 应用 max-width、padding、白色背景、box-shadow、伪分页线背景

修改后：
- "纸张"样式从 `.markdown-preview-view` 移到 `.markdown-preview-sizer`（实际内容容器）
- `.markdown-preview-view` 仅作为滚动容器，应用灰色桌面背景
- `.markdown-preview-sizer` 应用 max-width（覆盖 Obsidian 默认）、padding（页边距）、白色背景、box-shadow
- 移除 `.markdown-preview-view` 上的 `background-image` 伪分页线（由真实分页元素取代）

## REMOVED Requirements

### Requirement: 阅读模式伪分页视觉提示
**Reason**: 被"阅读模式真实分页"需求取代——真实分页元素提供更强的视觉分隔（内容不会跨越），伪分页线不再需要。
**Migration**: 删除 `.markdown-preview-view` 上的 `background-image` / `background-size` / `background-repeat` 属性。
