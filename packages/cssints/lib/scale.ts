/**
 * Scale utility for converting numbers to rem values
 * 
 * Default scale: 0.25rem (4 → "1rem")
 */

export type ScaleValue = number | string;

const DEFAULT_SCALE = 0.25;

/**
 * Convert a number to rem string using scale factor.
 * Strings pass through unchanged.
 */
export function scaleValue(value: ScaleValue, scale = DEFAULT_SCALE): string {
	if (typeof value === "string") {
		return value;
	}
	return `${value * scale}rem`;
}

/**
 * Convert multiple values, joining with space.
 * 
 * @example
 * scaleValues(1, 2)        // → "0.25rem 0.5rem"
 * scaleValues(1, "2rem")   // → "0.25rem 2rem"
 */
export function scaleValues(...values: ScaleValue[]): string {
	return values.map((v) => scaleValue(v)).join(" ");
}

/**
 * Convert 1-4 values for shorthand properties.
 * Mimics CSS shorthand behavior.
 * 
 * @example
 * scaleShorthand(1)        // → "0.25rem"
 * scaleShorthand(1, 2)     // → "0.25rem 0.5rem"
 * scaleShorthand(1, 2, 3)  // → "0.25rem 0.5rem 0.75rem"
 */
export function scaleShorthand(
	v1: ScaleValue,
	v2?: ScaleValue,
	v3?: ScaleValue,
	v4?: ScaleValue,
): string {
	const values = [v1, v2, v3, v4].filter((v) => v !== undefined) as ScaleValue[];
	return scaleValues(...values);
}

/**
 * Check if value is a number (needs scaling).
 */
export function needsScaling(value: ScaleValue): value is number {
	return typeof value === "number";
}

/**
 * Create a custom scaler with a different scale factor.
 */
export function createScaler(scale: number) {
	return {
		scale: (value: ScaleValue) => scaleValue(value, scale),
		scaleValues: (...values: ScaleValue[]) => scaleValues(...values.map((v) => (typeof v === "number" ? v * scale : v))),
		scaleShorthand: (v1: ScaleValue, v2?: ScaleValue, v3?: ScaleValue, v4?: ScaleValue) => {
			const values = [v1, v2, v3, v4].filter((v) => v !== undefined) as ScaleValue[];
			return values.map((v) => scaleValue(v, scale)).join(" ");
		},
	};
}

// Default scaler instance
export const scaler = createScaler(DEFAULT_SCALE);
