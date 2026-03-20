import { Schema } from "effect";

import { ImportRuleSchema } from "../non-recursive.js";
import { KeyframesRuleSchema } from "../non-recursive.js";
import { FontFaceRuleSchema } from "../non-recursive.js";
import { FontPaletteValuesRuleSchema } from "../non-recursive.js";
import { FontFeatureValuesRuleSchema } from "../non-recursive.js";
import { PageRuleSchema } from "../non-recursive.js";
import { CounterStyleRuleSchema } from "../non-recursive.js";
import { NamespaceRuleSchema } from "../non-recursive.js";
import { NestingRule_for_DefaultAtRuleSchema } from "../non-recursive.js";
import { NestedDeclarationsRuleSchema } from "../non-recursive.js";
import { ViewportRuleSchema } from "../non-recursive.js";
import { CustomMediaRuleSchema } from "../non-recursive.js";
import { LayerStatementRuleSchema } from "../non-recursive.js";
import { PropertyRuleSchema } from "../non-recursive.js";
import { ViewTransitionRuleSchema } from "../non-recursive.js";
import { UnknownAtRuleSchema } from "../non-recursive.js";
import { DefaultAtRuleSchema } from "../non-recursive.js";
import { SelectorListSchema } from "../non-recursive.js";
import { ContainerCondition } from "./ContainerCondition.js";

export class ContainerRule_for_DefaultAtRule extends Schema.Opaque<ContainerRule_for_DefaultAtRule>()(
	Schema.Struct({
		condition: Schema.optionalKey(
			Schema.Union([Schema.suspend((): Schema.Codec<ContainerCondition> => ContainerCondition), Schema.Null]),
		),
		loc: Schema.Unknown,
		name: Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])),
		rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)),
	}),
) {}

export class LayerBlockRule_for_DefaultAtRule extends Schema.Opaque<LayerBlockRule_for_DefaultAtRule>()(
	Schema.Struct({
		loc: Schema.Unknown,
		name: Schema.optionalKey(Schema.NullOr(Schema.Array(Schema.String))),
		rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)),
	}),
) {}

export class MediaRule_for_DefaultAtRule extends Schema.Opaque<MediaRule_for_DefaultAtRule>()(
	Schema.Struct({
		loc: Schema.Unknown,
		query: Schema.Unknown,
		rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)),
	}),
) {}

export class MozDocumentRule_for_DefaultAtRule extends Schema.Opaque<MozDocumentRule_for_DefaultAtRule>()(
	Schema.Struct({ loc: Schema.Unknown, rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)) }),
) {}

export class Rule extends Schema.Opaque<Rule>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			media: { value: Schema.suspend((): Schema.Codec<MediaRule_for_DefaultAtRule> => MediaRule_for_DefaultAtRule) },
			import: { value: ImportRuleSchema },
			style: { value: Schema.suspend((): Schema.Codec<StyleRule_for_DefaultAtRule> => StyleRule_for_DefaultAtRule) },
			keyframes: { value: KeyframesRuleSchema },
			"font-face": { value: FontFaceRuleSchema },
			"font-palette-values": { value: FontPaletteValuesRuleSchema },
			"font-feature-values": { value: FontFeatureValuesRuleSchema },
			page: { value: PageRuleSchema },
			supports: {
				value: Schema.suspend((): Schema.Codec<SupportsRule_for_DefaultAtRule> => SupportsRule_for_DefaultAtRule),
			},
			"counter-style": { value: CounterStyleRuleSchema },
			namespace: { value: NamespaceRuleSchema },
			"moz-document": {
				value: Schema.suspend((): Schema.Codec<MozDocumentRule_for_DefaultAtRule> => MozDocumentRule_for_DefaultAtRule),
			},
			nesting: { value: NestingRule_for_DefaultAtRuleSchema },
			"nested-declarations": { value: NestedDeclarationsRuleSchema },
			viewport: { value: ViewportRuleSchema },
			"custom-media": { value: CustomMediaRuleSchema },
			"layer-statement": { value: LayerStatementRuleSchema },
			"layer-block": {
				value: Schema.suspend((): Schema.Codec<LayerBlockRule_for_DefaultAtRule> => LayerBlockRule_for_DefaultAtRule),
			},
			property: { value: PropertyRuleSchema },
			container: {
				value: Schema.suspend((): Schema.Codec<ContainerRule_for_DefaultAtRule> => ContainerRule_for_DefaultAtRule),
			},
			scope: { value: Schema.suspend((): Schema.Codec<ScopeRule_for_DefaultAtRule> => ScopeRule_for_DefaultAtRule) },
			"starting-style": {
				value: Schema.suspend(
					(): Schema.Codec<StartingStyleRule_for_DefaultAtRule> => StartingStyleRule_for_DefaultAtRule,
				),
			},
			"view-transition": { value: ViewTransitionRuleSchema },
			ignored: { value: Schema.Literal("ignored") },
			unknown: { value: UnknownAtRuleSchema },
			custom: { value: DefaultAtRuleSchema },
		}),
	}),
) {}

export class ScopeRule_for_DefaultAtRule extends Schema.Opaque<ScopeRule_for_DefaultAtRule>()(
	Schema.Struct({
		loc: Schema.Unknown,
		rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)),
		scopeEnd: Schema.optionalKey(Schema.Union([SelectorListSchema, Schema.Null])),
		scopeStart: Schema.optionalKey(Schema.Union([SelectorListSchema, Schema.Null])),
	}),
) {}

export class StartingStyleRule_for_DefaultAtRule extends Schema.Opaque<StartingStyleRule_for_DefaultAtRule>()(
	Schema.Struct({ loc: Schema.Unknown, rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)) }),
) {}

export class StyleRule_for_DefaultAtRule extends Schema.Opaque<StyleRule_for_DefaultAtRule>()(
	Schema.Struct({
		declarations: Schema.optionalKey(Schema.Unknown),
		loc: Schema.Unknown,
		rules: Schema.optionalKey(Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule))),
		selectors: Schema.Unknown,
	}),
) {}

export class SupportsRule_for_DefaultAtRule extends Schema.Opaque<SupportsRule_for_DefaultAtRule>()(
	Schema.Struct({
		condition: Schema.Unknown,
		loc: Schema.Unknown,
		rules: Schema.Array(Schema.suspend((): Schema.Codec<Rule> => Rule)),
	}),
) {}
