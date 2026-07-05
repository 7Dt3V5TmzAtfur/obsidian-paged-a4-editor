# Tasks

- [ ] Task 1: 更新 `styles.css` — widget 高度、三段渐变背景、页码位置
  - [ ] SubTask 1.1: 将 `.paged-editor-page-break` 的 `height` 从 `var(--paged-gap)` 改为 `calc(var(--paged-margin-bottom) + var(--paged-gap) + var(--paged-margin-top))`
  - [ ] SubTask 1.2: 将 `.paged-editor-page-break` 的 `background` 从 `var(--background-secondary)` 改为三段线性渐变：白（0 → marginBottom）→ 灰（marginBottom → marginBottom+gap）→ 白（marginBottom+gap → 100%），使用 `background-image: linear-gradient(to bottom, ...)` 硬色阶过渡
  - [ ] SubTask 1.3: 将 `.paged-editor-page-number` 的 `bottom` 从 `0` 改为 `var(--paged-margin-top)`（页码位于灰色 gap 区域底部）

- [ ] Task 2: 更新 `src/editor/pagination-plugin.ts` — naturalHeight 计算
  - [ ] SubTask 2.1: 在 `recompute()` 中，从 `box` 获取 `marginTopPx` 和 `marginBottomPx`
  - [ ] SubTask 2.2: 将 `view.contentHeight - this.prevWidgetCount * GAP_PX` 改为 `view.contentHeight - this.prevWidgetCount * (box.marginTopPx + GAP_PX + box.marginBottomPx)`

- [ ] Task 3: 更新 `src/reading/reading-pagination.ts` — naturalContentHeight 计算
  - [ ] SubTask 3.1: 在 `paginateReadingView()` 中，从 `box` 获取 `marginTopPx` 和 `marginBottomPx`
  - [ ] SubTask 3.2: 将 `previousBreakCount * GAP_PX` 改为 `previousBreakCount * (box.marginTopPx + GAP_PX + box.marginBottomPx)`

- [ ] Task 4: 构建与验证
  - [ ] SubTask 4.1: 运行 `npm run build` 确保编译通过
  - [ ] SubTask 4.2: 运行 `npm run lint` 确保无新增错误
  - [ ] SubTask 4.3: 在 Obsidian 中确认中间页面有可见的上下边距（白色区域），灰色 gap 仍在页面间，页码在灰色区域底部

# Task Dependencies
- Task 1、2、3 相互独立，可并行
- Task 4 依赖 Task 1-3 全部完成
