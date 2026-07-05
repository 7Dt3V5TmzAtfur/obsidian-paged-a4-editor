import { MARGINS_MM, MM_TO_PX, MarginPreset } from './page-sizes';
import type { TextMetrics } from './text-metrics';

/**
 * Geometry of a single rendered page and its writable content box
 * (all values in CSS pixels).
 */
export interface ContentBox {
	/** Full page width (paper width). */
	pageWidthPx: number;
	/** Full page height (paper height). */
	pageHeightPx: number;
	/** Top margin (paper top -> content top). */
	marginTopPx: number;
	/** Right margin. */
	marginRightPx: number;
	/** Bottom margin (content bottom -> paper bottom). */
	marginBottomPx: number;
	/** Left margin. */
	marginLeftPx: number;
	/** Writable content width = pageWidth - left - right. */
	contentWidthPx: number;
	/** Writable content height = pageHeight - top - bottom.
	 * This is the threshold used by the pagination plugin to decide
	 * where to insert a page break. */
	contentHeightPx: number;
}

/**
 * Compute the pixel geometry of a page from char/line-count settings.
 *
 * The content area is derived directly from the user's `charsPerLine` and
 * `linesPerPage` settings multiplied by the measured text metrics; the
 * full page size is then expanded by the selected margin preset.
 *
 * @param charsPerLine  How many characters should fit on one line.
 * @param linesPerPage  How many lines should fit on one page.
 * @param marginPreset  Named margin preset (normal/narrow/wide).
 * @param textMetrics   Measured char width and line height in pixels.
 */
export function getContentBox(
	charsPerLine: number,
	linesPerPage: number,
	marginPreset: MarginPreset,
	textMetrics: TextMetrics,
): ContentBox {
	const margin = MARGINS_MM[marginPreset];

	const marginTopPx = Math.round(margin.top * MM_TO_PX);
	const marginRightPx = Math.round(margin.right * MM_TO_PX);
	const marginBottomPx = Math.round(margin.bottom * MM_TO_PX);
	const marginLeftPx = Math.round(margin.left * MM_TO_PX);

	const contentWidthPx = charsPerLine * textMetrics.charWidthPx;
	const contentHeightPx = linesPerPage * textMetrics.lineHeightPx;

	const pageWidthPx = contentWidthPx + marginLeftPx + marginRightPx;
	const pageHeightPx = contentHeightPx + marginTopPx + marginBottomPx;

	return {
		pageWidthPx,
		pageHeightPx,
		marginTopPx,
		marginRightPx,
		marginBottomPx,
		marginLeftPx,
		contentWidthPx,
		contentHeightPx,
	};
}
