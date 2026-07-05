/**
 * Text-metrics utilities for char/line-count-based page geometry.
 *
 * Instead of fixing the page to a physical paper size (A4, Letter, ...),
 * the pagination is driven by how many characters fit on a single line
 * and how many lines fit on a single page. To convert those counts into
 * pixel dimensions we need to know the actual width of one character and
 * the actual height of one line in the active editor — that is what
 * {@link measureTextMetrics} provides.
 */

/**
 * Measured text geometry (in CSS pixels) used to derive page dimensions
 * from `charsPerLine` / `linesPerPage` settings.
 */
export interface TextMetrics {
	/** Average width of a single character in pixels. */
	charWidthPx: number;
	/** Height of a single text line in pixels. */
	lineHeightPx: number;
}

/**
 * Fallback metrics used when runtime measurement is not possible
 * (e.g. the editor DOM is not yet mounted, or `getBoundingClientRect`
 * returns 0/NaN). The values approximate Obsidian's default UI font.
 */
export const DEFAULT_TEXT_METRICS: TextMetrics = {
	charWidthPx: 8,
	lineHeightPx: 24,
};

/**
 * 62-character sample covering lowercase letters, uppercase letters and
 * digits. The wide character mix yields an average width that holds up
 * reasonably well for typical prose + code content.
 */
const SAMPLE_TEXT =
	'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Common inline style applied to every probe element so measurement does
 * not affect layout and the probe is not painted.
 */
const PROBE_STYLE =
	'position: absolute; visibility: hidden; white-space: nowrap;';

/**
 * Read the CSS font properties that should be used for measurement.
 *
 * Looks up the active editor's `.cm-content` element first (this is the
 * element whose font actually governs line wrapping in the editor) and
 * falls back to `document.body` when no editor is mounted yet.
 *
 * @returns The `font-family` and `font-size` CSS strings, or `null` if
 * neither element could be resolved.
 */
function readEditorFont(): { fontFamily: string; fontSize: string } | null {
	const cmContent = document.querySelector<HTMLElement>('.cm-content');
	const source = cmContent ?? document.body;
	if (!source) {
		return null;
	}
	const computed = window.getComputedStyle(source);
	const fontFamily = computed.fontFamily;
	const fontSize = computed.fontSize;
	if (!fontFamily || !fontSize) {
		return null;
	}
	return { fontFamily, fontSize };
}

/**
 * Measure the current text geometry of the active editor.
 *
 * Creates two hidden probe elements appended to `document.body`:
 *   - a `<span>` containing a 62-character sample, used to derive the
 *     average character width;
 *   - a `<div>` containing two lines of text (`x<br>x`), used to derive
 *     the line height.
 *
 * Both probes are removed from the DOM before returning. If anything
 * goes wrong (probe cannot be created, measured width/height is 0 or
 * `NaN`), {@link DEFAULT_TEXT_METRICS} is returned so callers always
 * get sane values.
 */
export function measureTextMetrics(): TextMetrics {
	const font = readEditorFont();

	const charWidthPx = measureCharWidth(font);
	const lineHeightPx = measureLineHeight(font);

	if (!isFinitePositive(charWidthPx) || !isFinitePositive(lineHeightPx)) {
		return { ...DEFAULT_TEXT_METRICS };
	}

	return { charWidthPx, lineHeightPx };
}

/**
 * Measure the average width of a single character by rendering the
 * 62-character {@link SAMPLE_TEXT} in a hidden span.
 */
function measureCharWidth(font: {
	fontFamily: string;
	fontSize: string;
} | null): number {
	try {
		const span = createSpan();
		span.setAttribute('style', PROBE_STYLE);
		span.textContent = SAMPLE_TEXT;
		if (font) {
			span.style.fontFamily = font.fontFamily;
			span.style.fontSize = font.fontSize;
		}
		document.body.appendChild(span);
		const width = span.getBoundingClientRect().width;
		document.body.removeChild(span);
		return width / SAMPLE_TEXT.length;
	} catch {
		return 0;
	}
}

/**
 * Measure the height of a single line by rendering two lines of text
 * in a hidden div and dividing the total height by 2.
 */
function measureLineHeight(font: {
	fontFamily: string;
	fontSize: string;
} | null): number {
	try {
		const div = createDiv();
		div.setAttribute('style', PROBE_STYLE);
		div.createSpan({ text: 'X' });
		div.createEl('br');
		div.createSpan({ text: 'X' });
		if (font) {
			div.style.fontFamily = font.fontFamily;
			div.style.fontSize = font.fontSize;
		}
		document.body.appendChild(div);
		const height = div.getBoundingClientRect().height;
		document.body.removeChild(div);
		return height / 2;
	} catch {
		return 0;
	}
}

/** Returns `true` when `n` is a finite, strictly positive number. */
function isFinitePositive(n: number): boolean {
	return typeof n === 'number' && Number.isFinite(n) && n > 0;
}
