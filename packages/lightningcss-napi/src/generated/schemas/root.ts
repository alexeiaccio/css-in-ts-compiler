import { Schema } from "effect";

import { Rule } from "./circular/ContainerRule_for_DefaultAtRule.js";
export const StyleSheetSchema = Schema.Struct({
	licenseComments: Schema.Array(Schema.String),
	rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)),
	sourceMapUrls: Schema.Array(Schema.NullOr(Schema.String)),
	sources: Schema.Array(Schema.String),
});
