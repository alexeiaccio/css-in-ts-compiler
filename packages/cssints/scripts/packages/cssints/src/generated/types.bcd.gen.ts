/**
 * Generated based on `@mdn/browser-compat-data`.
 * @version 7.3.2
 */

import { SchemaGetter } from "effect";
import * as Schema from "effect/Schema";

// ==============================================================================
// Basic Unit Schemas
// ==============================================================================

export const Q = Schema.TemplateLiteral([Schema.Number, "Q"]);

export const Px = Schema.TemplateLiteral([Schema.Number, "px"]);

export const NumberPx = Schema.Union([Schema.Number, Schema.TemplateLiteral([Schema.Number])]).pipe(
	Schema.encodeTo(Px, {
		encode: SchemaGetter.transform((value) => `${value}px` as const),
		decode: SchemaGetter.transform((value) => parseFloat(value.replace("px", ""))),
	}),
);

export const Rem = Schema.TemplateLiteral([Schema.Number, "rem"]);

// ==============================================================================
// Container Query Length Units
// ==============================================================================

export const ContainerQueryLengthUnits = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "cqw"]),
	Schema.TemplateLiteral([Schema.Number, "cqh"]),
	Schema.TemplateLiteral([Schema.Number, "cqi"]),
	Schema.TemplateLiteral([Schema.Number, "cqb"]),
	Schema.TemplateLiteral([Schema.Number, "cqmin"]),
	Schema.TemplateLiteral([Schema.Number, "cqmax"]),
]);

// ==============================================================================
// Viewport Units - Dynamic
// ==============================================================================

export const ViewportPercentageUnitsDynamic = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "dvb"]),
	Schema.TemplateLiteral([Schema.Number, "dvh"]),
	Schema.TemplateLiteral([Schema.Number, "dvi"]),
	Schema.TemplateLiteral([Schema.Number, "dvmax"]),
	Schema.TemplateLiteral([Schema.Number, "dvmin"]),
	Schema.TemplateLiteral([Schema.Number, "dvw"]),
]);

// ==============================================================================
// Viewport Units - Large
// ==============================================================================

export const ViewportPercentageUnitsLarge = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "lvb"]),
	Schema.TemplateLiteral([Schema.Number, "lvh"]),
	Schema.TemplateLiteral([Schema.Number, "lvi"]),
	Schema.TemplateLiteral([Schema.Number, "lvmax"]),
	Schema.TemplateLiteral([Schema.Number, "lvmin"]),
	Schema.TemplateLiteral([Schema.Number, "lvw"]),
]);

// ==============================================================================
// Viewport Units - Small
// ==============================================================================

export const ViewportPercentageUnitsSmall = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "svb"]),
	Schema.TemplateLiteral([Schema.Number, "svh"]),
	Schema.TemplateLiteral([Schema.Number, "svi"]),
	Schema.TemplateLiteral([Schema.Number, "svmax"]),
	Schema.TemplateLiteral([Schema.Number, "svmin"]),
	Schema.TemplateLiteral([Schema.Number, "svw"]),
]);

export const ViewportUnitVariants = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "vh"]),
	Schema.TemplateLiteral([Schema.Number, "vw"]),
	ViewportPercentageUnitsDynamic,
	ViewportPercentageUnitsLarge,
	ViewportPercentageUnitsSmall,
]);

// ==============================================================================
// CSS Types from @mdn/browser-compat-data
// ==============================================================================

/**
 * **Syntax**
 * <code>length</code>
 *
 * **Supports**
 * Chrome 1 | Firefox 1 | Safari 1
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/length
 * @see https://drafts.csswg.org/css-values/#lengths
 */
export const Length = Schema.Union([
	NumberPx,
	Q,
	Px,
	Rem,
	// ... (other length units - see nested types)
	ContainerQueryLengthUnits,
	ViewportUnitVariants,
]);

/**
 * **Syntax**
 * <code>length-percentage</code>
 *
 * **Supports**
 * Chrome 1 | Firefox 1 | Safari 1
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/length-percentage
 * @see https://drafts.csswg.org/css-values/#mixed-percentages
 */
export const LengthPercentage = Schema.Union([Length, Percentage]);

/**
 * **Syntax**
 * <code>percentage</code>
 *
 * **Supports**
 * Chrome 1 | Firefox 1 | Safari 1
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/percentage
 * @see https://drafts.csswg.org/css-values/#percentages
 */
export const Percentage = Schema.TemplateLiteral([Schema.FiniteFromString, "%"]);

/**
 * **Syntax**
 * <code>angle</code>
 *
 * **Supports**
 * Chrome 2 | Firefox 3.6 | Safari 4
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/angle
 * @see https://drafts.csswg.org/css-values/#angles
 */
export const Angle = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "deg"]),
	Schema.TemplateLiteral([Schema.Number, "grad"]),
	Schema.TemplateLiteral([Schema.Number, "rad"]),
	Schema.TemplateLiteral([Schema.Number, "turn"]),
]);

/**
 * **Syntax**
 * <code>time</code>
 *
 * **Supports**
 * Chrome 1 | Firefox 4 | Safari 3.1
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/time
 * @see https://drafts.csswg.org/css-values/#time
 */
export const Time = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "s"]),
	Schema.TemplateLiteral([Schema.Number, "ms"]),
]);

/**
 * **Syntax**
 * <code>resolution</code>
 *
 * **Supports**
 * Chrome 29 | Firefox ✗ | Safari 16
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/resolution
 * @see https://drafts.csswg.org/css-values/#resolution
 */
export const Resolution = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "dpi"]),
	Schema.TemplateLiteral([Schema.Number, "dpcm"]),
	Schema.TemplateLiteral([Schema.Number, "dppx"]),
	Schema.TemplateLiteral([Schema.Number, "x"]),
]);

/**
 * **Syntax**
 * <code>color</code>
 *
 * **Supports**
 * Chrome 1 | Firefox 1 | Safari 1
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/color_value
 * @see https://drafts.csswg.org/css-color/#color-syntax
 */
// Color schema - complex type with multiple representations
export const Color = Schema.String;

/**
 * **Syntax**
 * <code>number</code>
 *
 * **Supports**
 * Chrome 1 | Firefox 1 | Safari 1
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/number
 * @see https://drafts.csswg.org/css-values/#numbers
 */
export const Number = Schema.Number;

/**
 * **Syntax**
 * <code>integer</code>
 *
 * **Supports**
 * Chrome 1 | Firefox 1 | Safari 1
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/integer
 * @see https://drafts.csswg.org/css-values/#integers
 */
export const Integer = Schema.Number;

// ==============================================================================
// Type Map
// ==============================================================================

export const typeMap = {
	"<length>": Length,
	"<percentage>": Percentage,
	"<length-percentage>": LengthPercentage,
	"<angle>": Angle,
	"<time>": Time,
	"<resolution>": Resolution,
	"<frequency>": Frequency,
	"<color>": Color,
	"<number>": Number,
	"<integer>": Integer,
} as const;