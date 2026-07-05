# 在设置中新增 A3 页面尺寸选项

## Summary

在插件的 Page size 下拉设置中新增 A3 选项（ISO 216 标准，297 × 420 mm，即 2 倍 A4）。改动范围小、风险低：页面尺寸数据集中在一个模块，几何计算函数通过查表自动适配，仅需修改 2 个文件。

## Current State Analysis

当前支持的页面尺寸定义在 [src/utils/page-sizes.ts](file:///d:/test/test1/.obsidian/plugins/obsidian-sample-plugin-master/src/utils/page-sizes.ts)：

- `PAGE_SIZES_MM: Record<'A4' | 'Letter' | 'Legal', PageSizeMm>` — 硬编码的 3 个尺寸
- `PageSize = 'A4' | 'Letter' | 'Legal'` — 联合类型

[src/utils/page-layout.ts](file:///d:/test/test1/.obsidian/plugins/obsidian-sample-plugin-master/src/utils/page-layout.ts) 的 `getContentBox()` 通过 `PAGE_SIZES_MM[pageSize]` 查表，自动适配新尺寸——无需修改。

[src/settings.ts](file:///d:/test/test1/.obsidian/plugins/obsidian-sample-plugin-master/src/settings.ts) 的 Page size 下拉（第 64-78 行）手动列出了 3 个 `.addOption(...)` 调用，需要追加 A3。

[src/main.ts](file:///d:/test/test1/.obsidian/plugins/obsidian-sample-plugin-master/src/main.ts) 无需修改——CSS 变量从 `getContentBox()` 动态读取，编辑模式与阅读模式分页都通过设置闭包读取最新值。

## Proposed Changes

### Change 1: `src/utils/page-sizes.ts`

**What**: 在 `PAGE_SIZES_MM` 记录中新增 A3 条目，扩展 `PageSize` 联合类型，更新 JSDoc 注释。

**Why**: 这是页面尺寸的单一数据源。A3 遵循 ISO 216 标准（297 × 420 mm），是 A4 的 2 倍，与现有 A4 同属 ISO 216 系列。

**How**:

1. 在文件顶部 JSDoc 注释的尺寸列表中追加一行 A3 说明：
   ```
   - A3:     297 × 420 mm (ISO 216)
   ```

2. 将 `PAGE_SIZES_MM` 的键类型从 `'A4' | 'Letter' | 'Legal'` 扩展为 `'A3' | 'A4' | 'Letter' | 'Legal'`，并在对象字面量中新增条目（按尺寸从大到小排列：A3 在 A4 之前）：
   ```typescript
   export const PAGE_SIZES_MM: Record<'A3' | 'A4' | 'Letter' | 'Legal', PageSizeMm> = {
       A3: { width: 297, height: 420 },
       A4: { width: 210, height: 297 },
       Letter: { width: 216, height: 279 },
       Legal: { width: 216, height: 356 },
   };
   ```

3. 将 `PageSize` 类型扩展为：
   ```typescript
   export type PageSize = 'A3' | 'A4' | 'Letter' | 'Legal';
   ```

### Change 2: `src/settings.ts`

**What**: 在 Page size 下拉控件中追加 A3 选项。

**Why**: 下拉选项是手动枚举的，必须同步追加新选项，否则用户无法在 UI 中选择 A3。

**How**:

在第 64-78 行的 Page size `Setting` 的 `addDropdown` 回调中，在 `addOption('A4', ...)` 之前追加一行（按尺寸从大到小排列，与 `PAGE_SIZES_MM` 顺序一致）：

```typescript
.addOption('A3', 'A3 (297 × 420 mm)')
.addOption('A4', 'A4 (210 × 297 mm)')
.addOption('Letter', 'Letter (216 × 279 mm)')
.addOption('Legal', 'Legal (216 × 356 mm)')
```

默认值保持 `'A4'` 不变（`DEFAULT_SETTINGS.pageSize` 无需修改）。

## Assumptions & Decisions

- **A3 尺寸采用 ISO 216 标准**：297 × 420 mm（纵向时 width=297, height=420）。这是国际标准，与现有 A4 同系列。
- **下拉选项排列顺序**：按物理尺寸从大到小（A3 → A4 → Letter → Legal），与 `PAGE_SIZES_MM` 对象字面量顺序一致，便于用户按尺寸直觉选择。
- **默认值不变**：保持 `pageSize: 'A4'` 作为默认，避免破坏现有用户的配置。
- **不修改 `getContentBox()`**：它通过 `PAGE_SIZES_MM[pageSize]` 查表，新增 A3 条目后自动支持，无需改动。
- **不修改 main.ts / styles.css / reading-pagination.ts**：这些模块通过 `getContentBox()` 间接读取尺寸，无硬编码。
- **不修改 manifest.json 版本号**：本变更属于功能增强，是否 bump 版本由发布流程决定，不在本计划范围内（如需可后续手动从 0.1.0 → 0.2.0）。

## Verification

1. **构建检查**：运行 `npm run build`，确认 `tsc -noEmit` 通过、无类型错误。
2. **Lint 检查**：运行 `npm run lint`，确认无新增 error/warning（baseline 为仅 `settings.ts:39` 的预存 settings-tab 警告）。
3. **UI 验证（需 Obsidian 运行时）**：
   - 重新加载插件，打开设置 → Paged A4 Editor
   - 确认 Page size 下拉中出现 "A3 (297 × 420 mm)" 选项
   - 选择 A3 后确认编辑模式与阅读模式的页面尺寸都变大（A3 宽度 1123px ≈ 297mm × 3.78，高度 1587px ≈ 420mm × 3.78）
   - 切换 A3 横向（landscape）确认宽高互换
   - 切换回 A4 确认配置正常保存与恢复
