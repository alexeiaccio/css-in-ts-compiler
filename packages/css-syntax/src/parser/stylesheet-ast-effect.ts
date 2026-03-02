import { Schema } from "effect";

export const CSSDeclarationSchema = Schema.Struct({
  type: Schema.Literal("declaration"),
  property: Schema.String,
  value: Schema.String,
  important: Schema.Boolean,
  bang: Schema.optional(Schema.Boolean),
});

export type CSSDeclaration = Schema.Schema.Type<typeof CSSDeclarationSchema>;

export const CSSInvalidDeclarationSchema = Schema.Struct({
  type: Schema.Literal("invalid-declaration"),
  raw: Schema.String,
});

export type CSSInvalidDeclaration = Schema.Schema.Type<typeof CSSInvalidDeclarationSchema>;

export const CSSCommentSchema = Schema.Struct({
  type: Schema.Literal("comment"),
  value: Schema.String,
});

export type CSSComment = Schema.Schema.Type<typeof CSSCommentSchema>;

export const CSSBlockChildSchema = Schema.Union([
  CSSDeclarationSchema,
  CSSInvalidDeclarationSchema,
]);

export type CSSBlockChild = CSSDeclaration | CSSInvalidDeclaration;

export const CSSBlockSchema = Schema.Struct({
  type: Schema.Literal("block"),
  children: Schema.Array(CSSBlockChildSchema),
});

export type CSSBlock = Schema.Schema.Type<typeof CSSBlockSchema>;

export const CSSImportRuleSchema = Schema.Struct({
  type: Schema.Literal("import"),
  url: Schema.String,
  media: Schema.optional(Schema.String),
});

export type CSSImportRule = Schema.Schema.Type<typeof CSSImportRuleSchema>;

export const CSSKeyframeRuleSchema = Schema.Struct({
  type: Schema.Literal("keyframe"),
  selectors: Schema.Array(Schema.String),
  declarations: Schema.Array(CSSDeclarationSchema),
});

export type CSSKeyframeRule = Schema.Schema.Type<typeof CSSKeyframeRuleSchema>;

export const CSSKeyframesRuleSchema = Schema.Struct({
  type: Schema.Literal("keyframes"),
  name: Schema.String,
  children: Schema.Array(CSSKeyframeRuleSchema),
});

export type CSSKeyframesRule = Schema.Schema.Type<typeof CSSKeyframesRuleSchema>;

export const CSSSupportsRuleSchema = Schema.Struct({
  type: Schema.Literal("supports"),
  condition: Schema.String,
  children: Schema.Array(Schema.Unknown),
});

export type CSSSupportsRule = Schema.Schema.Type<typeof CSSSupportsRuleSchema>;

export const CSSMediaRuleSchema = Schema.Struct({
  type: Schema.Literal("media"),
  media: Schema.String,
  children: Schema.Array(Schema.Unknown),
});

export type CSSMediaRule = Schema.Schema.Type<typeof CSSMediaRuleSchema>;

export const CSSContainerRuleSchema = Schema.Struct({
  type: Schema.Literal("container"),
  prelude: Schema.String,
  children: Schema.Array(Schema.Unknown),
});

export type CSSContainerRule = Schema.Schema.Type<typeof CSSContainerRuleSchema>;

export const CSSLayerRuleSchema = Schema.Struct({
  type: Schema.Literal("layer"),
  name: Schema.optional(Schema.String),
  children: Schema.Array(Schema.Unknown),
});

export type CSSLayerRule = Schema.Schema.Type<typeof CSSLayerRuleSchema>;

export const CSSNestedStyleRuleSchema = Schema.Struct({
  type: Schema.Literal("nested-style"),
  selector: Schema.String,
  declarations: Schema.Array(CSSDeclarationSchema),
  children: Schema.optional(Schema.Array(Schema.Unknown)),
});

export type CSSNestedStyleRule = Schema.Schema.Type<typeof CSSNestedStyleRuleSchema>;

export const CSSAtRuleSchema = Schema.Struct({
  type: Schema.Literal("at-rule"),
  name: Schema.String,
  prelude: Schema.optional(Schema.String),
  block: Schema.optional(CSSBlockSchema),
  children: Schema.optional(Schema.Array(Schema.Unknown)),
});

export type CSSAtRule = Schema.Schema.Type<typeof CSSAtRuleSchema>;

export const CSSStyleRuleSchema = Schema.Struct({
  type: Schema.Literal("style"),
  selector: Schema.String,
  selectors: Schema.optional(Schema.Array(Schema.String)),
  declarations: Schema.Array(CSSDeclarationSchema),
  children: Schema.optional(Schema.Array(Schema.Unknown)),
});

export type CSSStyleRule = Schema.Schema.Type<typeof CSSStyleRuleSchema>;

export const CSSRuleSchema = Schema.Union([
  CSSStyleRuleSchema,
  CSSAtRuleSchema,
  CSSNestedStyleRuleSchema,
  CSSLayerRuleSchema,
  CSSContainerRuleSchema,
  CSSMediaRuleSchema,
  CSSSupportsRuleSchema,
  CSSKeyframesRuleSchema,
  CSSImportRuleSchema,
]);

export type CSSRule = Schema.Schema.Type<typeof CSSRuleSchema>;

export const CSSStyleSheetSchema = Schema.Struct({
  type: Schema.Literal("stylesheet"),
  children: Schema.Array(CSSRuleSchema),
});

export type CSSStyleSheet = Schema.Schema.Type<typeof CSSStyleSheetSchema>;
