import { Schema } from "effect";

export const WebrefDescriptor = Schema.Struct({
  name: Schema.String,
  href: Schema.optional(Schema.String),
  for: Schema.optional(Schema.String),
  initial: Schema.optional(Schema.String),
  syntax: Schema.optional(Schema.String),
  type: Schema.optional(Schema.String),
});

export const WebrefAtRule = Schema.Struct({
  name: Schema.String,
  href: Schema.optional(Schema.String),
  prose: Schema.optional(Schema.String),
  syntax: Schema.optional(Schema.String),
  for: Schema.optional(Schema.Array(Schema.String)),
  descriptors: Schema.Array(WebrefDescriptor),
  extended: Schema.Array(Schema.Unknown),
});

export const WebrefFunction = Schema.Struct({
  name: Schema.String,
  href: Schema.optional(Schema.String),
  prose: Schema.optional(Schema.String),
  syntax: Schema.optional(Schema.String),
  value: Schema.optional(Schema.String),
  extended: Schema.Array(Schema.Unknown),
});

export const WebrefProperty = Schema.Struct({
  name: Schema.String,
  href: Schema.optional(Schema.String),
  prose: Schema.optional(Schema.String),
  syntax: Schema.optional(Schema.String),
  styleDeclaration: Schema.optional(Schema.Array(Schema.String)),
  legacyAliasOf: Schema.optional(Schema.String),
  extended: Schema.Array(Schema.Unknown),
});

export const WebrefSelector = Schema.Struct({
  name: Schema.String,
  href: Schema.optional(Schema.String),
  prose: Schema.optional(Schema.String),
  syntax: Schema.optional(Schema.String),
});

export const WebrefType = Schema.Struct({
  name: Schema.String,
  href: Schema.optional(Schema.String),
  prose: Schema.optional(Schema.String),
  syntax: Schema.optional(Schema.String),
  value: Schema.optional(Schema.String),
  extended: Schema.Array(Schema.Unknown),
});

export const WebrefCSSData = Schema.Struct({
  atrules: Schema.Array(WebrefAtRule),
  functions: Schema.Array(WebrefFunction),
  properties: Schema.Array(WebrefProperty),
  selectors: Schema.Array(WebrefSelector),
  types: Schema.Array(WebrefType),
});

export type WebrefDescriptor = Schema.Schema.Type<typeof WebrefDescriptor>;
export type WebrefAtRule = Schema.Schema.Type<typeof WebrefAtRule>;
export type WebrefFunction = Schema.Schema.Type<typeof WebrefFunction>;
export type WebrefProperty = Schema.Schema.Type<typeof WebrefProperty>;
export type WebrefSelector = Schema.Schema.Type<typeof WebrefSelector>;
export type WebrefType = Schema.Schema.Type<typeof WebrefType>;
export type WebrefCSSData = Schema.Schema.Type<typeof WebrefCSSData>;
