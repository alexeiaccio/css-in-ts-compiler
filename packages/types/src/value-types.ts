/**
 * CSS Value Types for cssints compiler
 * Includes CSS functions that are NOT in csstype (color-mix, calc variants, etc.)
 * Based on MDN Browser Compatibility Data
 */

// Color type - accepts any valid CSS color
type Color = string;

// =============================================================================
// CSS Color Functions (missing from csstype)
// =============================================================================

/** CSS color-mix() function - mix two colors with interpolation */
export type ColorMixFunction = `color-mix(in ${ColorSpace}, ${Color}, ${Color})`;

/** CSS color() function - specify colors in various color spaces */
export type ColorFunction = `color(${ColorSpace} ${number} ${number} ${number} / ${number | string})`;

/** Light-dark function for CSS Color Level 5 */
export type LightDarkFunction = `light-dark(${Color}, ${Color})`;

/** Color space for color-mix() and color() */
export type ColorSpace = "srgb" | "srgb-linear" | "lab" | "oklab" | "lch" | "oklch" | "xyz" | "xyz-d50" | "xyz-d65";

// =============================================================================
// CSS Math Functions (missing from csstype)
// =============================================================================

/** CSS calc() function */
export type CalcFunction = `calc(${string})`;

/** CSS min() function */
export type MinFunction = `min(${string}, ${string})`;

/** CSS max() function */
export type MaxFunction = `max(${string}, ${string})`;

/** CSS clamp() function */
export type ClampFunction = `clamp(${string}, ${string}, ${string})`;

/** CSS round() function */
export type RoundFunction = `round(${string})`;

/** CSS abs() function */
export type AbsFunction = `abs(${number | string})`;

/** CSS sign() function */
export type SignFunction = `sign(${number | string})`;

/** CSS trig functions */
export type TrigFunction = `sin(${number | string})` | `cos(${number | string})` | `tan(${number | string})`;

/** CSS hypot() function */
export type HypotFunction = `hypot(${string})`;

/** CSS pow() function */
export type PowFunction = `pow(${number}, ${number})`;

/** CSS sqrt() function */
export type SqrtFunction = `sqrt(${number})`;

/** CSS log() and exp() functions */
export type LogFunction = `log(${number})` | `log(${number}, ${number})`;
export type ExpFunction = `exp(${number})`;

// =============================================================================
// CSS Image Functions (missing from csstype)
// =============================================================================

/** CSS element() function */
export type ElementFunction = `element(${string})`;

/** CSS paint() function */
export type PaintFunction = `paint(${string})`;

// =============================================================================
// CSS Environment Functions
// =============================================================================

/** CSS env() function for safe area insets and custom environment values */
export type EnvFunction =
	| `env(safe-area-inset-top)`
	| `env(safe-area-inset-right)`
	| `env(safe-area-inset-bottom)`
	| `env(safe-area-inset-left)`
	| `env(${string})`
	| `env(${string}, ${string})`;

// =============================================================================
// CSS Container Functions
// =============================================================================

/** CSS container queries */
export type ContainerQueryFunction = `container(${string})`;

/** CSS cqw, cqh, cqi, cqmin, cqmax units */
export type ContainerLengthUnit = "cqw" | "cqh" | "cqi" | "cqmin" | "cqmax";
export type ContainerLength = `${number}${ContainerLengthUnit}`;

// =============================================================================
// CSS Font Functions (missing from csstype)
// =============================================================================

/** CSS font-size-adjust() */
export type FontSizeAdjustFunction = `font-size-adjust(${number})`;

// =============================================================================
// CSS View Transitions
// =============================================================================

/** CSS view transition name */
export type ViewTransitionName = `view-transition-name(${string})`;

// =============================================================================
// CSS Anchor Positioning
// =============================================================================

/** CSS anchor() function */
export type AnchorFunction = `anchor(${string})` | `anchor(${string}, ${string})`;

/** CSS anchor-size() function */
export type AnchorSizeFunction = `anchor-size(${string})` | `anchor-size(${string}, ${string})`;

// =============================================================================
// CSS Summary - All Missing Functions
// =============================================================================

/** All CSS functions that csstype is missing */
export type CSSFunctions =
	| ColorMixFunction
	| ColorFunction
	| LightDarkFunction
	| CalcFunction
	| MinFunction
	| MaxFunction
	| ClampFunction
	| RoundFunction
	| AbsFunction
	| SignFunction
	| TrigFunction
	| HypotFunction
	| PowFunction
	| SqrtFunction
	| LogFunction
	| ExpFunction
	| ElementFunction
	| PaintFunction
	| EnvFunction
	| ContainerQueryFunction
	| FontSizeAdjustFunction
	| ViewTransitionName
	| AnchorFunction
	| AnchorSizeFunction;
