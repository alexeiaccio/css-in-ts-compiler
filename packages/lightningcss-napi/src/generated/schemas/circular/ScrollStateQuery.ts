import { Schema } from "effect";

import { QueryFeature_for_ScrollStateFeatureIdSchema } from "../non-recursive.js";

export class ScrollStateQuery extends Schema.Opaque<ScrollStateQuery>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			feature: { value: QueryFeature_for_ScrollStateFeatureIdSchema },
			not: { value: Schema.suspend((): Schema.Codec<ScrollStateQuery> => ScrollStateQuery) },
			operation: {
				conditions: Schema.Tuple([
					Schema.suspend((): Schema.Codec<ScrollStateQuery> => ScrollStateQuery),
					Schema.suspend((): Schema.Codec<ScrollStateQuery> => ScrollStateQuery),
				]),
				operator: Schema.Unknown,
			},
		}),
	}),
) {}
