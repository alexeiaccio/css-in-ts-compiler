import { Schema } from "effect";

import { DeclarationSchema } from "../non-recursive.js";
import { PropertyIdSchema } from "../non-recursive.js";

export class StyleQuery extends Schema.Opaque<StyleQuery>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			declaration: { value: DeclarationSchema },
			property: { value: PropertyIdSchema },
			not: { value: Schema.suspend((): Schema.Codec<StyleQuery> => StyleQuery) },
			operation: {
				conditions: Schema.Tuple([
					Schema.suspend((): Schema.Codec<StyleQuery> => StyleQuery),
					Schema.suspend((): Schema.Codec<StyleQuery> => StyleQuery),
				]),
				operator: Schema.Unknown,
			},
		}),
	}),
) {}
