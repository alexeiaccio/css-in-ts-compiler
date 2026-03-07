import { Schema } from "effect";

export const KeywordNodeSchema = Schema.Struct({
	type: Schema.Literal("keyword"),
	value: Schema.String,
});

export type KeywordNode = Schema.Schema.Type<typeof KeywordNodeSchema>;

export const IdentNodeSchema = Schema.Struct({
	type: Schema.Literal("ident"),
	value: Schema.String,
});

export type IdentNode = Schema.Schema.Type<typeof IdentNodeSchema>;

export const NumberNodeSchema = Schema.Struct({
	type: Schema.Literal("number"),
	value: Schema.String,
	number: Schema.Number,
});

export type NumberNode = Schema.Schema.Type<typeof NumberNodeSchema>;

export const DimensionNodeSchema = Schema.Struct({
	type: Schema.Literal("dimension"),
	value: Schema.String,
	number: Schema.Number,
	unit: Schema.String,
});

export type DimensionNode = Schema.Schema.Type<typeof DimensionNodeSchema>;

export const PercentageNodeSchema = Schema.Struct({
	type: Schema.Literal("percentage"),
	value: Schema.String,
	number: Schema.Number,
});

export type PercentageNode = Schema.Schema.Type<typeof PercentageNodeSchema>;

export const StringNodeSchema = Schema.Struct({
	type: Schema.Literal("string"),
	value: Schema.String,
});

export type StringNode = Schema.Schema.Type<typeof StringNodeSchema>;

export const UrlNodeSchema = Schema.Struct({
	type: Schema.Literal("url"),
	value: Schema.String,
});

export type UrlNode = Schema.Schema.Type<typeof UrlNodeSchema>;

export const BaseCSSValueNodeSchema = Schema.Union([
	KeywordNodeSchema,
	IdentNodeSchema,
	NumberNodeSchema,
	DimensionNodeSchema,
	PercentageNodeSchema,
	StringNodeSchema,
	UrlNodeSchema,
]);

export type BaseCSSValueNode =
	| KeywordNode
	| IdentNode
	| NumberNode
	| DimensionNode
	| PercentageNode
	| StringNode
	| UrlNode;

export const CompositeNodeSchema = Schema.Struct({
	type: Schema.Literal("composite"),
	nodes: Schema.Array(BaseCSSValueNodeSchema),
	combinator: Schema.Union([Schema.Literal(" "), Schema.Literal("|"), Schema.Literal("||"), Schema.Literal("&&")]),
});

export type CompositeNode = Schema.Schema.Type<typeof CompositeNodeSchema>;

export const FunctionNodeSchema = Schema.Struct({
	type: Schema.Literal("function"),
	name: Schema.String,
	args: Schema.Array(BaseCSSValueNodeSchema),
});

export type FunctionNode = Schema.Schema.Type<typeof FunctionNodeSchema>;

export const FullCSSValueNodeSchema = Schema.Union([
	KeywordNodeSchema,
	IdentNodeSchema,
	NumberNodeSchema,
	DimensionNodeSchema,
	PercentageNodeSchema,
	StringNodeSchema,
	UrlNodeSchema,
	FunctionNodeSchema,
	CompositeNodeSchema,
]);

export type FullCSSValueNode =
	| KeywordNode
	| IdentNode
	| NumberNode
	| DimensionNode
	| PercentageNode
	| StringNode
	| UrlNode
	| FunctionNode
	| CompositeNode;
