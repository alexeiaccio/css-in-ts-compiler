// Core API functions

import type { CSSProperties, MediaQueries, MediaFunctions, SizeUtilities, SizeScale } from "./types";

// Default scale: 0.25rem per unit (4px)
const DEFAULT_SCALE = 0.25;

// Convert value to CSS unit
const toUnit = (value: number): string => `${value * DEFAULT_SCALE}rem`;

// Create size-based utility functions
export function createSizes(scale: number = DEFAULT_SCALE): SizeUtilities {
	const toScaleUnit = (value: number): string => `${value * scale}rem`;

	return {
		// Padding
		p: (value: number): CSSProperties => ({ padding: toScaleUnit(value) }),
		px: (value: number): CSSProperties => ({ paddingX: toScaleUnit(value) }),
		py: (value: number): CSSProperties => ({ paddingY: toScaleUnit(value) }),
		pt: (value: number): CSSProperties => ({ paddingTop: toScaleUnit(value) }),
		pr: (value: number): CSSProperties => ({ paddingRight: toScaleUnit(value) }),
		pb: (value: number): CSSProperties => ({ paddingBottom: toScaleUnit(value) }),
		pl: (value: number): CSSProperties => ({ paddingLeft: toScaleUnit(value) }),

		// Margin
		m: (value: number): CSSProperties => ({ margin: toScaleUnit(value) }),
		mx: (value: number): CSSProperties => ({ marginX: toScaleUnit(value) }),
		my: (value: number): CSSProperties => ({ marginY: toScaleUnit(value) }),
		mt: (value: number): CSSProperties => ({ marginTop: toScaleUnit(value) }),
		mr: (value: number): CSSProperties => ({ marginRight: toScaleUnit(value) }),
		mb: (value: number): CSSProperties => ({ marginBottom: toScaleUnit(value) }),
		ml: (value: number): CSSProperties => ({ marginLeft: toScaleUnit(value) }),

		// Width/Height
		w: (value: number): CSSProperties => ({ width: toScaleUnit(value) }),
		h: (value: number): CSSProperties => ({ height: toScaleUnit(value) }),
		maxW: (value: number): CSSProperties => ({ maxWidth: toScaleUnit(value) }),
		maxH: (value: number): CSSProperties => ({ maxHeight: toScaleUnit(value) }),
		minW: (value: number): CSSProperties => ({ minWidth: toScaleUnit(value) }),
		minH: (value: number): CSSProperties => ({ minHeight: toScaleUnit(value) }),

		// Gap
		gap: (value: number): CSSProperties => ({ gap: toScaleUnit(value) }),
		gapX: (value: number): CSSProperties => ({ columnGap: toScaleUnit(value) }),
		gapY: (value: number): CSSProperties => ({ rowGap: toScaleUnit(value) }),

		// Font size
		text: (value: number): CSSProperties => ({ fontSize: toScaleUnit(value) }),

		// Border radius
		rounded: (value: number): CSSProperties => ({ borderRadius: toScaleUnit(value) }),
		roundedT: (value: number): CSSProperties => ({
			borderTopLeftRadius: toScaleUnit(value),
			borderTopRightRadius: toScaleUnit(value),
		}),
		roundedB: (value: number): CSSProperties => ({
			borderBottomLeftRadius: toScaleUnit(value),
			borderBottomRightRadius: toScaleUnit(value),
		}),
		roundedL: (value: number): CSSProperties => ({
			borderTopLeftRadius: toScaleUnit(value),
			borderBottomLeftRadius: toScaleUnit(value),
		}),
		roundedR: (value: number): CSSProperties => ({
			borderTopRightRadius: toScaleUnit(value),
			borderBottomRightRadius: toScaleUnit(value),
		}),

		// Border width
		border: (value: number): CSSProperties => ({ borderWidth: `${value}px` }),
		borderT: (value: number): CSSProperties => ({ borderTopWidth: `${value}px` }),
		borderB: (value: number): CSSProperties => ({ borderBottomWidth: `${value}px` }),
		borderL: (value: number): CSSProperties => ({ borderLeftWidth: `${value}px` }),
		borderR: (value: number): CSSProperties => ({ borderRightWidth: `${value}px` }),

		// Spacing (negative values)
		"-p": (value: number): CSSProperties => ({ padding: `-${toScaleUnit(value)}` }),
		"-m": (value: number): CSSProperties => ({ margin: `-${toScaleUnit(value)}` }),
		"-mx": (value: number): CSSProperties => ({ marginX: `-${toScaleUnit(value)}` }),
		"-my": (value: number): CSSProperties => ({ marginY: `-${toScaleUnit(value)}` }),
	};
}

// Create media query functions
export function createMedia(queries: MediaQueries): MediaFunctions {
	const functions: MediaFunctions = {};

	for (const [key, query] of Object.entries(queries)) {
		functions[key] = (props: CSSProperties): CSSProperties => ({
			[`@media ${query}`]: props,
		});
	}

	return functions;
}

// Compose utilities into a className
export function cx(...utilities: CSSProperties[]): string {
	// For now, return a simple hash-based className
	// In a full implementation, this would:
	// 1. Merge all CSS properties
	// 2. Generate a unique className based on the properties
	// 3. Register the class in a global registry
	// 4. Handle class ordering and deduplication

	const merged = utilities.reduce(
		(acc, props) => ({
			...acc,
			...props,
		}),
		{} as CSSProperties,
	);

	// Simple hash for demo purposes
	const hash = Object.entries(merged)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${key}:${value}`)
		.join("|");

	return `css-${hash.slice(0, 8)}`;
}

// Default media queries (Tailwind-style)
export const defaultMediaQueries: MediaQueries = {
	sm: "screen and (min-width: 640px)",
	md: "screen and (min-width: 768px)",
	lg: "screen and (min-width: 1024px)",
	xl: "screen and (min-width: 1280px)",
	xxl: "screen and (min-width: 1536px)",
};
