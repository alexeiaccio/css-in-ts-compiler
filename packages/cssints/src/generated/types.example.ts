/**
 * Generated based on `@mdn/browser-compat-data`.
 * @version 1.0.0
 */

import { SchemaGetter } from "effect";
import * as Schema from "effect/Schema";

/**
 * **Syntax**
 * <code>Q</code> unit
 *
 * **Supports**
 * Chrome 63 | Firefox 49 | Safari 13.1
 */
export const Q = Schema.TemplateLiteral([Schema.Number, "Q"]);

/**
 * ...
 */
export const Px = Schema.TemplateLiteral([Schema.Number, "px"]);

/**
 * ...
 */
export const NumberPx = Schema.Union([Schema.Number, Schema.TemplateLiteral([Schema.Number])]).pipe(
	Schema.encodeTo(Px, {
		encode: SchemaGetter.transform((value) => `${value}px` as const),
		decode: SchemaGetter.transform((value) => parseFloat(value.replace("px", ""))),
	}),
);

/**
 * ...
 */
export const Rem = Schema.TemplateLiteral([Schema.Number, "rem"]);

// ...

/**
 * ...
 */
export const ContainerQueryLengthUnits = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "cqw"]),
	Schema.TemplateLiteral([Schema.Number, "cqh"]),
	Schema.TemplateLiteral([Schema.Number, "cqi"]),
	Schema.TemplateLiteral([Schema.Number, "cqb"]),
	Schema.TemplateLiteral([Schema.Number, "cqmin"]),
	Schema.TemplateLiteral([Schema.Number, "cqmax"]),
]);

/**
 * ...
 */
export const ViewportPercentageUnitsDynamic = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "dvb"]),
	Schema.TemplateLiteral([Schema.Number, "dvh"]),
	Schema.TemplateLiteral([Schema.Number, "dvi"]),
	Schema.TemplateLiteral([Schema.Number, "dvmax"]),
	Schema.TemplateLiteral([Schema.Number, "dvmin"]),
	Schema.TemplateLiteral([Schema.Number, "dvw"]),
]);

/**
 * ...
 */
export const ViewportPercentageUnitsLarge = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "lvb"]),
	Schema.TemplateLiteral([Schema.Number, "lvh"]),
	Schema.TemplateLiteral([Schema.Number, "lvi"]),
	Schema.TemplateLiteral([Schema.Number, "lvmax"]),
	Schema.TemplateLiteral([Schema.Number, "lvmin"]),
	Schema.TemplateLiteral([Schema.Number, "lvw"]),
]);

/**
 * ...
 */
export const ViewportPercentageUnitsSmall = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "svb"]),
	Schema.TemplateLiteral([Schema.Number, "svh"]),
	Schema.TemplateLiteral([Schema.Number, "svi"]),
	Schema.TemplateLiteral([Schema.Number, "svmax"]),
	Schema.TemplateLiteral([Schema.Number, "svmin"]),
	Schema.TemplateLiteral([Schema.Number, "svw"]),
]);

/**
 * ...
 */
export const ViewportUnitVariants = Schema.Union([
	Schema.TemplateLiteral([Schema.Number, "vh"]),
	Schema.TemplateLiteral([Schema.Number, "vw"]),
	ViewportPercentageUnitsDynamic,
	ViewportPercentageUnitsLarge,
	ViewportPercentageUnitsSmall,
]);

/**
 * **Syntax**
 * <code>&lt;length&gt;</code>
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
	// ...
	ContainerQueryLengthUnits,
	ViewportUnitVariants,
]);

/**
 * ...
 */
export const Percentage = Schema.TemplateLiteral([Schema.FiniteFromString, "%"]);

/**
 * ...
 */
export const LengthPercentage = Schema.Union([Length, Percentage]);

export const typeMap = {
	"<length>": Length,
	"<percentage>": Percentage,
	"<length-percentage>": LengthPercentage,
	// ...
} as const;
