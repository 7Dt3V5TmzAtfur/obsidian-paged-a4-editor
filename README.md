# Paged A4 Editor

An [Obsidian](https://obsidian.md) plugin that renders the editor and reading view as paged, A4-style pages with automatic page numbers — like Microsoft Word's **Page Layout** view.

Instead of an endless scrolling document, your notes appear as discrete pages separated by a gray gap, with configurable page size, margins, and page-number styling.

## Features

- **Paged editing view** — the CodeMirror 6 editor is split into visual pages with realistic paper shadows and a gray desktop background between pages.
- **Paged reading view** — reading mode mirrors the editor's pagination using real JS-inserted page breaks (not just CSS), so exported/printable output matches what you see.
- **Character-based sizing** — instead of fixed paper sizes, the page dimensions are derived from how many characters fit on a line and how many lines fit on a page. A one-click **reset to A4 standard** button is provided.
- **Margin presets** — Normal (25.4 mm), Narrow (12.7 mm), or Wide (50.8 mm). Margins are applied to every page, including intermediate ones.
- **Automatic page numbers** — a badge is rendered at every page boundary. Choose the position (bottom-left / center / right) and format (`1`, `Page 1 of n`, `第 1 页`).
- **Responsive to font changes** — page geometry is re-measured automatically when Obsidian's font or appearance settings change.
- **Mobile-aware** — desktop-only APIs are avoided where possible; the plugin still works on mobile but is optimized for desktop (`isDesktopOnly: true`).

## Installation

### From the community plugin directory (once published)

1. Open **Settings → Community plugins**.
2. Search for "Paged A4 Editor".
3. Click **Install**, then **Enable**.

### Manual install

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/7Dt3V5TmzAtfur/obsidian-paged-a4-editor/releases).
2. Copy them into `<vault>/.obsidian/plugins/paged-a4-editor/`.
3. Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Usage

Once enabled, the editor and reading view automatically switch to paged layout. Open **Settings → Paged A4 Editor** to configure:

| Setting | Description | Range |
|---|---|---|
| **Enable paged mode** | Toggle the paged layout on/off. | — |
| **每行字符数 (Chars per line)** | How many characters fit on one line. A reset button restores the A4 standard (80). | 30–300 |
| **每页行数 (Lines per page)** | How many lines fit on one page. A reset button restores the A4 standard (40). | 15–80 |
| **Margin preset** | Page margins around the content area. | Normal / Narrow / Wide |
| **Page number position** | Horizontal placement of the page-number badge. | Bottom left / center / right |
| **Page number format** | Text style of the page number. | `1` / `Page 1 of n` / `第 1 页` |

### A4 standard values

The reset buttons restore the values derived from a standard A4 page (210 × 297 mm) with Normal margins (25.4 mm) and Obsidian's default ~16 px font:

- **80 characters per line**
- **40 lines per page**

## Development

This project uses TypeScript and [esbuild](https://esbuild.github.io/) for bundling.

### Prerequisites

- Node.js 18+ (`node --version`)
- npm

### Setup

```bash
npm install        # install dependencies
npm run dev        # watch mode — recompiles on save
npm run build      # production build (type-check + bundle)
npm run lint       # run ESLint with Obsidian-specific rules
```

### Project structure

```
src/
  main.ts                    # Plugin entry point, lifecycle, CSS variables
  settings.ts                # Settings interface, defaults, and settings tab UI
  editor/
    pagination-plugin.ts     # CodeMirror 6 ViewPlugin for editor pagination
    page-break-widget.ts     # WidgetType rendered between pages
  reading/
    reading-pagination.ts    # Reading-mode pagination manager
  utils/
    page-layout.ts           # Page geometry computation
    page-sizes.ts            # Margin presets and unit conversion
    text-metrics.ts          # DOM-based char width / line height measurement
styles.css                   # All visual styling (page, gap, page numbers)
manifest.json                # Obsidian plugin manifest
```

### How pagination works

The plugin uses a **geometric** pagination strategy: each block's absolute pixel offset (from the start of the content area) is divided by the content height to determine its page index. When the page index increases between consecutive blocks, a page-break widget is inserted. This avoids scanning the entire document — only the visible viewport is measured.

Page geometry is driven by the formula:

```
contentWidthPx  = charsPerLine × charWidthPx
contentHeightPx = linesPerPage × lineHeightPx
```

Where `charWidthPx` and `lineHeightPx` are measured at runtime from the actual editor font via a hidden DOM probe.

## Releasing new releases

- Update `version` in `manifest.json` (Semantic Versioning).
- Update `versions.json` with `"new-plugin-version": "minimum-obsidian-version"`.
- Create a GitHub release using the exact version number as the tag (no `v` prefix).
- Upload `manifest.json`, `main.js`, and `styles.css` as release assets.
- Publish the release.

> Run `npm version patch|minor|major` after updating `minAppVersion` in `manifest.json` — it bumps the version in `manifest.json` and `package.json` and adds the entry to `versions.json`.

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial release.
- Make a pull request at [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) to add your plugin.

## License

See [LICENSE](LICENSE).

## API Documentation

See https://docs.obsidian.md
