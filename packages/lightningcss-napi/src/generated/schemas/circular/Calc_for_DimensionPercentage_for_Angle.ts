import { Schema } from "effect";

import { AngleSchema } from "../non-recursive.js";

export class Calc_for_DimensionPercentage_for_Angle extends Schema.Opaque<Calc_for_DimensionPercentage_for_Angle>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			value: {
				value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_Angle> => DimensionPercentage_for_Angle),
			},
			number: { value: Schema.Number },
			sum: { value: Schema.Array(Schema.Unknown) },
			product: { value: Schema.Array(Schema.Unknown) },
			function: {
				value: Schema.suspend(
					(): Schema.Codec<MathFunction_for_DimensionPercentage_for_Angle> =>
						MathFunction_for_DimensionPercentage_for_Angle,
				),
			},
		}),
	}),
) {}

export class DimensionPercentage_for_Angle extends Schema.Opaque<DimensionPercentage_for_Angle>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			dimension: { value: AngleSchema },
			percentage: { value: Schema.Number },
			calc: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
				),
			},
		}),
	}),
) {}

export class MathFunction_for_DimensionPercentage_for_Angle extends Schema.Opaque<MathFunction_for_DimensionPercentage_for_Angle>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			calc: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
				),
			},
			min: {
				value: Schema.Tuple([
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
					),
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
					),
				]),
			},
			max: {
				value: Schema.Tuple([
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
					),
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
					),
				]),
			},
			clamp: { value: Schema.Array(Schema.Unknown) },
			round: { value: Schema.Array(Schema.Unknown) },
			rem: { value: Schema.Array(Schema.Unknown) },
			mod: { value: Schema.Array(Schema.Unknown) },
			abs: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
				),
			},
			sign: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
				),
			},
			hypot: {
				value: Schema.Tuple([
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
					),
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_Angle> => Calc_for_DimensionPercentage_for_Angle,
					),
				]),
			},
		}),
	}),
) {}
