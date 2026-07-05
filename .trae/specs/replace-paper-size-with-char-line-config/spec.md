# 基于字符数/行数的页面配置 Spec

## Why
当前页面尺寸基于物理纸张（A3/A4/Letter/Legal）和方向（portrait/landscape），用户无法直接控制每行字符数和每页行数——选 A4 后实际能显示多少字符取决于字体设置，用户需反复试错。改为基于字符数和行数的配置后，用户设定"每行 80 字符、每页 40 行"即可获得精确匹配的页面容量。

## What Changes
- **移除** `pageSize`、`orientation` 设置项及对应的下拉 UI
- **新增** `charsPerLine` 设置项（滑块 + 数值输入框，两方式同步），默认 80，范围 30–150
- **新增** `linesPerPage` 设置项（滑块 + 数值输入框，两方式同步），默认 40，范围 15–80
- **新建** `src/utils/text-metrics.ts` 模块：从 DOM 实测编辑器字体的平均字符宽度与行高，返回 `{ charWidthPx, lineHeightPx }`
- **重构** `getContentBox()` 签名：从 `(pageSize, orientation, marginPreset)` 改为 `(charsPerLine, linesPerPage, marginPreset, textMetrics)`
- **更新** 所有 `getContentBox()` 调用点（`main.ts`、`pagination-plugin.ts`、`reading-pagination.ts`）
- **保留** `marginPreset` 设置（Normal/Narrow/Wide）控制视觉页边距
- **新增** 监听 `app.workspace.on('css-change')` 事件，字体/外观变化时重新度量文本并重新分页
- **清理** `page-sizes.ts` 中不再使用的 `PAGE_SIZES_MM`、`PageSize`、`Orientation` 导出

## Impact
- Affected specs:
  - `improve-page-separation-word-style` — 分页算法依赖 `getContentBox()`，签名变化但算法不变
  - `polish-visual-and-adapt-reading-mode` — 同上
  - `add-reading-mode-real-pagination` — 同上
- Affected code:
  - `src/settings.ts` — 移除 pageSize/orientation 设置，新增 charsPerLine/linesPerPage 设置（滑块+数值输入）
  - `src/utils/page-sizes.ts` — 移除 PAGE_SIZES_MM/PageSize/Orientation；保留 MARGINS_MM/MarginPreset/MM_TO_PX
  - `src/utils/page-layout.ts` — 重构 getContentBox() 签名与实现
  - `src/utils/text-metrics.ts` — 新建模块
  - `src/editor/pagination-plugin.ts` — 更新 getContentBox() 调用
  - `src/reading/reading-pagination.ts` — 更新 getContentBox() 调用
  - `src/main.ts` — 更新 applyPagedCssVariables()，添加文本度量与 css-change 监听

## ADDED Requirements

### Requirement: 每行字符数设置
系统 SHALL 提供 `charsPerLine` 设置项，允许用户自定义每页内容区每行可显示的字符数量。

#### Scenario: 设置每行字符数
- **WHEN** 用户在设置中调整"每行字符数"
- **THEN** 设置项同时提供滑块（范围 30–150，步进 1）和数值输入框两种方式
- **AND** 滑块与数值输入框双向同步（调整任一方，另一方立即更新）
- **AND** 滑块拖动时显示当前值的动态 tooltip
- **AND** 数值输入框接受 30–150 范围内的整数，超出范围时 clamp 到边界
- **AND** 设置变化后立即保存并触发 `applyPagination()` 重新分页
- **AND** 内容区宽度按 `charsPerLine × charWidthPx` 计算

#### Scenario: 默认值
- **WHEN** 用户首次安装插件或重置设置
- **THEN** `charsPerLine` 默认值为 80

### Requirement: 每页行数设置
系统 SHALL 提供 `linesPerPage` 设置项，允许用户自定义每页可显示的行数。

#### Scenario: 设置每页行数
- **WHEN** 用户在设置中调整"每页行数"
- **THEN** 设置项同时提供滑块（范围 15–80，步进 1）和数值输入框两种方式
- **AND** 滑块与数值输入框双向同步
- **AND** 滑块拖动时显示当前值的动态 tooltip
- **AND** 数值输入框接受 15–80 范围内的整数，超出范围时 clamp 到边界
- **AND** 设置变化后立即保存并触发 `applyPagination()` 重新分页
- **AND** 内容区高度按 `linesPerPage × lineHeightPx` 计算

#### Scenario: 默认值
- **WHEN** 用户首次安装插件或重置设置
- **THEN** `linesPerPage` 默认值为 40

### Requirement: 文本度量
系统 SHALL 通过 DOM 实测获取编辑器字体的平均字符宽度与行高，使"每行字符数"和"每页行数"设置与实际渲染效果一致。

#### Scenario: 度量字符宽度
- **WHEN** 插件加载或字体/外观变化时
- **THEN** 创建隐藏的探测元素，应用编辑器的实际字体（从 `.cm-content` 或 body 的 computed style 读取 font-family 与 font-size）
- **AND** 在探测元素中渲染包含大小写字母与数字的样本字符串（至少 60 个字符）
- **AND** 测量样本总宽度并除以字符数，得到 `charWidthPx`
- **AND** 度量完成后移除探测元素

#### Scenario: 度量行高
- **WHEN** 插件加载或字体/外观变化时
- **THEN** 通过创建包含两行文本的隐藏元素，测量两行之间的垂直距离得到 `lineHeightPx`
- **OR** 从 `.cm-content` 的 computed style 读取 `lineHeight`（若为像素值则直接使用）
- **AND** 度量完成后移除探测元素

#### Scenario: 度量回退
- **WHEN** DOM 度量失败（如探测元素无法创建或返回 0）
- **THEN** 使用默认回退值：`charWidthPx = 8`、`lineHeightPx = 24`

#### Scenario: 字体变化时重新度量
- **WHEN** Obsidian 外观设置（字体大小/字体族/主题）变化
- **THEN** 监听 `app.workspace.on('css-change')` 事件
- **AND** 事件触发后重新调用 `measureTextMetrics()` 获取新的度量值
- **AND** 用新度量值重新计算页面几何并重新分页

### Requirement: 页面几何计算
系统 SHALL 基于字符数、行数、文本度量与页边距预设计算页面几何。

#### Scenario: 计算内容区尺寸
- **WHEN** 调用 `getContentBox(charsPerLine, linesPerPage, marginPreset, textMetrics)`
- **THEN** `contentWidthPx = charsPerLine × textMetrics.charWidthPx`
- **AND** `contentHeightPx = linesPerPage × textMetrics.lineHeightPx`
- **AND** 从 `MARGINS_MM[marginPreset]` 读取页边距（mm）并用 `MM_TO_PX` 转换为像素
- **AND** `pageWidthPx = contentWidthPx + marginLeftPx + marginRightPx`
- **AND** `pageHeightPx = contentHeightPx + marginTopPx + marginBottomPx`
- **AND** 返回完整的 `ContentBox`（含 pageWidthPx、pageHeightPx、四个 marginPx、contentWidthPx、contentHeightPx）

## MODIFIED Requirements

### Requirement: PagedEditorSettings 接口（原：含 pageSize、orientation）
原接口：
```typescript
interface PagedEditorSettings {
  enabled: boolean;
  pageSize: PageSize;        // 移除
  orientation: Orientation;  // 移除
  marginPreset: MarginPreset;
  pageNumberPosition: PageNumberPosition;
  pageNumberFormat: PageNumberFormat;
}
```

修改后：
```typescript
interface PagedEditorSettings {
  enabled: boolean;
  charsPerLine: number;      // 新增，默认 80
  linesPerPage: number;      // 新增，默认 40
  marginPreset: MarginPreset;
  pageNumberPosition: PageNumberPosition;
  pageNumberFormat: PageNumberFormat;
}
```

### Requirement: getContentBox 函数签名（原：基于纸张尺寸）
原签名：`getContentBox(pageSize, orientation, marginPreset)`

修改后：`getContentBox(charsPerLine, linesPerPage, marginPreset, textMetrics)`

实现逻辑变化：不再从 `PAGE_SIZES_MM` 查表，改为从字符数 × 字符宽度 + 行数 × 行高计算内容区尺寸，再加页边距得到页面尺寸。

### Requirement: 设置页 UI（原：Page size 下拉 + Orientation 下拉）
原 UI：Page size 下拉（A3/A4/Letter/Legal）+ Orientation 下拉（Portrait/Landscape）

修改后：
- 移除 Page size 下拉
- 移除 Orientation 下拉
- 新增"每行字符数"设置行：`.addSlider(...)` + `.addText(...)` 双向同步
- 新增"每页行数"设置行：`.addSlider(...)` + `.addText(...)` 双向同步
- 保留 Margin preset 下拉不变

## REMOVED Requirements

### Requirement: 纸张尺寸预设
**Reason**: 用户要求改为基于字符数/行数的配置，纸张尺寸预设（A3/A4/Letter/Legal）不再需要。
**Migration**: 
- 从 `PagedEditorSettings` 移除 `pageSize` 字段
- 从 `page-sizes.ts` 移除 `PAGE_SIZES_MM`、`PageSize` 类型
- 从设置页移除 Page size 下拉
- 已保存的 `pageSize` 值在加载时被忽略（`loadData` 的 `Object.assign` 会保留多余字段但不影响功能）

### Requirement: 页面方向
**Reason**: 字符数/行数配置下，"方向"概念无意义——页面尺寸直接由内容尺寸 + 页边距决定，无 portrait/landscape 之分。
**Migration**:
- 从 `PagedEditorSettings` 移除 `orientation` 字段
- 从 `page-sizes.ts` 移除 `Orientation` 类型
- 从设置页移除 Orientation 下拉
- 已保存的 `orientation` 值在加载时被忽略
