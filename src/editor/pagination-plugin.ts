import type { Extension, Range } from '@codemirror/state';
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from '@codemirror/view';
import type { PagedEditorSettings } from '../settings';
import { PageBreakWidget } from './page-break-widget';
import { getContentBox } from '../utils/page-layout';
import { measureTextMetrics } from '../utils/text-metrics';

/**
 * Vertical gap (in px) between two consecutive pages.
 * Must match the `--paged-gap` CSS variable declared in `styles.css`.
 */
const GAP_PX = 40;

/** Debounce window for recompute after doc/viewport/geometry changes. */
const RECOMPUTE_DEBOUNCE_MS = 120;

/**
 * Build a CodeMirror 6 `Extension` that renders A4-style pagination.
 *
 * The extension reads the current settings via `getSettings()` on every
 * recompute, so callers can mutate the settings object and then call
 * `app.workspace.updateOptions()` to trigger a fresh computation.
 *
 * Pagination strategy: "geometric" page breaks.
 * Each line block in the CM6 viewport reports an absolute `top` (pixel
 * offset from the start of the content area). We compute the page index
 * of each block as `floor(block.top / contentHeightPx)`. Whenever the
 * page index increases between consecutive blocks, we insert a
 * `PageBreakWidget` decoration at the start of the block that begins the
 * new page. The widget displays the page number of the page that just
 * ended.
 *
 * This approach is robust because it does not require iterating the
 * entire document — only the visible viewport — and the absolute `top`
 * values provide a stable anchor for page numbering even when scrolling.
 *
 * Known limitations (acceptable for v0.1):
 *   - Cumulative widget heights are not subtracted when computing
 *     `pageIndex`, so for very long documents (40+ pages) the page
 *     boundaries drift slightly. The drift is bounded by GAP_PX per
 *     page boundary, which is well under one page.
 *   - Best-effort block integrity only covers fenced code blocks and
 *     orphaned headings within the visible viewport; tables and tall
 *     blocks whose opener sits above the viewport may still be split
 *     (allowed by the spec when a block is taller than a single page).
 */
export function buildPaginationExtension(
	getSettings: () => PagedEditorSettings,
): Extension {
	return ViewPlugin.fromClass(
		class PaginationPlugin {
			decorations: DecorationSet = Decoration.none;
			private timer: number | null = null;
			/**
			 * Number of intermediate (non-end) widgets emitted by the
			 * previous recompute. Used to estimate the natural document
			 * height and avoid a feedback loop where widget heights
			 * inflate the total page count. The end-of-document widget
			 * has zero height and is excluded from this count.
			 */
			private prevIntermediateCount = 0;

			constructor(view: EditorView) {
				this.recompute(view);
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.viewportChanged ||
					update.geometryChanged ||
					update.focusChanged ||
					update.transactions.some((tx) => tx.reconfigured)
				) {
					this.scheduleRecompute(update.view);
				}
			}

			destroy() {
				if (this.timer !== null) {
					window.clearTimeout(this.timer);
					this.timer = null;
				}
			}

			private scheduleRecompute(view: EditorView) {
				if (this.timer !== null) {
					window.clearTimeout(this.timer);
				}
				this.timer = window.setTimeout(() => {
					this.timer = null;
					this.recompute(view);
				}, RECOMPUTE_DEBOUNCE_MS);
			}

			recompute(view: EditorView) {
				const settings = getSettings();
				if (!settings.enabled) {
					this.decorations = Decoration.none;
					this.prevIntermediateCount = 0;
					return;
				}

				const box = getContentBox(
					settings.charsPerLine,
					settings.linesPerPage,
					settings.marginPreset,
					measureTextMetrics(),
				);
				const contentHeightPx = box.contentHeightPx;
				if (contentHeightPx <= 0) {
					this.decorations = Decoration.none;
					this.prevIntermediateCount = 0;
					return;
				}

				// Each intermediate widget is (marginTop + gap + marginBottom)
				// tall. Subtract their cumulative height from the current
				// content height to estimate the natural document height
				// (without widgets), keeping the total page count stable
				// across recomputes. The end-of-document widget has zero
				// height and is not subtracted.
				const widgetHeight =
					box.marginTopPx + GAP_PX + box.marginBottomPx;
				const naturalHeight = Math.max(
					0,
					view.contentHeight -
						this.prevIntermediateCount * widgetHeight,
				);
				const totalPages = Math.max(
					1,
					Math.ceil(naturalHeight / contentHeightPx),
				);

				const decorations: Range<Decoration>[] = [];
			const blocks = view.viewportLineBlocks;
			let prevPageIndex = -1;

			// Pre-scan the viewport to locate fenced code-block spans and
			// heading lines, so geometric page breaks can be nudged to keep
			// these blocks intact (best-effort per spec).
			const codeFenceRanges: Array<{ from: number; to: number }> = [];
			let fenceOpenFrom: number | null = null;
			let fenceMarker: string | null = null;
			for (const block of blocks) {
				if (block.height === 0) continue;
				const line = view.state.doc.lineAt(block.from);
				const text = line.text;
				const fenceMatch = text.match(/^\s*(`{3,}|~{3,})/);
				const markerChar = fenceMatch?.[1]?.[0];
				if (fenceOpenFrom === null) {
					if (markerChar !== undefined) {
						fenceOpenFrom = block.from;
						fenceMarker = markerChar;
					}
				} else if (
					markerChar !== undefined &&
					fenceMarker !== null &&
					markerChar === fenceMarker
				) {
					codeFenceRanges.push({ from: fenceOpenFrom, to: block.to });
					fenceOpenFrom = null;
					fenceMarker = null;
				}
			}
			const lastBlock = blocks[blocks.length - 1];
			if (fenceOpenFrom !== null && lastBlock !== undefined) {
				// Unterminated fence within the viewport: treat the rest of
				// the viewport as part of the fence so we don't split it.
				codeFenceRanges.push({
					from: fenceOpenFrom,
					to: lastBlock.to,
				});
			}

			for (const block of blocks) {
				if (block.height === 0) continue;
				const pageIndex = Math.floor(
					block.top / contentHeightPx,
				);
				if (pageIndex > prevPageIndex) {
					// A page boundary was crossed.
					let breakPos = block.from;

					// Best-effort block integrity: if the break lands inside
					// a fenced code block whose opener is within the viewport,
					// move the break to the opener so the whole block starts
					// on the new page. (If the opener is above the viewport
					// the block is taller than a page and splitting is
					// allowed by the spec.)
					for (const range of codeFenceRanges) {
						if (breakPos > range.from && breakPos <= range.to) {
							breakPos = range.from;
							break;
						}
					}

					// Best-effort: avoid orphaning a heading at the bottom of
					// the previous page. If the line right before the break
					// is a heading, move the break to before the heading so
					// it travels with the following content.
					if (breakPos > 0) {
						const prevLine = view.state.doc.lineAt(breakPos - 1);
						if (prevLine.text.match(/^\s*#{1,6}\s/)) {
							breakPos = prevLine.from;
						}
					}

					// The widget shows the number of the page that just
					// ended (1-indexed).
					const pageNumber =
						prevPageIndex === -1
							? pageIndex
							: prevPageIndex + 1;
					if (pageNumber >= 1) {
						decorations.push(
							Decoration.widget({
								widget: new PageBreakWidget(
									pageNumber,
									totalPages,
									settings.pageNumberPosition,
									settings.pageNumberFormat,
								),
								side: -1,
							}).range(breakPos),
						);
					}
				}
				prevPageIndex = pageIndex;
			}

				// End-of-document widget: ensures the last page also shows a
				// page number even when no explicit break is emitted at the
				// very end. Placed at `doc.length` with `side: 1` so it
				// renders after the final character. Has zero height — the
				// last page's bottom margin is provided by the sizer's
				// padding-bottom.
				decorations.push(
					Decoration.widget({
						widget: new PageBreakWidget(
							totalPages,
							totalPages,
							settings.pageNumberPosition,
							settings.pageNumberFormat,
							true, // isEnd
						),
						side: 1,
					}).range(view.state.doc.length),
				);

				this.decorations = Decoration.set(decorations, true);
				// Subtract 1 for the end-of-document widget (zero height).
				this.prevIntermediateCount = Math.max(
					0,
					decorations.length - 1,
				);
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);
}
