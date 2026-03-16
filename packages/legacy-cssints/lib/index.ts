/**
 * CSS-in-TS Library
 *
 * Type-safe CSS utilities with:
 * - Generated CSS property functions from VS Code + csstree data
 * - Generated types for all CSS value types
 * - csstree-based AST for CSS generation
 */

// Generated types
export * from "../src/generated/types.gen.js";

// Core
export { Style, createStyle, createPropertyFn, type StyleOptions, type CSSPropertyFn } from "../src/core/style.js";
export {
	parseValue,
	generateCSS,
	parseSyntaxDef,
	createValueAST,
	type Value,
	type CssNode,
	type DSNodeGroup,
} from "../src/core/ast.js";

// Generated property functions
export * from "../src/generated/properties.gen.js";

// Generated composable utilities
export * from "../src/generated/composables.gen.js";

// CSS map for dynamic property access
export { CSS, type CSSPropertyName } from "../src/generated/css-map.gen.js";
