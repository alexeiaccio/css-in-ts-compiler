/**
 * DTCG (Design Tokens Community Group) Format Types
 * 
 * Based on W3C DTCG specification 2025.10
 * https://www.designtokens.org/TR/2025.10/format/
 */

// ============================================================================
// Token Types
// ============================================================================

/** DTCG token types from the spec */
export type DTCGTokenType =
	| "color"
	| "dimension"
	| "duration"
	| "fontFamily"
	| "fontWeight"
	| "number"
	| "string"
	| "cubicBezier"
	| "border"
	| "shadow"
	| "gradient"
	| "typography"
	| "strokeStyle"
	| "transition"
	| "link";

// ============================================================================
// Token Structure
// ============================================================================

/** Base DTCG token with $value and optional metadata */
export interface DTCGToken<V = unknown> {
	$type?: DTCGTokenType;
	$value: V;
	$description?: string;
	$extensions?: Record<string, unknown>;
}

/** DTCG group - contains tokens or nested groups */
export interface DTCGGroup extends Record<string, DTCGToken | DTCGGroup | DTCGTokenType | string | undefined> {
	$type?: DTCGTokenType;
	$description?: string;
}

// ============================================================================
// Token Value Types
// ============================================================================

/** Color token value - hex, rgb, hsl, oklch, etc. */
export type ColorTokenValue = string;

/** Dimension token value - with unit like "4px", "1rem" */
export type DimensionTokenValue = `${number}px` | `${number}rem` | `${number}em` | `${number}vw` | `${number}vh` | `${number}%` | `${number}pt` | string;

/** Duration token value - like "100ms", "0.5s" */
export type DurationTokenValue = `${number}ms` | `${number}s`;

/** Font weight value - number or named weight */
export type FontWeightTokenValue = number | "normal" | "bold" | "lighter" | "bolder" | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** Number token value */
export type NumberTokenValue = number;

/** Cubic bezier - 4 numbers for CSS cubic-bezier() */
export type CubicBezierTokenValue = [number, number, number, number];

/** Stroke style - line style pattern */
export type StrokeStyleTokenValue = "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge" | "inset" | "outset" | "none";

/** Shadow token - can be single or multiple shadows */
export type ShadowTokenValue = ShadowDefinition | ShadowDefinition[];

interface ShadowDefinition {
	color: string;
	offsetX: DimensionTokenValue;
	offsetY: DimensionTokenValue;
	blur: DimensionTokenValue;
	spread: DimensionTokenValue;
	inset?: boolean;
}

/** Gradient token */
export type GradientTokenValue = LinearGradient | RadialGradient | ConicGradient;

interface GradientStop {
	color: string;
	position: number | string;
}

interface LinearGradient {
	gradientType: "linear";
	angle: number;
	stops: GradientStop[];
}

interface RadialGradient {
	gradientType: "radial";
	stops: GradientStop[];
}

interface ConicGradient {
	gradientType: "conic";
	angle?: number;
	position?: string;
	stops: GradientStop[];
}

// ============================================================================
// Specialized Token Interfaces
// ============================================================================

export interface ColorToken extends DTCGToken<ColorTokenValue> {
	$type: "color";
}

export interface DimensionToken extends DTCGToken<DimensionTokenValue> {
	$type: "dimension";
}

export interface DurationToken extends DTCGToken<DurationTokenValue> {
	$type: "duration";
}

export interface NumberToken extends DTCGToken<NumberTokenValue> {
	$type: "number";
}

export interface FontFamilyToken extends DTCGToken<string | string[]> {
	$type: "fontFamily";
}

export interface FontWeightToken extends DTCGToken<FontWeightTokenValue> {
	$type: "fontWeight";
}

export interface CubicBezierToken extends DTCGToken<CubicBezierTokenValue> {
	$type: "cubicBezier";
}

export interface ShadowToken extends DTCGToken<ShadowTokenValue> {
	$type: "shadow";
}

export interface GradientToken extends DTCGToken<GradientTokenValue> {
	$type: "gradient";
}
