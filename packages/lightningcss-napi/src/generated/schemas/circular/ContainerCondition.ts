import { Schema } from "effect";

import { QueryFeature_for_ContainerSizeFeatureIdSchema } from "../non-recursive.js";
import { TokenOrValue } from "./EnvironmentVariable.js";
import { ScrollStateQuery } from "./ScrollStateQuery.js";
import { StyleQuery } from "./StyleQuery.js";

export class ContainerCondition extends Schema.Opaque<ContainerCondition>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			feature: { value: QueryFeature_for_ContainerSizeFeatureIdSchema },
			not: { value: Schema.suspend((): Schema.Codec<ContainerCondition> => ContainerCondition) },
			operation: {
				conditions: Schema.Tuple([
					Schema.suspend((): Schema.Codec<ContainerCondition> => ContainerCondition),
					Schema.suspend((): Schema.Codec<ContainerCondition> => ContainerCondition),
				]),
				operator: Schema.Unknown,
			},
			style: { value: Schema.suspend((): Schema.Codec<StyleQuery> => StyleQuery) },
			"scroll-state": { value: Schema.suspend((): Schema.Codec<ScrollStateQuery> => ScrollStateQuery) },
			unknown: { value: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)) },
		}),
	}),
) {}
