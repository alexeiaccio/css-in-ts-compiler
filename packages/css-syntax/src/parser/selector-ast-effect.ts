import { Schema } from "effect";

export const SpecificitySchema = Schema.Struct({
  a: Schema.Number,
  b: Schema.Number,
  c: Schema.Number,
});

export type Specificity = Schema.Schema.Type<typeof SpecificitySchema>;

export const TypeSelectorSchema = Schema.Struct({
  type: Schema.Literal("type"),
  name: Schema.String,
  namespace: Schema.optional(Schema.String),
});

export type TypeSelector = Schema.Schema.Type<typeof TypeSelectorSchema>;

export const ClassSelectorSchema = Schema.Struct({
  type: Schema.Literal("class"),
  name: Schema.String,
});

export type ClassSelector = Schema.Schema.Type<typeof ClassSelectorSchema>;

export const IdSelectorSchema = Schema.Struct({
  type: Schema.Literal("id"),
  name: Schema.String,
});

export type IdSelector = Schema.Schema.Type<typeof IdSelectorSchema>;

export const AttributeSelectorSchema = Schema.Struct({
  type: Schema.Literal("attribute"),
  name: Schema.String,
  namespace: Schema.optional(Schema.String),
  operator: Schema.optional(Schema.String),
  value: Schema.optional(Schema.String),
  flags: Schema.optional(Schema.String),
});

export type AttributeSelector = Schema.Schema.Type<typeof AttributeSelectorSchema>;

export const PseudoClassSelectorSchema = Schema.Struct({
  type: Schema.Literal("pseudo-class"),
  name: Schema.String,
  args: Schema.optional(Schema.Array(Schema.Unknown)),
});

export type PseudoClassSelector = Schema.Schema.Type<typeof PseudoClassSelectorSchema>;

export const PseudoElementSelectorSchema = Schema.Struct({
  type: Schema.Literal("pseudo-element"),
  name: Schema.String,
  args: Schema.optional(Schema.Array(Schema.Unknown)),
});

export type PseudoElementSelector = Schema.Schema.Type<typeof PseudoElementSelectorSchema>;

export const CombinatorSchema = Schema.Struct({
  type: Schema.Literal("combinator"),
  kind: Schema.String,
});

export type Combinator = Schema.Schema.Type<typeof CombinatorSchema>;

export const CompoundSelectorSchema = Schema.Struct({
  type: Schema.Literal("compound"),
  children: Schema.Array(
    Schema.Union([
      TypeSelectorSchema,
      ClassSelectorSchema,
      IdSelectorSchema,
      AttributeSelectorSchema,
      PseudoClassSelectorSchema,
      PseudoElementSelectorSchema,
    ]),
  ),
});

export type CompoundSelector = Schema.Schema.Type<typeof CompoundSelectorSchema>;

export const ComplexSelectorSchema = Schema.Struct({
  type: Schema.Literal("complex"),
  children: Schema.Array(
    Schema.Union([CompoundSelectorSchema, CombinatorSchema]),
  ),
  specificity: SpecificitySchema,
});

export type ComplexSelector = Schema.Schema.Type<typeof ComplexSelectorSchema>;

export const SelectorNodeSchema = Schema.Union([
  TypeSelectorSchema,
  ClassSelectorSchema,
  IdSelectorSchema,
  AttributeSelectorSchema,
  PseudoClassSelectorSchema,
  PseudoElementSelectorSchema,
  CombinatorSchema,
  CompoundSelectorSchema,
  ComplexSelectorSchema,
]);

export type SelectorNode = Schema.Schema.Type<typeof SelectorNodeSchema>;

export const specificityToNumber = (s: Specificity): number => s.a * 65536 + s.b * 256 + s.c;

export const compareSpecificity = (a: Specificity, b: Specificity): number => {
  if (a.a !== b.a) return b.a - a.a;
  if (a.b !== b.b) return b.b - a.b;
  return b.c - a.c;
};
