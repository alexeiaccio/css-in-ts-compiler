import { Schema } from "effect";

const SupportInfoEntry = Schema.Union([
  Schema.Struct({
    version_added: Schema.Union([Schema.Boolean, Schema.String]),
    version_removed: Schema.optional(Schema.Union([Schema.Boolean, Schema.String])),
    alternative_name: Schema.optional(Schema.String),
    prefix: Schema.optional(Schema.String),
    notes: Schema.optional(Schema.Union([Schema.String, Schema.Array(Schema.String)])),
  }),
  Schema.Struct({
    version_added: Schema.Union([Schema.Boolean, Schema.String]),
    version_removed: Schema.optional(Schema.Union([Schema.Boolean, Schema.String])),
    prefix: Schema.optional(Schema.String),
    notes: Schema.optional(Schema.Union([Schema.String, Schema.Array(Schema.String)])),
  }),
]);

const SupportInfoSchema = Schema.Union([
  Schema.Boolean,
  Schema.Array(SupportInfoEntry),
]);

export const CompatDataSchema = Schema.Struct({
  description: Schema.optional(Schema.String),
  mdn_url: Schema.optional(Schema.String),
  source_file: Schema.optional(Schema.String),
  spec_url: Schema.optional(Schema.String),
  status: Schema.Struct({
    deprecated: Schema.Boolean,
    experimental: Schema.Boolean,
    standard_track: Schema.Boolean,
  }),
  support: Schema.Record(Schema.String, SupportInfoSchema),
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

export type CompatDataType = Schema.Schema.Type<typeof CompatDataSchema>;
export type CompatStatementType = Schema.Schema.Type<typeof CompatStatementSchema>;
export type CSSValueTypeOutput = Schema.Schema.Type<typeof CSSValueTypeSchema>;
