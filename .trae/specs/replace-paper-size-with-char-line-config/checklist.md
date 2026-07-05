# Checklist

## 文本度量模块
- [x] 新建 `src/utils/text-metrics.ts` 模块
- [x] 导出 `TextMetrics` 接口（`{ charWidthPx: number; lineHeightPx: number }`）
- [x] 导出 `DEFAULT_TEXT_METRICS` 常量（`{ charWidthPx: 8, lineHeightPx: 24 }`）
- [x] 实现 `measureTextMetrics()` 函数：从 DOM 实测字符宽度
- [x] 字符宽度测量：创建隐藏 span，应用编辑器字体，渲染 62 字符样本，测量宽度/62
- [x] 行高测量：创建两行文本隐藏 div，测量高度/2；或从 computed lineHeight 读取
- [x] 度量完成后移除探测元素（不泄漏 DOM）
- [x] 度量失败时回退到 `DEFAULT_TEXT_METRICS`

## 页面几何计算
- [x] `getContentBox()` 签名改为 `(charsPerLine, linesPerPage, marginPreset, textMetrics)`
- [x] `contentWidthPx = charsPerLine × textMetrics.charWidthPx`
- [x] `contentHeightPx = linesPerPage × textMetrics.lineHeightPx`
- [x] `pageWidthPx = contentWidthPx + marginLeftPx + marginRightPx`
- [x] `pageHeightPx = contentHeightPx + marginTopPx + marginBottomPx`
- [x] 移除对 `PAGE_SIZES_MM`、`PageSize`、`Orientation` 的导入与使用
- [x] 保留 `MARGINS_MM`、`MM_TO_PX`、`MarginPreset` 页边距计算不变

## page-sizes.ts 清理
- [x] 移除 `PAGE_SIZES_MM` 常量与 `PageSizeMm` 接口
- [x] 移除 `PageSize`、`Orientation` 类型导出
- [x] 保留 `MARGINS_MM`、`MarginPreset`、`MarginMm`、`MM_TO_PX`
- [x] 更新 JSDoc 注释，移除纸张尺寸相关说明

## 设置接口
- [x] `PagedEditorSettings` 移除 `pageSize`、`orientation` 字段
- [x] `PagedEditorSettings` 新增 `charsPerLine: number`、`linesPerPage: number` 字段
- [x] `DEFAULT_SETTINGS` 移除 `pageSize: 'A4'`、`orientation: 'portrait'`
- [x] `DEFAULT_SETTINGS` 新增 `charsPerLine: 80`、`linesPerPage: 40`
- [x] imports 移除 `PageSize`、`Orientation`，保留 `MarginPreset`

## 设置页 UI
- [x] 移除 Page size 下拉 Setting
- [x] 移除 Orientation 下拉 Setting
- [x] 新增"每行字符数" Setting：滑块（30–150，步进 1）+ 数值输入框
- [x] 滑块与数值输入框双向同步（调整任一方更新另一方）
- [x] 滑块拖动时显示动态 tooltip（`setDynamicTooltip()`）
- [x] 数值输入框超出范围时 clamp 到边界
- [x] onChange 保存设置并调用 `applyPagination()`
- [x] 新增"每页行数" Setting：滑块（15–80，步进 1）+ 数值输入框
- [x] "每页行数"滑块与数值输入框双向同步
- [x] 保留 Margin preset 下拉不变

## 调用点更新
- [x] `pagination-plugin.ts`：`getContentBox()` 调用改为新签名
- [x] `pagination-plugin.ts`：导入 `measureTextMetrics`
- [x] `reading-pagination.ts`：`getContentBox()` 调用改为新签名
- [x] `reading-pagination.ts`：导入 `measureTextMetrics`
- [x] `main.ts` `applyPagedCssVariables()`：`getContentBox()` 调用改为新签名
- [x] `main.ts`：导入 `measureTextMetrics`

## css-change 监听
- [x] `main.ts` `onload()` 中注册 `app.workspace.on('css-change', ...)` 事件
- [x] css-change 触发时调用 `applyPagination()` 重新度量并重新分页
- [x] 使用 `this.registerEvent(...)` 确保自动清理

## 构建与验证
- [x] `npm run build` 通过、无 TS 报错
- [x] `npm run lint` 无新增错误（baseline：仅 settings.ts 预存警告）
- [ ] 设置页显示"每行字符数"和"每页行数"（滑块+数值输入）
- [ ] 滑块与数值输入框同步
- [x] 设置页无 Page size / Orientation 下拉（代码确认已移除）
- [ ] 调整 charsPerLine 后页面宽度变化
- [ ] 调整 linesPerPage 后页面高度变化
- [ ] 字体大小变化后页面重新适配（css-change 触发）
- [ ] 编辑模式与阅读模式分页正常
