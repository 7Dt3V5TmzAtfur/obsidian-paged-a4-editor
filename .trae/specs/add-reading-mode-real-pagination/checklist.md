# Checklist

- [x] 新建 `src/reading/reading-pagination.ts` 模块
- [x] 实现 `paginateReadingView(view, settings)` 函数：按 `contentHeightPx` 计算页索引，插入分页元素
- [x] 分页元素复用 `.paged-editor-page-break` / `.paged-editor-page-number` CSS 类
- [x] 分页元素含 `data-position` 属性（遵循 `pageNumberPosition` 设置）
- [x] 页码文本格式遵循 `pageNumberFormat` 设置（number / page-x-of-y / chinese）
- [x] 末页底部显示页码（在 `.markdown-preview-sizer` 末尾追加分页元素）
- [x] 单个块高于一页时允许跨越分页（与编辑模式一致）
- [x] 实现 `clearReadingViewPagination(view)` 函数：移除指定视图的分页元素
- [x] 实现 `ReadingPaginationManager` 类：管理多个阅读视图的分页状态
- [x] 监听 `workspace.on('layout-change')` 与 `workspace.on('active-leaf-change')`
- [x] 为每个阅读视图注册 MutationObserver（childList subtree），debounced 200ms 重新分页
- [x] 监听 `window.resize`，debounced 200ms 重新分页
- [x] 实现 `refreshAll()` 方法（供设置变化时调用）
- [x] 实现 `destroyAll()` 方法（断开 Observer、移除分页元素）
- [x] 在 `main.ts.onload()` 中实例化并注册管理器
- [x] 在 `applyPagination()` 中：启用时 `refreshAll()`，禁用时 `clearAll()`
- [x] 在 `onunload()` 中 `destroyAll()`
- [x] 使用 `registerEvent` / `register` 确保自动清理
- [x] `styles.css`：纸张样式从 `.markdown-preview-view` 移到 `.markdown-preview-sizer`
- [x] `styles.css`：移除 `.markdown-preview-view` 的伪分页线背景属性
- [x] `styles.css`：覆盖 `.markdown-preview-sizer` 的默认 max-width 为 `var(--paged-page-width)`
- [x] `styles.css`：`.markdown-preview-view` 仅保留灰色桌面背景
- [ ] 阅读模式下分页元素可见、页码正确
- [ ] 阅读模式下页边距可见（padding 区域为白色）
- [ ] 阅读模式下内容不跨越分页元素
- [ ] 阅读模式与编辑模式视觉一致
- [ ] 禁用 paged 模式后阅读视图恢复 Obsidian 默认样式
- [x] `npm run build` 通过、无 TS 报错
- [x] `npm run lint` 无错误

## 运行时验证说明

以下 5 个检查点需要在 Obsidian 中肉眼确认，无法在当前构建/静态检查环境中验证：

- 阅读模式下分页元素可见、页码正确
- 阅读模式下页边距可见（padding 区域为白色）
- 阅读模式下内容不跨越分页元素
- 阅读模式与编辑模式视觉一致
- 禁用 paged 模式后阅读视图恢复 Obsidian 默认样式

请在 Obsidian 中重新加载插件、切换到阅读模式后人工确认。验证步骤：
1. 复制 `main.js`、`manifest.json`、`styles.css` 到 vault 的 `.obsidian/plugins/obsidian-sample-plugin/` 目录
2. 在 Obsidian 设置 → 社区插件中重新加载插件
3. 打开一个较长的 markdown 文档，切换到阅读模式
4. 确认：可见灰色 gap 分页 + 页码徽标、白色页边距、内容不跨越 gap、与编辑模式视觉一致
5. 切换 paged 模式开关，确认禁用后阅读视图恢复默认样式
