import { DimensionNodeSchema } from "@cssints/css-syntax";
import * as Schema from "effect/Schema";

const NumberString = Schema.Union([Schema.Number, Schema.TemplateLiteral([Schema.Number])]);

export class Q extends Schema.TaggedClass<Q>()("Q", {
	value: NumberString,
	ast: DimensionNodeSchema,
}) {
	static make(value: typeof NumberString.Type): Q {
		return new Q({
			value,
			ast: DimensionNodeSchema.makeUnsafe({ type: "dimension", value: value.toString(), unit: "Q" }),
		});
	}
}

export class Px extends Schema.TaggedClass<Px>()("Px", {
	value: NumberString,
	ast: DimensionNodeSchema,
}) {
	static make(value: typeof NumberString.Type): Px {
		return new Px({
			value,
			ast: DimensionNodeSchema.makeUnsafe({ type: "dimension", value: value.toString(), unit: "px" }),
		});
	}
}

class Rem extends Schema.TaggedClass<Rem>()("Rem", {
	value: NumberString,
	ast: DimensionNodeSchema,
}) {
	static make(value: typeof NumberString.Type): Rem {
		return new Rem({
			value,
			ast: DimensionNodeSchema.makeUnsafe({ type: "dimension", value: value.toString(), unit: "rem" }),
		});
	}
}

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

const LengthSchema = Schema.Union([
	NumberString,
	Px,
	Q,
	Px,
	Rem,
	// ...
	// ContainerQueryLengthUnits,
	// ViewportUnitVariants,
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
export class Length extends Schema.TaggedClass<Length>()("Length", {
	value: LengthSchema,
	ast: DimensionNodeSchema,
}) {
	static make(value: typeof LengthSchema.Type): Length {
		return new Length({
			value,
			ast: DimensionNodeSchema.makeUnsafe({ type: "dimension", value: value.toString(), unit: "px" }),
		});
	}
}

/**
 * ...
 */
export const Percentage = Schema.TemplateLiteral([Schema.FiniteFromString, "%"]);

/**
 * ...
 */
export const LengthPercentage = Schema.Union([Length, Percentage]);
