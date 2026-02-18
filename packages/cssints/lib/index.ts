/**
 * CSS-in-TS Library
 *
 * Type-safe CSS utilities with:
 * - Generated CSS types from mdn-data
 * - Generated CSS functions from @webref/css
 * - Generated CSS properties from @webref/css
 * - Composable utilities (flex, grid, etc.)
 */

// Core type system
export { createTyped, type Typed } from "./typed";

// Unit helpers
export {
	number, deg, rad, grad, turn,
	px, rem, em, ch, vh, vw, vmin, vmax, pct,
	s, ms,
	zero, angle, length,
} from "./typed";

// Unit types
export type {
	Angle, Length, Number, Zero, None,
	Deg, Rad, Grad, Turn,
	Px, Rem, Em, Ch, Vh, Vw, Vmin, Vmax,
	Cap, Ex, Ic, Lh, Rcap, Rch, Rex, Rlh,
	Cqw, Cqh, Cqi, Cqb, Cqmin, Cqmax,
	Vb, Vi, Dvw, Cm, Mm, Q, In, Pc, Pt,
	Seconds, Milliseconds,
} from "./typed";

// Value types
export type {
	Percentage, LengthPercentage, CSSNumber, Integer,
	Color, Time, Frequency, Resolution, Flex, URL, Image,
	Position, TransformFunction, TransformList, CSSString,
	CustomIdent, Identifier, Ratio, CalcSum, CalcProduct,
	Dimension, AnyValue, DeclarationValue, Auto, ContentBox, OverflowValue,
	DisplayBox, DisplayInside, DisplayOutside, DisplayInternal,
	FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent, AlignSelf,
	FontFamily, FontSize, FontWeight, FontStyle, LineHeight,
	TextAlign, TextDecoration, TextTransform,
	BorderStyle, BorderWidth, BorderRadius,
	BackgroundColor, BackgroundImage, BackgroundRepeat, BackgroundAttachment, BackgroundPosition, BackgroundSize,
	EasingFunction, AnimationDirection, AnimationFillMode, AnimationIterationCount, AnimationPlayState, SingleTransition,
	BoxShadow, TextShadow,
	Brightness, Contrast, DropShadow, Grayscale, Invert, OpacityFilter, Saturate, Sepia, FilterFunction,
} from "./value-types";
export { CSS_TYPE_MAP, CSS_KEYWORDS, getTSType } from "./value-types";

// Scale utility
export { scaleValue, scaleValues, scaleShorthand, needsScaling, createScaler, scaler, type ScaleValue } from "./scale";

// Generated CSS functions
export * from "./generated-functions";

// Generated CSS properties  
export * from "./generated-props";

// Composable utilities
export {
	// Flex
	flex, items, justify, direction, wrap, gap, rowGap, colGap,
	// Grid
	grid, cols, rows, areas,
	// Positioning
	absolute, relative, fixed, sticky, insetAll, top, right, bottom, left,
	// Sizing
	w, h, minW, maxW, minH, maxH,
	// Text
	text, font, weight, leading, size,
	// Overflow
	overflow, overflowX, overflowY, hidden, scroll,
	// Display
	display, block, inline, none,
	// Margin & Padding
	m, p, mx, my, padX, padY,
	type CSSProperties, type FlexUtil, type GridUtil, type PositionUtil, type SizeUtil, type TextUtil, type OverflowUtil,
} from "./composables";

// Filter functions
export { blur, hueRotate, filter, minHeight, style } from "./typed";
export type { Blur, HueRotate, Url, FilterValueList, Filter, Style } from "./typed";

// Custom functions (extension point)
export * from "./custom-functions";
