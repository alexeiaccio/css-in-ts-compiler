import { Schema } from "effect";

const SupportInfoEntry = Schema.Struct({
	version_added: Schema.Union([Schema.Boolean, Schema.String]),
	version_removed: Schema.optional(Schema.Union([Schema.Boolean, Schema.String])),
	version_last: Schema.optional(Schema.Union([Schema.Boolean, Schema.String])),
	alternative_name: Schema.optional(Schema.String),
	prefix: Schema.optional(Schema.String),
	notes: Schema.optional(Schema.Union([Schema.String, Schema.Array(Schema.String)])),
	partial_implementation: Schema.optional(Schema.Boolean),
});

export const CompatDataSchema = Schema.Struct({
	description: Schema.optional(Schema.String),
	mdn_url: Schema.optional(Schema.Union([Schema.String, Schema.Array(Schema.String)])),
	source_file: Schema.optional(Schema.String),
	spec_url: Schema.optional(Schema.Union([Schema.String, Schema.Array(Schema.String)])),
	status: Schema.Struct({
		deprecated: Schema.Boolean,
		experimental: Schema.Boolean,
		standard_track: Schema.Boolean,
	}),
	support: Schema.Record(
		Schema.String,
		Schema.Union([Schema.Boolean, SupportInfoEntry, Schema.Array(SupportInfoEntry)]),
	),
	tags: Schema.optional(Schema.Array(Schema.String)),
});

export const CompatStatementSchema = Schema.Struct({
	__compat: CompatDataSchema,
});

export const CSSValueTypeSchema = Schema.Struct({
	name: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	prose: Schema.optional(Schema.String),
	href: Schema.optional(Schema.String),
	extended: Schema.optional(Schema.Array(Schema.Unknown)),
	__compat: Schema.optional(CompatDataSchema),
});

export const CSSCompatData = Schema.Struct({
	"at-rules": Schema.optional(Schema.Record(Schema.String, CompatStatementSchema)),
	properties: Schema.optional(Schema.Record(Schema.String, CompatStatementSchema)),
	selectors: Schema.optional(Schema.Unknown),
	types: Schema.optional(Schema.Unknown),
});

export type CSSCompatData = Schema.Schema.Type<typeof CSSCompatData>;
export type CompatData = Schema.Schema.Type<typeof CompatDataSchema>;
export type CompatStatement = Schema.Schema.Type<typeof CompatStatementSchema>;
