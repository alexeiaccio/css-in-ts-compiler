import { Schema } from "effect";

import { CombinatorSchema } from "../non-recursive.js";
import { NamespaceConstraintSchema } from "../non-recursive.js";
import { AttrOperationSchema } from "../non-recursive.js";
import { VendorPrefixSchema } from "../non-recursive.js";

export class BuiltinPseudoElement extends Schema.Opaque<BuiltinPseudoElement>()(
	Schema.Struct({
		schema: Schema.Union([
			Schema.Struct({
				kind: Schema.Literal("slotted"),
				selector: Schema.suspend((): Schema.Codec<Selector> => Selector),
			}),
			Schema.Struct({ kind: Schema.Literal("part"), names: Schema.Array(Schema.String) }),
		]),
	}),
) {}

export class Selector extends Schema.Opaque<Selector>()(Schema.Struct({})) {}

export class SelectorComponent extends Schema.Opaque<SelectorComponent>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			combinator: { value: CombinatorSchema },
			universal: { value: Schema.Literal("universal") },
			namespace: { value: Schema.Literal("namespace") },
			type: { name: Schema.String },
			id: { name: Schema.String },
			class: { name: Schema.String },
			attribute: {
				name: Schema.String,
				namespace: Schema.optionalKey(Schema.Union([NamespaceConstraintSchema, Schema.Null])),
				operation: Schema.optionalKey(Schema.Union([AttrOperationSchema, Schema.Null])),
			},
			"pseudo-class": { value: Schema.Literal("pseudo-class") },
			"pseudo-element": { value: Schema.Literal("pseudo-element") },
			nesting: { value: Schema.Literal("nesting") },
		}),
	}),
) {}

export class TSPseudoClass extends Schema.Opaque<TSPseudoClass>()(
	Schema.Struct({
		schema: Schema.Union([
			Schema.Struct({
				kind: Schema.Literal("not"),
				selectors: Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector)),
			}),
			Schema.Struct({ kind: Schema.Literal("first-child") }),
			Schema.Struct({ kind: Schema.Literal("last-child") }),
			Schema.Struct({ kind: Schema.Literal("only-child") }),
			Schema.Struct({ kind: Schema.Literal("root") }),
			Schema.Struct({ kind: Schema.Literal("empty") }),
			Schema.Struct({ kind: Schema.Literal("scope") }),
			Schema.Struct({
				a: Schema.Number,
				b: Schema.Number,
				kind: Schema.Literal("nth-child"),
				of: Schema.optionalKey(Schema.NullOr(Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector)))),
			}),
			Schema.Struct({
				a: Schema.Number,
				b: Schema.Number,
				kind: Schema.Literal("nth-last-child"),
				of: Schema.optionalKey(Schema.NullOr(Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector)))),
			}),
			Schema.Struct({ a: Schema.Number, b: Schema.Number, kind: Schema.Literal("nth-col") }),
			Schema.Struct({ a: Schema.Number, b: Schema.Number, kind: Schema.Literal("nth-last-col") }),
			Schema.Struct({ a: Schema.Number, b: Schema.Number, kind: Schema.Literal("nth-of-type") }),
			Schema.Struct({ a: Schema.Number, b: Schema.Number, kind: Schema.Literal("nth-last-of-type") }),
			Schema.Struct({ kind: Schema.Literal("first-of-type") }),
			Schema.Struct({ kind: Schema.Literal("last-of-type") }),
			Schema.Struct({ kind: Schema.Literal("only-of-type") }),
			Schema.Struct({
				kind: Schema.Literal("host"),
				selectors: Schema.optionalKey(
					Schema.Union([Schema.suspend((): Schema.Codec<Selector> => Selector), Schema.Null]),
				),
			}),
			Schema.Struct({
				kind: Schema.Literal("where"),
				selectors: Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector)),
			}),
			Schema.Struct({
				kind: Schema.Literal("is"),
				selectors: Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector)),
			}),
			Schema.Struct({
				kind: Schema.Literal("any"),
				selectors: Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector)),
				vendorPrefix: VendorPrefixSchema,
			}),
			Schema.Struct({
				kind: Schema.Literal("has"),
				selectors: Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector)),
			}),
		]),
	}),
) {}
