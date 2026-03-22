/**
 * CSS-in-TS - Type-safe CSS with oxc-macro
 *
 * Usage:
 * import { display, p, bg, color } from "cssints" with { type: "macro" };
 * import { cx, cn } from "cssints";
 * import { cv, _cv } from "cssints" with { type: "macro" };
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
	_cv,
	scv,
	sv,
	ssv,
	cx,
	cn,
	type VariantConfig,
	type CvRuntimeConfig,
	type SlotVariantConfig,
	type StyleVariantConfig,
	type ClassValue,
	type ClassDictionary,
	type ClassArray,
} from "./variants.js";

// Export CSS property functions (for use with oxc-macro)
export {
	display,
	position,
	flex,
	flexDirection,
	flexGrow,
	flexShrink,
	items,
	justify,
	gap,
	flexWrap,
	width,
	height,
	maxWidth,
	maxHeight,
	overflow,
	padding,
	paddingTop,
	paddingRight,
	paddingBottom,
	paddingLeft,
	margin,
	marginTop,
	marginRight,
	marginBottom,
	marginLeft,
	fontSize,
	fontWeight,
	fontFamily,
	lineHeight,
	letterSpacing,
	textAlign,
	textDecoration,
	textTransform,
	whiteSpace,
	color,
	bg,
	background,
	border,
	borderColor,
	borderWidth,
	borderStyle,
	borderRadius,
	boxShadow,
	opacity,
	transition,
	transform,
	cursor,
	zIndex,
	p,
	pt,
	pr,
	pb,
	pl,
	m,
	mt,
	mr,
	mb,
	ml,
} from "./css.js";
