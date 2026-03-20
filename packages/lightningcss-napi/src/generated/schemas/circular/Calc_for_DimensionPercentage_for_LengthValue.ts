import { Schema } from "effect";

import { LengthValueSchema } from "../non-recursive.js";

export class Calc_for_DimensionPercentage_for_LengthValue extends Schema.Opaque<Calc_for_DimensionPercentage_for_LengthValue>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			value: {
				value: Schema.suspend(
					(): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue,
				),
			},
			number: { value: Schema.Number },
			sum: { value: Schema.Array(Schema.Unknown) },
			product: { value: Schema.Array(Schema.Unknown) },
			function: {
				value: Schema.suspend(
					(): Schema.Codec<MathFunction_for_DimensionPercentage_for_LengthValue> =>
						MathFunction_for_DimensionPercentage_for_LengthValue,
				),
			},
		}),
	}),
) {}

export class DimensionPercentage_for_LengthValue extends Schema.Opaque<DimensionPercentage_for_LengthValue>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			dimension: { value: LengthValueSchema },
			percentage: { value: Schema.Number },
			calc: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
						Calc_for_DimensionPercentage_for_LengthValue,
				),
			},
		}),
	}),
) {}

export class MathFunction_for_DimensionPercentage_for_LengthValue extends Schema.Opaque<MathFunction_for_DimensionPercentage_for_LengthValue>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			calc: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
						Calc_for_DimensionPercentage_for_LengthValue,
				),
			},
			min: {
				value: Schema.Tuple([
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
							Calc_for_DimensionPercentage_for_LengthValue,
					),
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
							Calc_for_DimensionPercentage_for_LengthValue,
					),
				]),
			},
			max: {
				value: Schema.Tuple([
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
							Calc_for_DimensionPercentage_for_LengthValue,
					),
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
							Calc_for_DimensionPercentage_for_LengthValue,
					),
				]),
			},
			clamp: { value: Schema.Array(Schema.Unknown) },
			round: { value: Schema.Array(Schema.Unknown) },
			rem: { value: Schema.Array(Schema.Unknown) },
			mod: { value: Schema.Array(Schema.Unknown) },
			abs: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
						Calc_for_DimensionPercentage_for_LengthValue,
				),
			},
			sign: {
				value: Schema.suspend(
					(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
						Calc_for_DimensionPercentage_for_LengthValue,
				),
			},
			hypot: {
				value: Schema.Tuple([
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
							Calc_for_DimensionPercentage_for_LengthValue,
					),
					Schema.suspend(
						(): Schema.Codec<Calc_for_DimensionPercentage_for_LengthValue> =>
							Calc_for_DimensionPercentage_for_LengthValue,
					),
				]),
			},
		}),
	}),
) {}
