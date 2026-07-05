/**
 * Page geometry helpers: mm-to-px conversion and page margin presets.
 */

/** Conversion factor: 1mm in CSS pixels at 96dpi. */
export const MM_TO_PX = 96 / 25.4; // ≈ 3.7795

export type MarginPreset = 'normal' | 'narrow' | 'wide';

export interface MarginMm {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/** Page margins (in millimeters) for each preset. */
export const MARGINS_MM: Record<MarginPreset, MarginMm> = {
	normal: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
	narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
	wide: { top: 50.8, right: 50.8, bottom: 50.8, left: 50.8 },
};
