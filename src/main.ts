import { Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	PagedEditorSettingTab,
	PagedEditorSettings,
} from './settings';
import { buildPaginationExtension } from './editor/pagination-plugin';
import { getContentBox } from './utils/page-layout';
import { measureTextMetrics } from './utils/text-metrics';
import { ReadingPaginationManager } from './reading/reading-pagination';

export default class PagedA4EditorPlugin extends Plugin {
	settings!: PagedEditorSettings;
	private readingPagination!: ReadingPaginationManager;

	async onload() {
		await this.loadSettings();

		// Instantiate the reading-mode pagination manager early (after
		// settings are loaded, before applyPagination triggers the first
		// refreshAll). The constructor registers workspace/dom listeners
		// via plugin.register*, so it must be created within onload().
		this.readingPagination = new ReadingPaginationManager(
			this.app,
			this,
			() => this.settings,
		);

		// Register the CM6 pagination extension. The extension reads
		// settings via the closure on every recompute, so we only need
		// to register it once; settings changes are picked up via
		// `app.workspace.updateOptions()` in `applyPagination()`.
		this.registerEditorExtension(
			buildPaginationExtension(() => this.settings),
		);

		// Toggle command (stable id: `toggle-paged-mode`).
		this.addCommand({
			id: 'toggle-paged-mode',
			name: 'Toggle paged mode',
			callback: async () => {
				this.settings.enabled = !this.settings.enabled;
				await this.saveSettings();
				this.applyPagination();
			},
		});

		// Ribbon icon: clicking toggles paged mode.
		this.addRibbonIcon('file-text', 'Toggle paged mode', async () => {
			this.settings.enabled = !this.settings.enabled;
			await this.saveSettings();
			this.applyPagination();
		});

		// Settings tab.
		this.addSettingTab(new PagedEditorSettingTab(this.app, this));

		// Re-measure text metrics and re-paginate when the user changes
		// Obsidian's appearance (font size, font family, theme).
		this.registerEvent(
			this.app.workspace.on('css-change', () => {
				this.applyPagination();
			}),
		);

		// Apply initial pagination state (body class + CSS variables +
		// workspace option refresh so the ViewPlugin re-initializes).
		this.applyPagination();
	}

	onunload() {
		// Tear down reading-mode pagination (observers, timers, inserted
		// page-break elements). Idempotent — safe to call even though the
		// manager also registers its own teardown via plugin.register.
		this.readingPagination.destroyAll();

		// Clean up the body class and inline CSS variables so disabling
		// the plugin fully restores Obsidian's default editor styling.
		document.body.classList.remove('paged-editor-enabled');
		this.clearPagedCssVariables();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PagedEditorSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Re-apply the current settings to the DOM and the editor.
	 *
	 * 1. Toggle the `paged-editor-enabled` body class (drives all CSS).
	 * 2. Inject page-geometry CSS variables onto <body> so the
	 *    stylesheet can size the page without being rebuilt.
	 * 3. Refresh workspace options so the CM6 ViewPlugin is
	 *    re-instantiated with the latest settings.
	 */
	applyPagination() {
		document.body.classList.toggle(
			'paged-editor-enabled',
			this.settings.enabled,
		);

		if (this.settings.enabled) {
			this.applyPagedCssVariables();
		} else {
			this.clearPagedCssVariables();
		}

		// Re-trigger ViewPlugin construction (the plugin reads the
		// settings closure in its constructor and on `update`).
		this.app.workspace.updateOptions();

		// Drive reading-mode pagination: refresh when enabled, clear all
		// inserted page-break elements (and detach observers) when disabled.
		if (this.settings.enabled) {
			this.readingPagination.refreshAll();
		} else {
			this.readingPagination.clearAll();
		}
	}

	private applyPagedCssVariables() {
		const box = getContentBox(
			this.settings.charsPerLine,
			this.settings.linesPerPage,
			this.settings.marginPreset,
			measureTextMetrics(),
		);
		const setVar = (name: string, value: string) =>
			document.body.style.setProperty(name, value);

		setVar('--paged-page-width', `${box.pageWidthPx}px`);
		setVar('--paged-page-height', `${box.pageHeightPx}px`);
		setVar('--paged-margin-top', `${box.marginTopPx}px`);
		setVar('--paged-margin-right', `${box.marginRightPx}px`);
		setVar('--paged-margin-bottom', `${box.marginBottomPx}px`);
		setVar('--paged-margin-left', `${box.marginLeftPx}px`);
	}

	private clearPagedCssVariables() {
		const names = [
			'--paged-page-width',
			'--paged-page-height',
			'--paged-margin-top',
			'--paged-margin-right',
			'--paged-margin-bottom',
			'--paged-margin-left',
		];
		for (const name of names) {
			document.body.style.removeProperty(name);
		}
	}
}
