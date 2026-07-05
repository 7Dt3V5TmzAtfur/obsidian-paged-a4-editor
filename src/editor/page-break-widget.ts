import { WidgetType } from '@codemirror/view';
import type { PageNumberFormat, PageNumberPosition } from '../settings';

/**
 * A widget rendered between two pages.
 *
 * It renders as a transparent gap (the "desktop" background shows through)
 * with a small page-number badge anchored to the bottom of the gap.
 * The badge displays the number of the page that just ended.
 */
export class PageBreakWidget extends WidgetType {
	constructor(
		/** 1-indexed number of the page that just ended. */
		readonly pageNumber: number,
		/** Total page count (used by the `page-x-of-y` format). */
		readonly total: number,
		/** Horizontal placement of the page-number badge. */
		readonly position: PageNumberPosition,
		/** Text format style of the page number. */
		readonly format: PageNumberFormat,
		/**
		 * Whether this is the end-of-document widget. End widgets have
		 * zero height (the last page's bottom margin is provided by the
		 * sizer's padding-bottom) but still render a page-number badge
		 * positioned inside the padding-bottom area.
		 */
		readonly isEnd: boolean = false,
	) {
		super();
	}

	toDOM(): HTMLElement {
		const wrap = createDiv({ cls: 'paged-editor-page-break' });
		wrap.setAttribute('data-position', this.position);
		if (this.isEnd) {
			wrap.setAttribute('data-end', 'true');
		}

		const num = createSpan({ cls: 'paged-editor-page-number' });
		num.textContent = this.formatPageNumber();
		wrap.appendChild(num);

		return wrap;
	}

	/** Format the page-number text according to the configured style. */
	formatPageNumber(): string {
		if (this.format === 'chinese') {
			return `第 ${this.pageNumber} 页`;
		}
		if (this.format === 'page-x-of-y') {
			return `Page ${this.pageNumber} of ${this.total}`;
		}
		return String(this.pageNumber);
	}

	/** Ignore all DOM events so the editor keeps focus. */
	ignoreEvent(): boolean {
		return true;
	}
}
