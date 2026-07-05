# Tasks

- [x] Task 1: 创建 `src/reading/reading-pagination.ts` 模块
  - [x] SubTask 1.1: 创建 `src/reading/` 目录与 `reading-pagination.ts` 文件
  - [x] SubTask 1.2: 实现 `paginateReadingView(view: HTMLElement, settings: PagedEditorSettings): void` 函数——在 `.markdown-preview-sizer` 中按 `contentHeightPx` 计算每个块级子元素的页索引，在页边界处插入 / 移除 `<div class="paged-editor-page-break" data-position="...">` 元素（含 `<span class="paged-editor-page-number">` 子元素）
  - [x] SubTask 1.3: 实现 `clearReadingViewPagination(view: HTMLElement): void`——移除指定阅读视图中的所有分页元素
  - [x] SubTask 1.4: 算法复用 `getContentBox()` 计算几何，复用 `GAP_PX = 40` 常量（与编辑模式一致）；页码格式与位置遵循 settings
  - [x] SubTask 1.5: 处理末页页码——在 `.markdown-preview-sizer` 末尾追加一个分页元素显示最后一页页码（与编辑模式 `End-of-document widget` 一致）

- [x] Task 2: 实现阅读模式分页的注册与生命周期管理
  - [x] SubTask 2.1: 创建 `ReadingPaginationManager` 类（或在 `reading-pagination.ts` 中导出），管理多个阅读视图的分页状态
  - [x] SubTask 2.2: 监听 `app.workspace.on('layout-change', ...)` 与 `app.workspace.on('active-leaf-change', ...)`，对新可见的阅读视图初始化分页
  - [x] SubTask 2.3: 为每个阅读视图的 `.markdown-preview-sizer` 注册 MutationObserver（childList subtree），检测内容变化后 debounced（200ms）重新分页
  - [x] SubTask 2.4: 监听 `window.resize`，debounced（200ms）重新分页所有可见阅读视图
  - [x] SubTask 2.5: 提供 `refreshAll()` 方法——重新分页所有可见阅读视图（供设置变化时调用）
  - [x] SubTask 2.6: 提供 `destroyAll()` 方法——断开所有 MutationObserver、移除所有分页元素（供禁用 / 卸载时调用）

- [x] Task 3: 在 `main.ts` 中集成阅读模式分页
  - [x] SubTask 3.1: 在 `onload()` 中实例化 `ReadingPaginationManager`，注册 workspace 事件监听
  - [x] SubTask 3.2: 在 `applyPagination()` 中：启用时调用 `manager.refreshAll()`，禁用时调用 `manager.clearAll()`（移除所有分页元素）
  - [x] SubTask 3.3: 在 `onunload()` 中调用 `manager.destroyAll()`
  - [x] SubTask 3.4: 使用 `this.registerEvent(...)` / `this.register(...)` 确保事件监听与 MutationObserver 在卸载时自动清理

- [x] Task 4: 调整 `styles.css` 阅读模式规则
  - [x] SubTask 4.1: 将"纸张"样式从 `.markdown-preview-view` 移到 `.markdown-preview-sizer`（max-width、padding、白色背景、box-shadow、box-sizing）
  - [x] SubTask 4.2: 移除 `.markdown-preview-view` 上的 `background-image` / `background-size` / `background-repeat` 伪分页线属性
  - [x] SubTask 4.3: `.markdown-preview-view` 仅保留灰色桌面背景（继承自 `.markdown-reading-view`）
  - [x] SubTask 4.4: 覆盖 `.markdown-preview-sizer` 的默认 max-width（Obsidian 的 readable line length 设置可能设置 max-width: 700px），用 `var(--paged-page-width)` 取代
  - [x] SubTask 4.5: 确保阅读模式的 `.paged-editor-page-break` 复用编辑模式的样式（已在编辑模式定义，无需新增）

- [ ] Task 5: 构建与验证
  - [x] SubTask 5.1: 运行 `npm run build` 确保编译通过、无 TS 报错
  - [x] SubTask 5.2: 运行 `npm run lint` 确保无 ESLint 错误
  - [ ] SubTask 5.3: 在 Obsidian 中肉眼确认：阅读模式下分页元素可见、页码正确、页边距可见、内容不跨越分页、与编辑模式视觉一致

# Task Dependencies
- Task 2 依赖 Task 1（管理器调用分页函数）
- Task 3 依赖 Task 2（main.ts 集成管理器）
- Task 4 可与 Task 1-3 并行（纯 CSS 改动）
- Task 5 依赖 Task 1-4 全部完成
