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
export { createTyped, type Typed } from "./core";

// Scale utility
export { scaleValue, scaleValues, scaleShorthand, needsScaling, createScaler, scaler, type ScaleValue } from "./scale";

// Generated types from IDL and CSS specs
export * from "./types.gen";
export * from "./properties.gen";
export * from "./functions.gen";

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

// Token system
export {
	token,
	color as colorToken,
	length as lengthToken,
	angle as angleToken,
	time as timeToken,
	percentage as percentageToken,
	number as numberToken,
	integer as integerToken,
	lengthPercentage as lengthPercentageToken,
	anglePercentage as anglePercentageToken,
	timePercentage as timePercentageToken,
	string as stringToken,
	url as urlToken,
	image as imageToken,
	pxToken,
	remToken,
	emToken,
	degToken,
	turnToken,
	secToken,
	msToken,
	set,
	setMultiple,
	style as tokenStyle,
	generatePropertyCSS,
	getRegisteredTokens,
	type Token,
	type TokenType,
	type TokenOptions,
	type TokenDefinition,
	type CSSTypeMap,
	type CSSValueType,
} from "./tokens";

// Class name utilities
export { cn, cx, cva, type CSSintsFn } from "./cn";

// Custom functions (extension point)
export * from "./custom-functions";
