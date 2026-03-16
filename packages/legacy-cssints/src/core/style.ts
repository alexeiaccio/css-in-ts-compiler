/**
 * Style Class - Core TaggedClass for CSS Property Values
 *
 * All CSS property functions return a Style instance containing:
 * - Property name
 * - CSS value string
 * - csstree AST for CSS generation
 * - Metadata (description, syntax, browser compat)
 */

import { generate, type CssNode } from "css-tree";
import { Schema } from "effect";

// ============================================================================
// CSS AST Schema (using csstree types)
// ============================================================================

export const CssValueSchema = Schema.Unknown as Schema.Schema<CssNode>;

// ============================================================================
// Style TaggedClass
// ============================================================================

export class Style extends Schema.TaggedClass<Style>()("Style", {
	/** CSS property name (e.g., "color", "padding") */
	property: Schema.String,
	/** CSS value as string (e.g., "red", "12px") */
	value: Schema.String,
	/** CSS property description from VS Code data */
	description: Schema.optional(Schema.String),
	/** CSS syntax string (e.g., "<color>", "<length> | <percentage>") */
	syntax: Schema.optional(Schema.String),
	/** Browser compatibility array (e.g., ["E12", "FF1", "S1", "C1"]) */
	browserCompat: Schema.optional(Schema.Array(Schema.String)),
	/** Baseline status from VS Code data */
	baseline: Schema.optional(
		Schema.Struct({
			status: Schema.Union([Schema.Literal("high"), Schema.Literal("low"), Schema.Literal("false")]),
			baseline_low_date: Schema.optional(Schema.String),
			baseline_high_date: Schema.optional(Schema.String),
		}),
	),
	/** csstree AST for the value */
	ast: CssValueSchema,
}) {
	/** Get the CSS declaration string (e.g., "color: red") */
	get declaration(): [string, string] {
		return [this.property, this.value];
	}
	/** Generate CSS string from AST */
	toCSS(): string {
		return generate(this.ast);
	}
}

type StyleType = typeof Style.Type;

/**
 * Create a Style instance
 */
export function createStyle(options: StyleType): Style {
	return Style.makeUnsafe(options);
}

// ============================================================================
// Type Helper
// ============================================================================

/**
 * Branded type for CSS property functions
 */
export type CSSPropertyFn<P extends string = string> = (value: string) => Style & { readonly property: P };

/**
 * Create a typed CSS property function
 */
export function createPropertyFn<P extends string>(
	property: P,
	options: {
		description?: string;
		syntax?: string;
		browserCompat?: string[];
		baseline?: StyleType["baseline"];
	},
): CSSPropertyFn<P> {
	return (value: string): Style & { readonly property: P } => {
		return createStyle({
			property,
			value,
			...options,
		}) as Style & { readonly property: P };
	};
}
