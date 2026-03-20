import { Schema } from "effect";

import { LengthValueSchema } from "../non-recursive.js";

export class Calc_for_Length extends Schema.Opaque<Calc_for_Length>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			value: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
			number: { value: Schema.Number },
			sum: { value: Schema.Array(Schema.Unknown) },
			product: { value: Schema.Array(Schema.Unknown) },
			function: { value: Schema.suspend((): Schema.Codec<MathFunction_for_Length> => MathFunction_for_Length) },
		}),
	}),
) {}

export class Length extends Schema.Opaque<Length>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			value: { value: LengthValueSchema },
			calc: { value: Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length) },
		}),
	}),
) {}

export class MathFunction_for_Length extends Schema.Opaque<MathFunction_for_Length>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			calc: { value: Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length) },
			min: {
				value: Schema.Tuple([
					Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length),
					Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length),
				]),
			},
			max: {
				value: Schema.Tuple([
					Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length),
					Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length),
				]),
			},
			clamp: { value: Schema.Array(Schema.Unknown) },
			round: { value: Schema.Array(Schema.Unknown) },
			rem: { value: Schema.Array(Schema.Unknown) },
			mod: { value: Schema.Array(Schema.Unknown) },
			abs: { value: Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length) },
			sign: { value: Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length) },
			hypot: {
				value: Schema.Tuple([
					Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length),
					Schema.suspend((): Schema.Codec<Calc_for_Length> => Calc_for_Length),
				]),
			},
		}),
	}),
) {}
