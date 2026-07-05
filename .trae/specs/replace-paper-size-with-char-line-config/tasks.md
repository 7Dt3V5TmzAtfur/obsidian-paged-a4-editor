# Tasks

- [x] Task1: 新建 `src/utils/text-metrics.ts` 文本度量模块
  - [x] SubTask1.1: 创建 `src/utils/text-metrics.ts`，导出 `TextMetrics` 接口（`{ charWidthPx: number; lineHeightPx: number }`）与 `DEFAULT_TEXT_METRICS` 常量（`{ charWidthPx: 8, lineHeightPx: 24 }`）
  - [x] SubTask1.2: 实现 `measureTextMetrics(): TextMetrics` 函数——创建隐藏 `<span>` 探测元素，从 `.cm-content` 或 `document.body` 的 computed style 读取 font-family 与 font-size，渲染 62 字符样本（大小写字母+数字），测量宽度/62 得到 `charWidthPx`
  - [x] SubTask1.3: 在同一函数中测量行高——创建两行文本的隐藏 `<div>`，测量总高度/2 得到 `lineHeightPx`；或从 `.cm-content` 的 computed `lineHeight` 读取（若为像素值）
  - [x] SubTask1.4: 度量完成后移除探测元素；度量失败（返回 0 或 NaN）时回退到 `DEFAULT_TEXT_METRICS`

- [x] Task2: 重构 `src/utils/page-layout.ts` 的 `getContentBox()`
  - [x] SubTask2.1: 修改 `getContentBox()` 签名为 `(charsPerLine: number, linesPerPage: number, marginPreset: MarginPreset, textMetrics: TextMetrics)`
  - [x] SubTask2.2: 移除对 `PAGE_SIZES_MM`、`PageSize`、`Orientation` 的导入
  - [x] SubTask2.3: 新增导入 `TextMetrics` from `./text-metrics`
  - [x] SubTask2.4: 实现新逻辑：`contentWidthPx = charsPerLine × textMetrics.charWidthPx`，`contentHeightPx = linesPerPage × textMetrics.lineHeightPx`，`pageWidthPx = contentWidthPx + marginLeftPx + marginRightPx`，`pageHeightPx = contentHeightPx + marginTopPx + marginBottomPx`
  - [x] SubTask2.5: 保留 `MARGINS_MM`、`MM_TO_PX`、`MarginPreset` 导入与页边距计算逻辑不变

- [x] Task3: 清理 `src/utils/page-sizes.ts`
  - [x] SubTask3.1: 移除 `PAGE_SIZES_MM` 常量与 `PageSizeMm` 接口
  - [x] SubTask3.2: 移除 `PageSize`、`Orientation` 类型导出
  - [x] SubTask3.3: 保留 `MARGINS_MM`、`MarginPreset`、`MarginMm`、`MM_TO_PX` 不变
  - [x] SubTask3.4: 更新文件顶部 JSDoc 注释，移除纸张尺寸相关说明

- [x] Task4: 更新 `src/settings.ts` 设置接口与 UI
  - [x] SubTask4.1: 从 `PagedEditorSettings` 接口移除 `pageSize`、`orientation` 字段
  - [x] SubTask4.2: 新增 `charsPerLine: number`、`linesPerPage: number` 字段
  - [x] SubTask4.3: 更新 `DEFAULT_SETTINGS`：移除 `pageSize`、`orientation`，新增 `charsPerLine: 80`、`linesPerPage: 40`
  - [x] SubTask4.4: 更新 imports：移除 `PageSize`、`Orientation`，保留 `MarginPreset`
  - [x] SubTask4.5: 移除 Page size 下拉 `Setting` 与 Orientation 下拉 `Setting`
  - [x] SubTask4.6: 新增"每行字符数" `Setting`：`.addSlider(slider => slider.setLimits(30, 150, 1).setDynamicTooltip())` + `.addText(text => text.inputEl.type = 'number')`，双向同步（slider 变化更新 text，text 变化更新 slider），clamp 到 30–150，onChange 保存并 `applyPagination()`
  - [x] SubTask4.7: 新增"每页行数" `Setting`：`.addSlider(...)` + `.addText(...)`，范围 15–80，双向同步，onChange 保存并 `applyPagination()`

- [x] Task5: 更新 `src/editor/pagination-plugin.ts` 调用点
  - [x] SubTask5.1: 更新 imports：从 `../utils/page-layout` 导入 `getContentBox`（签名已变），新增导入 `measureTextMetrics` from `../utils/text-metrics`
  - [x] SubTask5.2: 在 `recompute()` 方法中，将 `getContentBox(settings.pageSize, settings.orientation, settings.marginPreset)` 改为 `getContentBox(settings.charsPerLine, settings.linesPerPage, settings.marginPreset, measureTextMetrics())`

- [x] Task6: 更新 `src/reading/reading-pagination.ts` 调用点
  - [x] SubTask6.1: 更新 imports：新增导入 `measureTextMetrics` from `../utils/text-metrics`
  - [x] SubTask6.2: 在 `paginateReadingView()` 中，将 `getContentBox(settings.pageSize, settings.orientation, settings.marginPreset)` 改为 `getContentBox(settings.charsPerLine, settings.linesPerPage, settings.marginPreset, measureTextMetrics())`

- [x] Task7: 更新 `src/main.ts` 集成文本度量与 css-change 监听
  - [x] SubTask7.1: 更新 `applyPagedCssVariables()` 中的 `getContentBox()` 调用为新签名：`getContentBox(this.settings.charsPerLine, this.settings.linesPerPage, this.settings.marginPreset, measureTextMetrics())`
  - [x] SubTask7.2: 在 `onload()` 中注册 `this.registerEvent(this.app.workspace.on('css-change', () => this.applyPagination()))`，使字体/外观变化时重新度量并重新分页
  - [x] SubTask7.3: 更新 imports：新增导入 `measureTextMetrics` from `./utils/text-metrics`

- [x] Task 8: 构建与验证
  - [x] SubTask 8.1: 运行 `npm run build` 确保编译通过、无 TS 报错
  - [x] SubTask 8.2: 运行 `npm run lint` 确保无新增 ESLint 错误
  - [ ] SubTask 8.3: 在 Obsidian 中肉眼确认：设置页显示"每行字符数"和"每页行数"（滑块+数值输入）、滑块与数值同步、无 Page size/Orientation 下拉、调整设置后页面尺寸变化、字体变化后页面重新适配

# Task Dependencies
- Task 2 依赖 Task 1（getContentBox 需要 TextMetrics 类型）
- Task 5、6、7 依赖 Task 2（调用点需要新签名的 getContentBox）
- Task 4 可与 Task 1-3 并行（设置接口与 UI 改动独立于工具函数）
- Task 3 可与 Task 1-2 并行（清理 page-sizes.ts 不依赖其他）
- Task 8 依赖 Task 1-7 全部完成
