import { Schema } from "effect";

const Baseline = Schema.Struct({
  status: Schema.String,
  baseline_low_date: Schema.optional(Schema.String),
  baseline_high_date: Schema.optional(Schema.String),
});

const Reference = Schema.Struct({
  name: Schema.String,
  url: Schema.String,
});

const PropertyValue = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  browsers: Schema.optional(Schema.Array(Schema.String)),
  baseline: Schema.optional(Baseline),
});

export const VSCodeCSSProperty = Schema.Struct({
  name: Schema.String,
  browsers: Schema.optional(Schema.Array(Schema.String)),
  atRule: Schema.optional(Schema.String),
  syntax: Schema.optional(Schema.String),
  relevance: Schema.optional(Schema.Number),
  description: Schema.optional(Schema.String),
  restrictions: Schema.optional(Schema.Array(Schema.String)),
  values: Schema.optional(Schema.Array(PropertyValue)),
  references: Schema.optional(Schema.Array(Reference)),
  baseline: Schema.optional(Baseline),
});

export const VSCodeAtDirective = Schema.Struct({
  name: Schema.String,
  browsers: Schema.optional(Schema.Array(Schema.String)),
  references: Schema.optional(Schema.Array(Reference)),
  baseline: Schema.optional(Baseline),
  description: Schema.optional(Schema.String),
});

export const VSCodePseudoClass = Schema.Struct({
  name: Schema.String,
  browsers: Schema.optional(Schema.Array(Schema.String)),
  references: Schema.optional(Schema.Array(Reference)),
  baseline: Schema.optional(Baseline),
  description: Schema.optional(Schema.String),
});

export const VSCodePseudoElement = Schema.Struct({
  name: Schema.String,
  browsers: Schema.optional(Schema.Array(Schema.String)),
  references: Schema.optional(Schema.Array(Reference)),
  baseline: Schema.optional(Baseline),
  description: Schema.optional(Schema.String),
});

export const VSCodeCSSData = Schema.Struct({
  version: Schema.Number,
  properties: Schema.optional(Schema.Array(VSCodeCSSProperty)),
  atDirectives: Schema.optional(Schema.Array(VSCodeAtDirective)),
  pseudoClasses: Schema.optional(Schema.Array(VSCodePseudoClass)),
  pseudoElements: Schema.optional(Schema.Array(VSCodePseudoElement)),
});

export type VSCodeCSSProperty = Schema.Schema.Type<typeof VSCodeCSSProperty>;
export type VSCodeAtDirective = Schema.Schema.Type<typeof VSCodeAtDirective>;
export type VSCodePseudoClass = Schema.Schema.Type<typeof VSCodePseudoClass>;
export type VSCodePseudoElement = Schema.Schema.Type<typeof VSCodePseudoElement>;
export type VSCodeCSSData = Schema.Schema.Type<typeof VSCodeCSSData>;
