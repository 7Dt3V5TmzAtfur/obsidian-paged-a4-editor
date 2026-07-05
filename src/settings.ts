import {
	App,
	PluginSettingTab,
	Setting,
	SliderComponent,
	TextComponent,
} from 'obsidian';
import type PagedA4EditorPlugin from './main';
import type { MarginPreset } from './utils/page-sizes';

/** Page number rendering position relative to the page bottom. */
export type PageNumberPosition =
	| 'bottom-center'
	| 'bottom-right'
	| 'bottom-left';

/** Page number formatting style. */
export type PageNumberFormat = 'number' | 'page-x-of-y' | 'chinese';

/** Persisted plugin configuration. */
export interface PagedEditorSettings {
	/** Whether paged mode is currently enabled. */
	enabled: boolean;
	/** Number of characters per line in the page content area. */
	charsPerLine: number;
	/** Number of lines per page. */
	linesPerPage: number;
	/** Margin preset around each page. */
	marginPreset: MarginPreset;
	/** Horizontal placement of the page number badge. */
	pageNumberPosition: PageNumberPosition;
	/** Format style of the page number text. */
	pageNumberFormat: PageNumberFormat;
}

export const DEFAULT_SETTINGS: PagedEditorSettings = {
	enabled: true,
	charsPerLine: 80,
	linesPerPage: 40,
	marginPreset: 'normal',
	pageNumberPosition: 'bottom-center',
	pageNumberFormat: 'number',
};

/**
 * Standard A4 reference values (210×297 mm, normal 25.4 mm margins,
 * ~16 px default font). Content area ≈ 602×930 px → ~80 chars/line,
 * ~40 lines/page. Used by the reset buttons on the char/line settings.
 */
const A4_CHARS_PER_LINE = 80;
const A4_LINES_PER_PAGE = 40;

export class PagedEditorSettingTab extends PluginSettingTab {
	plugin: PagedA4EditorPlugin;

	constructor(app: App, plugin: PagedA4EditorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable paged mode')
			.setDesc('Render the editor as a sequence of paged pages.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					}),
			);

		// Chars per line: slider + number text, two-way synced.
		let charsSlider: SliderComponent | undefined;
		let charsText: TextComponent | undefined;
		new Setting(containerEl)
			.setName('每行字符数')
			.setDesc('每页内容区每行可显示的字符数量。')
			.addSlider((slider) => {
				charsSlider = slider;
				return slider
					.setLimits(30, 300, 1)
					.setValue(this.plugin.settings.charsPerLine)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.charsPerLine = value;
						charsText?.setValue(String(value));
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					});
			})
			.addText((text) => {
				charsText = text;
				text.inputEl.type = 'number';
				return text
					.setValue(String(this.plugin.settings.charsPerLine))
					.onChange(async (value) => {
						const num = Math.round(Number(value));
						if (!Number.isNaN(num)) {
							const clamped = Math.min(300, Math.max(30, num));
							this.plugin.settings.charsPerLine = clamped;
							charsSlider?.setValue(clamped);
							await this.plugin.saveSettings();
							this.plugin.applyPagination();
						}
					});
			})
			.addExtraButton((button) =>
				button
					.setIcon('rotate-ccw')
					.setTooltip('A4 标准值（80 字符/行）')
					.onClick(async () => {
						this.plugin.settings.charsPerLine =
							A4_CHARS_PER_LINE;
						charsSlider?.setValue(A4_CHARS_PER_LINE);
						charsText?.setValue(String(A4_CHARS_PER_LINE));
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					}),
			);

		// Lines per page: slider + number text, two-way synced.
		let linesSlider: SliderComponent | undefined;
		let linesText: TextComponent | undefined;
		new Setting(containerEl)
			.setName('每页行数')
			.setDesc('每页可显示的行数。')
			.addSlider((slider) => {
				linesSlider = slider;
				return slider
					.setLimits(15, 80, 1)
					.setValue(this.plugin.settings.linesPerPage)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.linesPerPage = value;
						linesText?.setValue(String(value));
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					});
			})
			.addText((text) => {
				linesText = text;
				text.inputEl.type = 'number';
				return text
					.setValue(String(this.plugin.settings.linesPerPage))
					.onChange(async (value) => {
						const num = Math.round(Number(value));
						if (!Number.isNaN(num)) {
							const clamped = Math.min(80, Math.max(15, num));
							this.plugin.settings.linesPerPage = clamped;
							linesSlider?.setValue(clamped);
							await this.plugin.saveSettings();
							this.plugin.applyPagination();
						}
					});
			})
			.addExtraButton((button) =>
				button
					.setIcon('rotate-ccw')
					.setTooltip('A4 标准值（40 行/页）')
					.onClick(async () => {
						this.plugin.settings.linesPerPage =
							A4_LINES_PER_PAGE;
						linesSlider?.setValue(A4_LINES_PER_PAGE);
						linesText?.setValue(String(A4_LINES_PER_PAGE));
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					}),
			);

		new Setting(containerEl)
			.setName('Margin preset')
			.setDesc('Page margins around the writable content area.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('normal', 'Normal (25.4 mm)')
					.addOption('narrow', 'Narrow (12.7 mm)')
					.addOption('wide', 'Wide (50.8 mm)')
					.setValue(this.plugin.settings.marginPreset)
					.onChange(async (value) => {
						this.plugin.settings.marginPreset =
							value as MarginPreset;
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					}),
			);

		new Setting(containerEl)
			.setName('Page number position')
			.setDesc('Where the page number badge is rendered.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('bottom-center', 'Bottom center')
					.addOption('bottom-right', 'Bottom right')
					.addOption('bottom-left', 'Bottom left')
					.setValue(this.plugin.settings.pageNumberPosition)
					.onChange(async (value) => {
						this.plugin.settings.pageNumberPosition =
							value as PageNumberPosition;
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					}),
			);

		new Setting(containerEl)
			.setName('Page number format')
			.setDesc('Text style of the page number.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('number', '1')
					.addOption('page-x-of-y', 'Page 1 of n')
					.addOption('chinese', '第 1 页')
					.setValue(this.plugin.settings.pageNumberFormat)
					.onChange(async (value) => {
						this.plugin.settings.pageNumberFormat =
							value as PageNumberFormat;
						await this.plugin.saveSettings();
						this.plugin.applyPagination();
					}),
			);
	}
}
