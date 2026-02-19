/**
 * CSS Value Type Taxonomy
 *
 * Maps MDN CSS value definition syntax types to TypeScript types.
 * Based on: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Types
 *
 * This serves as the bridge between:
 * - MDN value syntax (e.g., "<length>", "<color>", "<angle>")
 * - TypeScript types from typed.ts (e.g., Length, Color, Angle)
 */

// Define unit types locally (previously imported from generated-types)
export type Px = `${number}px`;
export type Rem = `${number}rem`;
export type Em = `${number}em`;
export type Ch = `${number}ch`;
export type Vw = `${number}vw`;
export type Vh = `${number}vh`;
export type Vmin = `${number}vmin`;
export type Vmax = `${number}vmax`;
export type Deg = `${number}deg`;
export type Rad = `${number}rad`;
export type Grad = `${number}grad`;
export type Turn = `${number}turn`;
export type Angle = number | Deg | Rad | Grad | Turn;
export type Cap = `${number}cap`;
export type Ex = `${number}ex`;
export type Ic = `${number}ic`;
export type Lh = `${number}lh`;
export type Rcap = `${number}rcap`;
export type Rch = `${number}rch`;
export type Rex = `${number}rex`;
export type Rlh = `${number}rlh`;
export type Vb = `${number}vb`;
export type Vi = `${number}vi`;
export type Cqw = `${number}cqw`;
export type Cqh = `${number}cqh`;
export type Cqi = `${number}cqi`;
export type Cqb = `${number}cqb`;
export type Cqmin = `${number}cqmin`;
export type Cqmax = `${number}cqmax`;
export type Cm = `${number}cm`;
export type Mm = `${number}mm`;
export type Q = `${number}q`;
export type In = `${number}in`;
export type Pc = `${number}pc`;
export type Pt = `${number}pt`;

// ============================================================================
// Primitive CSS Types (mapped to TS types)
// ============================================================================

/** <angle> - Angle values (deg, rad, grad, turn) */

/** <length> - Distance values */
export type Length =
	| number
	| Cap
	| Ch
	| Em
	| Ex
	| Ic
	| Lh
	| Rcap
	| Rch
	| Rem
	| Rex
	| Rlh
	| Vh
	| Vw
	| Vmax
	| Vmin
	| Vb
	| Vi
	| Cqw
	| Cqh
	| Cqi
	| Cqb
	| Cqmin
	| Cqmax
	| Px
	| Cm
	| Mm
	| Q
	| In
	| Pc
	| Pt;

/** <percentage> - Percentage values */
export type Percentage = `${number}%`;

/** <length-percentage> - Length or percentage */
export type LengthPercentage = Length | Percentage;

/** <angle-percentage> - Angle or percentage */
export type AnglePercentage = Angle | Percentage;

/** <time-percentage> - Time or percentage */
export type TimePercentage = Time | Percentage;

/** <number> - Numeric values */
export type CSSNumber = number;

/** <integer> - Integer values */
export type Integer = number;

/** <color> - Color values (named, hex, rgb, hsl, oklch, etc.) */
export type Color =
	| string // Named colors, hex
	| `rgb(${number}, ${number}, ${number})`
	| `rgb(${number}, ${number}, ${number}, ${number})`
	| `rgba(${number}, ${number}, ${number}, ${number})`
	| `hsl(${number}, ${Percentage}, ${Percentage})`
	| `hsla(${number}, ${Percentage}, ${Percentage}, ${number})`
	| `oklch(${number} ${number} ${number})`
	| `oklab(${number} ${number} ${number})`
	| `color(${string})`;

/** <time> - Time values (s, ms) */
export type Time = `${number}s` | `${number}ms`;

/** <frequency> - Frequency values (Hz, kHz) */
export type Frequency = `${number}Hz` | `${number}kHz`;

/** <resolution> - Resolution values (dpi, dpcm, dppx) */
export type Resolution = `${number}dpi` | `${number}dpcm` | `${number}dppx`;

/** <flex> - Flex values (fr) */
export type Flex = `${number}fr`;

/** <url> - URL values */
export type URL = `url(${string})`;

/** <image> - Image values */
export type Image = URL | `image(${string})` | `${string}-gradient(${string})`;

/** <position> - Position values */
export type Position = string;

/** <transform-function> - Transform functions */
export type TransformFunction = string;

/** <transform-list> - List of transforms */
export type TransformList = string;

/** <string> - String values */
export type CSSString = string;

/** <custom-ident> - Custom identifier */
export type CustomIdent = string;

/** <identifier> - CSS identifier */
export type Identifier = string;

/** <ratio> - Ratio values (e.g., 16/9) */
export type Ratio = `${number}/${number}` | number;

/** <calc-sum> - Calculation expression */
export type CalcSum = string;

/** <calc-product> - Calculation product */
export type CalcProduct = string;

/** <dimension> - Any dimension value */
export type Dimension = Length | Time | Frequency | Resolution | Angle;

/** <any-value> - Any CSS value */
export type AnyValue = string;

/** <declaration-value> - Declaration value */
export type DeclarationValue = string;

// ============================================================================
// Box Model Types
// ============================================================================

/** <auto> - Auto keyword */
export type Auto = "auto";

/** <content-box> - Content sizing */
export type ContentBox = "content-box" | "border-box";

/** <overflow> - Overflow behavior */
export type OverflowValue = "visible" | "hidden" | "clip" | "scroll" | "auto";

// ============================================================================
// Layout Types
// ============================================================================

/** <display-box> - Display box values */
export type DisplayBox = "block" | "inline" | "run-in";

/** <display-inside> - Display inside values */
export type DisplayInside = "flow" | "flow-root" | "table" | "flex" | "grid" | "ruby";

/** <display-outside> - Display outside values */
export type DisplayOutside = "block" | "inline" | "run-in";

/** <display-internal> - Display internal values */
export type DisplayInternal = string;

/** <flex-direction> - Flex direction */
export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";

/** <flex-wrap> - Flex wrap */
export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

/** <justify-content> - Content justification */
export type JustifyContent = 
	| "flex-start" | "flex-end" | "center" 
	| "space-between" | "space-around" | "space-evenly"
	| "start" | "end" | "left" | "right";

/** <align-items> - Item alignment */
export type AlignItems = "flex-start" | "flex-end" | "center" | "baseline" | "stretch";

/** <align-content> - Content alignment */
export type AlignContent = 
	| "flex-start" | "flex-end" | "center" 
	| "space-between" | "space-around" | "stretch";

/** <align-self> - Self alignment */
export type AlignSelf = "auto" | "flex-start" | "flex-end" | "center" | "baseline" | "stretch";

// ============================================================================
// Typography Types
// ============================================================================

/** <font-family> - Font family */
export type FontFamily = string;

/** <font-size> - Font size */
export type FontSize = Length | Percentage | "xx-small" | "x-small" | "small" | "medium" | "large" | "x-large" | "xx-large" | "larger" | "smaller";

/** <font-weight> - Font weight */
export type FontWeight = "normal" | "bold" | "lighter" | "bolder" | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** <font-style> - Font style */
export type FontStyle = "normal" | "italic" | "oblique";

/** <line-height> - Line height */
export type LineHeight = "normal" | number | Length | Percentage;

/** <text-align> - Text alignment */
export type TextAlign = "start" | "end" | "left" | "right" | "center" | "justify" | "match-parent";

/** <text-decoration> - Text decoration */
export type TextDecoration = "none" | "underline" | "overline" | "line-through";

/** <text-transform> - Text transform */
export type TextTransform = "none" | "capitalize" | "uppercase" | "lowercase" | "full-width";

// ============================================================================
// Border Types
// ============================================================================

/** <border-style> - Border style */
export type BorderStyle = 
	| "none" | "hidden" | "dotted" | "dashed" | "solid" 
	| "double" | "groove" | "ridge" | "inset" | "outset";

/** <border-width> - Border width */
export type BorderWidth = Length | "thin" | "medium" | "thick";

/** <border-radius> - Border radius */
export type BorderRadius = Length | Percentage;

// ============================================================================
// Background Types
// ============================================================================

/** <background-color> - Background color */
export type BackgroundColor = Color;

/** <background-image> - Background image */
export type BackgroundImage = "none" | Image;

/** <background-repeat> - Background repeat */
export type BackgroundRepeat = 
	| "repeat" | "repeat-x" | "repeat-y" | "no-repeat" 
	| "space" | "round" | "repeat-space" | "repeat-round";

/** <background-attachment> - Background attachment */
export type BackgroundAttachment = "scroll" | "fixed" | "local";

/** <background-position> - Background position */
export type BackgroundPosition = string;

/** <background-size> - Background size */
export type BackgroundSize = 
	| "auto" | "cover" | "contain" 
	| LengthPercentage 
	| `${LengthPercentage} ${LengthPercentage}`;

// ============================================================================
// Animation Types
// ============================================================================

/** <easing-function> - Easing function */
export type EasingFunction = 
	| "linear" 
	| "ease" | "ease-in" | "ease-out" | "ease-in-out"
	| `cubic-bezier(${number}, ${number}, ${number}, ${number})`
	| `steps(${number}, ${string})`;

/** <single-animation-direction> - Animation direction */
export type AnimationDirection = "normal" | "reverse" | "alternate" | "alternate-reverse";

/** <single-animation-fill-mode> - Animation fill mode */
export type AnimationFillMode = "none" | "forwards" | "backwards" | "both";

/** <single-animation-iteration-count> - Animation iteration count */
export type AnimationIterationCount = "infinite" | number;

/** <single-animation-play-state> - Animation play state */
export type AnimationPlayState = "running" | "paused";

/** <single-transition> - Single transition */
export type SingleTransition = string;

// ============================================================================
// Shadow Types
// ============================================================================

/** <box-shadow> - Box shadow */
export type BoxShadow = "none" | string;

/** <text-shadow> - Text shadow */
export type TextShadow = "none" | string;

// ============================================================================
// Filter Types
// ============================================================================

/** <blur()> - Blur filter */
export type Blur = `blur(${Length})`;

/** <brightness()> - Brightness filter */
export type Brightness = `brightness(${number | Percentage})`;

/** <contrast()> - Contrast filter */
export type Contrast = `contrast(${number | Percentage})`;

/** <drop-shadow()> - Drop shadow filter */
export type DropShadow = `drop-shadow(${string})`;

/** <grayscale()> - Grayscale filter */
export type Grayscale = `grayscale(${number | Percentage})`;

/** <hue-rotate()> - Hue rotate filter */
export type HueRotate = `hue-rotate(${Angle})`;

/** <invert()> - Invert filter */
export type Invert = `invert(${number | Percentage})`;

/** <opacity()> - Opacity filter */
export type OpacityFilter = `opacity(${number | Percentage})`;

/** <saturate()> - Saturate filter */
export type Saturate = `saturate(${number | Percentage})`;

/** <sepia()> - Sepia filter */
export type Sepia = `sepia(${number | Percentage})`;

/** <filter-function> - Any filter function */
export type FilterFunction = 
	| Blur | Brightness | Contrast | DropShadow 
	| Grayscale | HueRotate | Invert | OpacityFilter 
	| Saturate | Sepia;

// ============================================================================
// MDN Syntax to TypeScript Type Mapping
// ============================================================================

/**
 * Maps MDN CSS syntax type names to TypeScript types.
 * Used by the syntax parser to resolve type references.
 */
export const CSS_TYPE_MAP: Record<string, string> = {
	// Core types
	"<angle>": "Angle",
	"<length>": "Length",
	"<percentage>": "Percentage",
	"<length-percentage>": "LengthPercentage",
	"<number>": "CSSNumber",
	"<integer>": "Integer",
	"<color>": "Color",
	"<time>": "Time",
	"<frequency>": "Frequency",
	"<resolution>": "Resolution",
	"<flex>": "Flex",
	"<url>": "URL",
	"<image>": "Image",
	"<position>": "Position",
	"<transform-function>": "TransformFunction",
	"<transform-list>": "TransformList",
	"<string>": "CSSString",
	"<custom-ident>": "CustomIdent",
	"<identifier>": "Identifier",
	"<ratio>": "Ratio",
	"<calc-sum>": "CalcSum",
	"<calc-product>": "CalcProduct",
	"<dimension>": "Dimension",
	"<any-value>": "AnyValue",
	"<declaration-value>": "DeclarationValue",

	// Box model
	"<auto>": "Auto",
	"<content-box>": "ContentBox",
	"<overflow>": "OverflowValue",

	// Layout
	"<display-box>": "DisplayBox",
	"<display-inside>": "DisplayInside",
	"<display-outside>": "DisplayOutside",
	"<display-internal>": "DisplayInternal",
	"<flex-direction>": "FlexDirection",
	"<flex-wrap>": "FlexWrap",
	"<justify-content>": "JustifyContent",
	"<align-items>": "AlignItems",
	"<align-content>": "AlignContent",
	"<align-self>": "AlignSelf",

	// Typography
	"<font-family>": "FontFamily",
	"<font-size>": "FontSize",
	"<font-weight>": "FontWeight",
	"<font-style>": "FontStyle",
	"<line-height>": "LineHeight",
	"<text-align>": "TextAlign",
	"<text-decoration>": "TextDecoration",
	"<text-transform>": "TextTransform",

	// Border
	"<border-style>": "BorderStyle",
	"<border-width>": "BorderWidth",
	"<border-radius>": "BorderRadius",

	// Background
	"<background-color>": "BackgroundColor",
	"<background-image>": "BackgroundImage",
	"<background-repeat>": "BackgroundRepeat",
	"<background-attachment>": "BackgroundAttachment",
	"<background-position>": "BackgroundPosition",
	"<background-size>": "BackgroundSize",

	// Animation
	"<easing-function>": "EasingFunction",
	"<single-animation-direction>": "AnimationDirection",
	"<single-animation-fill-mode>": "AnimationFillMode",
	"<single-animation-iteration-count>": "AnimationIterationCount",
	"<single-animation-play-state>": "AnimationPlayState",
	"<single-transition>": "SingleTransition",

	// Shadow
	"<box-shadow>": "BoxShadow",
	"<text-shadow>": "TextShadow",

	// Filters
	"<blur()>": "Blur",
	"<brightness()>": "Brightness",
	"<contrast()>": "Contrast",
	"<drop-shadow()>": "DropShadow",
	"<grayscale()>": "Grayscale",
	"<hue-rotate()>": "HueRotate",
	"<invert()>": "Invert",
	"<opacity()>": "OpacityFilter",
	"<saturate()>": "Saturate",
	"<sepia()>": "Sepia",
	"<filter-function>": "FilterFunction",

	// Specific length units
	"<px>": "Px",
	"<em>": "Em",
	"<rem>": "Rem",
	"<vh>": "Vh",
	"<vw>": "Vw",

	// Specific angle units
	"<deg>": "Deg",
	"<rad>": "Rad",
	"<grad>": "Grad",
	"<turn>": "Turn",

	// Common composites
	"<bg-size>": "BackgroundSize",
	"<bg-position>": "BackgroundPosition",
	"<box>": "'border-box' | 'padding-box' | 'content-box'",
	"<geometry-box>": "string",
	"<repeat-style>": "BackgroundRepeat",
	"<attachment>": "BackgroundAttachment",
	"<blend-mode>": "string",
	"<counter>": "string",
	"<gradient>": "string",
	"<line-style>": "BorderStyle",
	"<line-width>": "BorderWidth",
	"<outline-color>": "Color",
	"<outline-style>": "string",
	"<outline-width>": "Length",
	"<shape>": "string",
	"<symbol>": "string",
	"<text-decoration-line>": "TextDecoration",
	"<text-decoration-style>": "'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'",
	"<timing-function>": "EasingFunction",
	"<visibility>": "'visible' | 'hidden' | 'collapse'",
	"<z-index>": "Integer | 'auto'",
};

/**
 * Keywords commonly used in CSS values.
 * These are literal string types that can appear in many properties.
 */
export const CSS_KEYWORDS: Record<string, string[]> = {
	generic: ["initial", "inherit", "unset", "revert", "revert-layer"],
	display: [
		"block",
		"inline",
		"inline-block",
		"flex",
		"inline-flex",
		"grid",
		"inline-grid",
		"none",
		"contents",
		"flow",
		"flow-root",
	],
	position: ["static", "relative", "absolute", "fixed", "sticky"],
	overflow: ["visible", "hidden", "clip", "scroll", "auto"],
	flexDirection: ["row", "row-reverse", "column", "column-reverse"],
	flexWrap: ["nowrap", "wrap", "wrap-reverse"],
	justifyContent: [
		"flex-start",
		"flex-end",
		"center",
		"space-between",
		"space-around",
		"space-evenly",
		"start",
		"end",
		"left",
		"right",
	],
	alignItems: ["flex-start", "flex-end", "center", "baseline", "stretch"],
	textAlign: ["left", "right", "center", "justify", "start", "end"],
};

/**
 * Get the TypeScript type for a CSS syntax type reference.
 */
export function getTSType(cssSyntaxType: string): string {
	// Remove angle brackets if present
	const normalized = cssSyntaxType.startsWith("<") ? cssSyntaxType : `<${cssSyntaxType}>`;
	return CSS_TYPE_MAP[normalized] ?? "string";
}
