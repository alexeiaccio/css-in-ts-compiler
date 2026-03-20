import { Schema } from "effect";

import { CssColorSchema } from "../non-recursive.js";
import { ImageSchema } from "../non-recursive.js";
import { UrlSchema } from "../non-recursive.js";
import { AngleSchema } from "../non-recursive.js";
import { TimeSchema } from "../non-recursive.js";
import { ResolutionSchema } from "../non-recursive.js";
import { TransformSchema } from "../non-recursive.js";
import { DimensionPercentage_for_LengthValue } from "./Calc_for_DimensionPercentage_for_LengthValue.js";
import { Length } from "./Calc_for_Length.js";
import { TokenOrValue } from "./EnvironmentVariable.js";

export class ParsedComponent extends Schema.Opaque<ParsedComponent>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			length: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
			number: { value: Schema.Number },
			percentage: { value: Schema.Number },
			"length-percentage": {
				value: Schema.suspend(
					(): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue,
				),
			},
			string: { value: Schema.String },
			color: { value: CssColorSchema },
			image: { value: ImageSchema },
			url: { value: UrlSchema },
			integer: { value: Schema.Number },
			angle: { value: AngleSchema },
			time: { value: TimeSchema },
			resolution: { value: ResolutionSchema },
			"transform-function": { value: TransformSchema },
			"transform-list": { value: Schema.Array(TransformSchema) },
			"custom-ident": { value: Schema.String },
			literal: { value: Schema.String },
			repeated: {
				value: Schema.Struct({
					components: Schema.Array(Schema.suspend((): Schema.Codec<ParsedComponent> => ParsedComponent)),
					multiplier: Schema.Unknown,
				}),
			},
			"token-list": { value: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)) },
		}),
	}),
) {}
