import { Schema } from "effect";

import { QueryFeature_for_MediaFeatureIdSchema } from "../non-recursive.js";
import { TokenOrValue } from "./EnvironmentVariable.js";

export class MediaCondition extends Schema.Opaque<MediaCondition>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			feature: { value: QueryFeature_for_MediaFeatureIdSchema },
			not: { value: Schema.suspend((): Schema.Codec<MediaCondition> => MediaCondition) },
			operation: {
				conditions: Schema.Tuple([
					Schema.suspend((): Schema.Codec<MediaCondition> => MediaCondition),
					Schema.suspend((): Schema.Codec<MediaCondition> => MediaCondition),
				]),
				operator: Schema.Unknown,
			},
			unknown: { value: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)) },
		}),
	}),
) {}
