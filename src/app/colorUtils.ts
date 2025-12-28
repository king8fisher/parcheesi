import { rgb2oklab, oklab2rgb, type Rgb } from "precise-colors";

/**
 * Convert a hex number (0xRRGGBB) to an Rgb object
 */
export function hexToRgb(hex: number): Rgb {
	return {
		r: (hex >> 16) & 0xff,
		g: (hex >> 8) & 0xff,
		b: hex & 0xff,
	};
}

/**
 * Convert RGB values (0-255 each) to a hex number (0xRRGGBB)
 */
export function rgbToHex(r: number, g: number, b: number): number {
	return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

/**
 * Convert a hex number to a CSS hex string '#RRGGBB'
 * Replacement for @pixi/core utils.hex2string
 */
export function hex2string(hex: number): string {
	const str = hex.toString(16).padStart(6, '0');
	return `#${str}`;
}

/**
 * Parse an rgb string like 'rgb(r,g,b)' or '#RRGGBB' to a hex number
 */
export function parseRgbString(str: string): number {
	const rgbMatch = str.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
	if (rgbMatch) {
		return rgbToHex(
			parseInt(rgbMatch[1], 10),
			parseInt(rgbMatch[2], 10),
			parseInt(rgbMatch[3], 10)
		);
	}

	const hexMatch = str.match(/^#?([0-9a-fA-F]{6})$/);
	if (hexMatch) {
		return parseInt(hexMatch[1], 16);
	}

	throw new Error(`Cannot parse color string: ${str}`);
}

/**
 * Create a color from an rgb string and return it as a hex number
 * Replacement for Color.rgb('rgb(r,g,b)').rgbNumber()
 */
export function rgb(str: string): number {
	return parseRgbString(str);
}

/**
 * Lighten a color by the given amount (0-1) using Oklab color space
 * for perceptually uniform lightening.
 * amount=0.2 means 20% lighter
 */
export function lighten(hex: number, amount: number): number {
	const rgbColor = hexToRgb(hex);
	const oklab = rgb2oklab(rgbColor);
	// Increase lightness (oklab.l is 0-1)
	const newL = Math.min(1, oklab.l + amount * (1 - oklab.l));
	const result = oklab2rgb({ l: newL, a: oklab.a, b: oklab.b });
	return rgbToHex(
		Math.round(Math.max(0, Math.min(255, result.r))),
		Math.round(Math.max(0, Math.min(255, result.g))),
		Math.round(Math.max(0, Math.min(255, result.b)))
	);
}

/**
 * Mix two colors together
 * ratio=0 returns color1, ratio=1 returns color2
 */
export function mix(color1: number, color2: number, ratio: number): number {
	const c1 = hexToRgb(color1);
	const c2 = hexToRgb(color2);

	return rgbToHex(
		Math.round(c1.r + (c2.r - c1.r) * ratio),
		Math.round(c1.g + (c2.g - c1.g) * ratio),
		Math.round(c1.b + (c2.b - c1.b) * ratio)
	);
}
