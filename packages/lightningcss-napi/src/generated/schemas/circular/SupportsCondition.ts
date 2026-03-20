import { Schema } from "effect";

export class SupportsCondition extends Schema.Opaque<SupportsCondition>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			not: { value: Schema.suspend((): Schema.Codec<SupportsCondition> => SupportsCondition) },
			and: {
				value: Schema.Tuple([
					Schema.suspend((): Schema.Codec<SupportsCondition> => SupportsCondition),
					Schema.suspend((): Schema.Codec<SupportsCondition> => SupportsCondition),
				]),
			},
			or: {
				value: Schema.Tuple([
					Schema.suspend((): Schema.Codec<SupportsCondition> => SupportsCondition),
					Schema.suspend((): Schema.Codec<SupportsCondition> => SupportsCondition),
				]),
			},
			declaration: { propertyId: Schema.Unknown, value: Schema.Unknown },
			selector: { value: Schema.String },
			unknown: { value: Schema.String },
		}),
	}),
) {}
