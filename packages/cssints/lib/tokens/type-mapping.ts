/**
 * Type mapping from DTCG token types to CSS value types
 */

import type {
	Color,
	Length,
	Angle,
	Time,
	Percentage,
	CSSNumber,
	CSSInteger,
	Frequency,
	Resolution,
	LengthPercentage,
	AnglePercentage,
	TimePercentage,
} from "../generated-types";
import type { DTCGTokenType } from "./dtcg-types";

// ============================================================================
// DTCG to CSS Type Mapping
// ============================================================================

/** Map DTCG token types to our CSS types */
export type DTCGToCSSTypeMap = {
	color: Color;
	dimension: Length;
	duration: Time;
	fontFamily: string;
	fontWeight: CSSNumber;
	number: CSSNumber;
	string: string;
	cubicBezier: string; // cubic-bezier(x,x,x,x)
	border: string; // Border shorthand
	shadow: string; // Box-shadow value
	gradient: string; // Gradient value
	typography: string; // CSS shorthand
	strokeStyle: string; // border-style value
	transition: string; // transition shorthand
	link: string; // URL
};

/** Convert DTCG type to CSS type */
export type DTCGToCSS<T extends DTCGTokenType> = 
	T extends keyof DTCGToCSSTypeMap 
		? DTCGToCSSTypeMap[T] 
		: string;

// ============================================================================
// @property Syntax Mapping
// ============================================================================

/** CSS @property syntax strings for each token type */
export const tokenTypeToPropertySyntax: Record<DTCGTokenType, string> = {
	color: "<color>",
	dimension: "<length>",
	duration: "<time>",
	fontFamily: "*",
	fontWeight: "<number>",
	number: "<number>",
	string: "<string>",
	cubicBezier: "<string>",
	border: "*",
	shadow: "<shadow>",
	gradient: "<image>",
	typography: "*",
	strokeStyle: "<line-style>",
	transition: "<transition>",
	link: "<url>",
};

// ============================================================================
// Value Parsing
// ============================================================================

/**
 * Detect DTCG token type from value (runtime fallback)
 */
export function detectTokenType(value: unknown): DTCGTokenType | null {
	if (typeof value !== "string") {
		return typeof value === "number" ? "number" : null;
	}

	// Color detection (hex, rgb, hsl, oklch, etc.)
	if (/^#[0-9A-Fa-f]{3,8}$/.test(value) || 
		/^(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb)/i.test(value) ||
		/^(transparent|currentcolor)/i.test(value) ||
		/^\w+$/i.test(value)) {
		return "color";
	}

	// Dimension detection (with units)
	if (/^-?\d+(\.\d+)?(px|rem|em|vw|vh|vmin|vmax|%|pt|cm|mm|in|pc)$/.test(value)) {
		return "dimension";
	}

	// Duration detection
	if (/^-?\d+(\.\d+)?(ms|s)$/.test(value)) {
		return "duration";
	}

	// Number detection (no units)
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return "number";
	}

	// Font weight keywords
	if (/^(normal|bold|lighter|bolder)$/i.test(value)) {
		return "fontWeight";
	}

	// Stroke style
	if (/^(solid|dashed|dotted|double|groove|ridge|inset|outset|none)$/i.test(value)) {
		return "strokeStyle";
	}

	// Cubic bezier (simple detection)
	if (/^cubic-bezier\(/i.test(value)) {
		return "cubicBezier";
	}

	// Shadow (simple detection)
	if (/inset/i.test(value) || /\d+(px|rem|em).+\d+(px|rem|em).+\d+/.test(value)) {
		return "shadow";
	}

	// Gradient detection
	if (/^(linear|radial|conic)-gradient\(/i.test(value)) {
		return "gradient";
	}

	// Transition detection
	if (/\d+(ms|s)\s+(ease|ease-in|ease-out|linear)/i.test(value)) {
		return "transition";
	}

	// URL/link detection
	if (/^(url|file|http)/i.test(value)) {
		return "link";
	}

	return null;
}

/**
 * Convert token value to CSS string representation
 */
export function normalizeTokenValue(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);
	if (Array.isArray(value)) return value.join(", ");
	return String(value);
}
