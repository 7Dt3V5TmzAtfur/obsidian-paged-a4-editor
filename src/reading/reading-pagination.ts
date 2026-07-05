import type { App, Plugin } from 'obsidian';
import type {
	PageNumberFormat,
	PageNumberPosition,
	PagedEditorSettings,
} from '../settings';
import { getContentBox } from '../utils/page-layout';
import { measureTextMetrics } from '../utils/text-metrics';

/**
 * Vertical gap (in px) between two consecutive pages.
 *
 * Must match the `--paged-gap` CSS variable declared in `styles.css` and
 * the `GAP_PX` constant in `src/editor/pagination-plugin.ts`. The value
 * is used below (combined with the top/bottom margins) to subtract the
 * cumulative height of previously inserted intermediate page-break
 * elements when estimating the natural document height, so the total
 * page count stays stable across recomputes (mirroring the editor
 * module's adjustment).
 */
const GAP_PX = 40;

/** Debounce window for re-paginating after content / geometry changes. */
const RECOMPUTE_DEBOUNCE_MS = 200;

/**
 * Format the page-number text according to the configured style.
 *
 * Replicates `PageBreakWidget.formatPageNumber()` in
 * `src/editor/page-break-widget.ts` exactly so reading-mode and
 * editor-mode breaks render identical page-number badges. The helper is
 * duplicated (rather than imported) to avoid coupling this module to a
 * CodeMirror 6 widget file.
 */
function formatPageNumber(
	pageNumber: number,
	total: number,
	format: PageNumberFormat,
): string {
	if (format === 'chinese') {
		return `第 ${pageNumber} 页`;
	}
	if (format === 'page-x-of-y') {
		return `Page ${pageNumber} of ${total}`;
	}
	return String(pageNumber);
}

/**
 * Build a `<div class="paged-editor-page-break">` element containing a
 * page-number span. Mirrors the DOM emitted by `PageBreakWidget.toDOM()`
 * in editor mode so the shared CSS in `styles.css` styles both modes
 * identically.
 *
 * Structure:
 *   <div class="paged-editor-page-break" data-position="...">
 *     <span class="paged-editor-page-number">...</span>
 *   </div>
 */
function createPageBreakElement(
	pageNumber: number,
	totalPages: number,
	position: PageNumberPosition,
	format: PageNumberFormat,
	isEnd: boolean = false,
): HTMLElement {
	const wrap = createDiv({ cls: 'paged-editor-page-break' });
	wrap.setAttribute('data-position', position);
	if (isEnd) {
		wrap.setAttribute('data-end', 'true');
	}

	createSpan({
		cls: 'paged-editor-page-number',
		text: formatPageNumber(pageNumber, totalPages, format),
		parent: wrap,
	});

	return wrap;
}

/** Locate the `.markdown-preview-sizer` inside a reading view. */
function findSizer(view: HTMLElement): HTMLElement | null {
	return view.querySelector<HTMLElement>('.markdown-preview-sizer');
}

/**
 * Paginate a single reading view by inserting real page-break elements
 * between block-level children of the `.markdown-preview-sizer`.
 *
 * Algorithm mirrors the editor module's "geometric" page-break strategy
 * (`src/editor/pagination-plugin.ts`): each child's position within the
 * writable content area is divided by `contentHeightPx` to determine its
 * page index. When the page index increases between consecutive children,
 * a page-break element is inserted before the child that starts the new
 * page, displaying the number of the page that just ended (1-indexed).
 *
 * Position measurement uses `getBoundingClientRect()` differences so the
 * value is stable regardless of scroll position and `offsetParent`
 * quirks. The sizer's top padding (page top margin) is subtracted so
 * position 0 corresponds to the start of the writable content area,
 * matching the editor mode's `block.top` semantics.
 *
 * Known limitations (acceptable for v0.1, matching editor mode):
 *   - Cumulative page-break heights (`GAP_PX` each) are not subtracted
 *     when computing per-child page indices, so for very long documents
 *     (40+ pages) the page boundaries drift slightly. The drift is
 *     bounded by `GAP_PX` per boundary, well under one page.
 *   - A single child taller than `contentHeightPx` is allowed to span
 *     pages (not split), matching the editor-mode spec.
 *
 * @param view     The `.markdown-reading-view` element (or any ancestor
 *                 of `.markdown-preview-sizer`).
 * @param settings Current plugin settings.
 */
export function paginateReadingView(
	view: HTMLElement,
	settings: PagedEditorSettings,
): void {
	// If paged mode is disabled, do nothing — the caller is responsible
	// for clearing existing breaks via `clearReadingViewPagination` /
	// `clearAll`.
	if (!settings.enabled) return;

	const sizer = findSizer(view);
	if (sizer === null) return;

	const box = getContentBox(
		settings.charsPerLine,
		settings.linesPerPage,
		settings.marginPreset,
		measureTextMetrics(),
	);
	const contentHeightPx = box.contentHeightPx;
	if (contentHeightPx <= 0) return;

	// Count existing page-break elements and capture the current
	// scrollHeight BEFORE removing them. Each intermediate break is
	// (marginTop + gap + marginBottom) tall; the end-of-document break
	// has zero height. We subtract the cumulative INTERMEDIATE break
	// height from the measured scroll height to derive the natural
	// content height, keeping `totalPages` stable across recomputes
	// (mirroring the editor mode's adjustment).
	const previousBreaks = sizer.querySelectorAll<HTMLElement>(
		'.paged-editor-page-break',
	);
	const previousEndCount = sizer.querySelectorAll<HTMLElement>(
		'.paged-editor-page-break[data-end="true"]',
	).length;
	const previousIntermediateCount =
		previousBreaks.length - previousEndCount;
	const measuredScrollHeight = sizer.scrollHeight;

	// Clean slate: remove all previously inserted page-break elements so
	// child-position measurements reflect the natural (gap-free) layout.
	previousBreaks.forEach((el) => el.remove());

	// `:scope > *` selects only direct element children of the sizer
	// (block-level nodes in Obsidian's reading mode).
	const children = Array.from(
		sizer.querySelectorAll<HTMLElement>(':scope > *'),
	);
	if (children.length === 0) return;

	// Measure sizer geometry AFTER removal so positions reflect the
	// natural layout.
	const sizerRect = sizer.getBoundingClientRect();
	const computedStyle = window.getComputedStyle(sizer);
	const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
	const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

	// Natural content height = measured scroll height minus padding
	// (page margins) minus the cumulative height of the INTERMEDIATE
	// page-break elements that were present before we removed them.
	// (End-of-document breaks have zero height and are excluded.) This
	// keeps `totalPages` stable across recomputes (the `page-x-of-y`
	// total doesn't drift as breaks are inserted and removed).
	const widgetHeight =
		box.marginTopPx + GAP_PX + box.marginBottomPx;
	const naturalContentHeight = Math.max(
		0,
		measuredScrollHeight -
			paddingTop -
			paddingBottom -
			previousIntermediateCount * widgetHeight,
	);
	const totalPages = Math.max(
		1,
		Math.ceil(naturalContentHeight / contentHeightPx),
	);

	// Phase 1: measure all children and decide where breaks go. We must
	// finish measuring before inserting any breaks, otherwise each
	// inserted break (GAP_PX tall) would shift subsequent children and
	// invalidate their measured positions.
	const pendingBreaks: Array<{
		child: HTMLElement;
		pageNumber: number;
	}> = [];
	let prevPageIndex = -1;

	for (const child of children) {
		// Skip hidden / zero-height elements (mirrors editor mode's
		// `block.height === 0` check).
		if (child.offsetHeight === 0) continue;

		const childRect = child.getBoundingClientRect();
		// Position within the writable content area (excluding the top
		// page margin), matching the editor mode's `block.top` which is
		// relative to the start of the content area.
		const positionWithinContent =
			childRect.top - sizerRect.top - paddingTop;
		const pageIndex = Math.max(
			0,
			Math.floor(positionWithinContent / contentHeightPx),
		);

		if (pageIndex > prevPageIndex) {
			// A page boundary was crossed. The break shows the number
			// of the page that just ended (1-indexed), matching editor
			// mode.
			const pageNumber =
				prevPageIndex === -1 ? pageIndex : prevPageIndex + 1;
			if (pageNumber >= 1) {
				pendingBreaks.push({ child, pageNumber });
			}
		}
		prevPageIndex = pageIndex;
	}

	// Phase 2: insert the page-break elements before the children that
	// start each new page. Each break is anchored to a stable element
	// reference, so insertion order doesn't matter.
	for (const { child, pageNumber } of pendingBreaks) {
		const breakEl = createPageBreakElement(
			pageNumber,
			totalPages,
			settings.pageNumberPosition,
			settings.pageNumberFormat,
		);
		sizer.insertBefore(breakEl, child);
	}

	// End-of-document break: ensures the last page also shows a page
	// number, mirroring the editor mode's end-of-document widget (placed
	// at `doc.length` with `side: 1`). Appended at the end of the sizer
	// so it renders after the final block. Has zero height — the last
	// page's bottom margin is provided by the sizer's padding-bottom.
	const endBreak = createPageBreakElement(
		totalPages,
		totalPages,
		settings.pageNumberPosition,
		settings.pageNumberFormat,
		true, // isEnd
	);
	sizer.appendChild(endBreak);
}

/**
 * Remove all `.paged-editor-page-break` elements from a reading view.
 * Defensive: if the sizer is not found, does nothing.
 */
export function clearReadingViewPagination(view: HTMLElement): void {
	const sizer = findSizer(view);
	if (sizer === null) return;

	sizer
		.querySelectorAll<HTMLElement>('.paged-editor-page-break')
		.forEach((el) => el.remove());
}

/** Bookkeeping for a single attached reading view. */
interface AttachedView {
	observer: MutationObserver;
	paginateTimer: number | null;
}

/**
 * Manages pagination lifecycle for all open reading views.
 *
 * Responsibilities:
 *   - Attach a `MutationObserver` to each view's `.markdown-preview-sizer`
 *     so content changes trigger a debounced re-pagination.
 *   - Listen to workspace `layout-change` / `active-leaf-change` events
 *     and `window resize` so newly visible views get paginated and
 *     existing views re-paginate on geometry changes.
 *   - Clean up all observers and inserted elements on destroy.
 *
 * The manager registers all event listeners via `plugin.registerEvent`
 * / `plugin.registerDomEvent` so they auto-cleanup on plugin unload,
 * and registers a final `destroyAll()` callback for observer / element
 * cleanup.
 */
export class ReadingPaginationManager {
	private readonly app: App;
	private readonly getSettings: () => PagedEditorSettings;
	private readonly attachedViews = new Map<HTMLElement, AttachedView>();
	private refreshTimer: number | null = null;

	constructor(
		app: App,
		plugin: Plugin,
		getSettings: () => PagedEditorSettings,
	) {
		this.app = app;
		this.getSettings = getSettings;

		// Workspace events: re-paginate when the layout changes or a new
		// leaf becomes active (covers opening / switching tabs and newly
		// visible reading views).
		plugin.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.scheduleRefreshAll();
			}),
		);
		plugin.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.scheduleRefreshAll();
			}),
		);

		// Window resize: page geometry is pixel-based and stable per
		// settings, but zoom / DPR changes can shift layout, so re-run.
		plugin.registerDomEvent(window, 'resize', () => {
			this.scheduleRefreshAll();
		});

		// Final cleanup on unload: disconnect observers, clear timers,
		// and remove all inserted page-break elements.
		plugin.register(() => this.destroyAll());
	}

	/**
	 * Initialize pagination for a reading view. Sets up a
	 * `MutationObserver` on the `.markdown-preview-sizer` (childList,
	 * subtree) and immediately paginates. Tracks this view so
	 * `refreshAll` / `detach` can find it.
	 *
	 * If the sizer is not yet present (view still initializing), the
	 * method returns without attaching; a subsequent `refreshAll`
	 * (triggered by `layout-change`) will retry.
	 */
	attach(view: HTMLElement): void {
		if (this.attachedViews.has(view)) return;

		const sizer = findSizer(view);
		if (sizer === null) return;

		const entry: AttachedView = {
			observer: new MutationObserver((mutations) => {
				// Ignore mutations that only add/remove our own
				// page-break elements, otherwise inserting breaks
				// would feedback-loop into re-pagination.
				const hasContentChange = mutations.some((m) => {
					for (const node of Array.from(m.addedNodes)) {
						if (
							node.instanceOf(HTMLElement) &&
							!node.classList.contains(
								'paged-editor-page-break',
							)
						) {
							return true;
						}
					}
					for (const node of Array.from(m.removedNodes)) {
						if (
							node.instanceOf(HTMLElement) &&
							!node.classList.contains(
								'paged-editor-page-break',
							)
						) {
							return true;
						}
					}
					return false;
				});
				if (hasContentChange) {
					this.schedulePaginate(view);
				}
			}),
			paginateTimer: null,
		};

		entry.observer.observe(sizer, {
			childList: true,
			subtree: true,
		});

		this.attachedViews.set(view, entry);
		paginateReadingView(view, this.getSettings());
	}

	/**
	 * Stop observing a view, remove its page-break elements, and stop
	 * tracking it. Safe to call on a view that was never attached
	 * (no-op).
	 */
	detach(view: HTMLElement): void {
		const entry = this.attachedViews.get(view);
		if (entry === undefined) return;

		entry.observer.disconnect();
		if (entry.paginateTimer !== null) {
			window.clearTimeout(entry.paginateTimer);
		}
		clearReadingViewPagination(view);
		this.attachedViews.delete(view);
	}

	/**
	 * Re-paginate all currently visible reading views. Attaches any
	 * newly visible views, cleans up views that have been removed from
	 * the DOM (e.g., closed tabs), and re-runs pagination on already
	 * attached views. Called when settings change or workspace layout
	 * changes.
	 */
	refreshAll(): void {
		// Clean up views that are no longer in the DOM (e.g., closed
		// tabs) to avoid leaking observers and stale references.
		for (const [view, entry] of this.attachedViews) {
			if (!document.contains(view)) {
				entry.observer.disconnect();
				if (entry.paginateTimer !== null) {
					window.clearTimeout(entry.paginateTimer);
				}
				this.attachedViews.delete(view);
			}
		}

		// Attach and paginate all currently visible reading views.
		const views = document.querySelectorAll<HTMLElement>(
			'.markdown-reading-view',
		);
		views.forEach((view) => {
			if (!this.attachedViews.has(view)) {
				this.attach(view);
			} else {
				paginateReadingView(view, this.getSettings());
			}
		});
	}

	/**
	 * Remove all page-break elements and disconnect all observers
	 * (clean slate). Used when disabling paged mode — the manager can
	 * be re-activated later via `refreshAll`, which re-attaches
	 * observers to all visible views.
	 */
	clearAll(): void {
		for (const [, entry] of this.attachedViews) {
			entry.observer.disconnect();
			if (entry.paginateTimer !== null) {
				window.clearTimeout(entry.paginateTimer);
			}
		}
		for (const [view] of this.attachedViews) {
			clearReadingViewPagination(view);
		}
		this.attachedViews.clear();
	}

	/**
	 * Full teardown: disconnect observers, clear timers, remove all
	 * page-break elements. Called on plugin unload (via the
	 * `plugin.register` callback installed in the constructor).
	 */
	destroyAll(): void {
		this.clearAll();
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}
	}

	/** Debounced re-pagination of a single view. */
	private schedulePaginate(view: HTMLElement): void {
		const entry = this.attachedViews.get(view);
		if (entry === undefined) return;
		if (entry.paginateTimer !== null) {
			window.clearTimeout(entry.paginateTimer);
		}
		entry.paginateTimer = window.setTimeout(() => {
			entry.paginateTimer = null;
			paginateReadingView(view, this.getSettings());
		}, RECOMPUTE_DEBOUNCE_MS);
	}

	/** Debounced `refreshAll` for high-frequency workspace events. */
	private scheduleRefreshAll(): void {
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
		}
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refreshAll();
		}, RECOMPUTE_DEBOUNCE_MS);
	}
}
