/**
 * CSS-in-TS - Type-safe CSS with Parcel macros and LightningCSS
 *
 * Usage: import * as css from "cssints" with { type: "cssints" };
 */

// Re-export LightningCSS AST types
export type * from "./ast/index.js";

// Export branded types
export type {
	LengthValue,
	AngleValue,
	TimeValue,
	ResolutionValue,
	ColorValue,
	Pixels,
	Rems,
	Ems,
	Percent,
	ViewportWidth,
	ViewportHeight,
	ContainerWidth,
	ContainerHeight,
	FontUnits,
	AbsoluteUnits,
	Degrees,
	Radians,
	Gradians,
	Turns,
	Seconds,
	Milliseconds,
	Dpi,
	Dpcm,
	Dppx,
	HexColor,
	NamedColor,
	CalcExpression,
} from "./types/values.js";

// Export calc functions
export { calc, min, max, clamp, type CalcValue, type CalcOperator } from "./calc.js";

// Export branded color functions
export { rgb, hsl, oklch, oklab, hex, colorMix, lightDark, type BrandedColor, type ColorError } from "./color.js";

// Export token system
export { token, type TokenRef, type TokenOptions } from "./tokens.js";

// Export property API
export { property, propertyOf, type PropertyDefinition } from "./property.js";

// Export variant macro functions
export {
	cv,
	scv,
	sv,
	ssv,
	cx,
	cn,
	type VariantConfig,
	type SlotVariantConfig,
	type StyleVariantConfig,
	type ClassValue,
	type ClassDictionary,
	type ClassArray,
} from "./variants.js";
