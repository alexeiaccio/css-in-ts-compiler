/**
 * LightningCSS NAPI Bindings
 * Parse CSS to AST, serialize AST to CSS.
 *
 * Uses lightningcss's serde format which matches the ast.d.ts types.
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load native module — the binary name includes platform/arch
const binaryName = `lightningcss-napi.${process.platform}-${process.arch}.node`;
const native = require(join(__dirname, "..", binaryName));

// ============================================================================
// Re-export AST types
// ============================================================================

export type {
	StyleSheet,
	Rule,
	Declaration,
	CssColor,
	Length,
	LengthValue,
	DimensionPercentage_for_LengthValue as LengthPercentage,
	Angle,
	Time,
	Resolution,
	Ratio,
	PropertyId,
	Token,
	TokenOrValue,
	Selector,
	SelectorComponent,
	MediaCondition,
	MediaQuery,
} from "./ast.js";

// ============================================================================
// Options types (mirrors Rust ParseOptions / PrinterOptionsJS)
// ============================================================================

export interface ParseOptions {
	/** Source filename for error messages */
	filename?: string;
	/** Recover from parse errors instead of throwing */
	errorRecovery?: boolean;
}

export interface PrinterOptions {
	/** Minify the output CSS */
	minify?: boolean;
	/** Generate source map */
	sourceMap?: boolean;
}

// ============================================================================
// Re-exported AST type (alias for clarity)
// ============================================================================

import type { StyleSheet, Length, CssColor, DimensionPercentage_for_LengthValue as LengthPercentage } from "./ast.js";

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a CSS string into a StyleSheet AST.
 *
 * @example
 * ```ts
 * const ast = parse(".foo { color: red; padding: 16px; }");
 * ast.rules[0].type; // "style"
 * ```
 */
export function parse(css: string, options?: ParseOptions): StyleSheet {
	return native.parse(css, options) as StyleSheet;
}

/**
 * Serialize a StyleSheet AST back to a CSS string.
 *
 * @example
 * ```ts
 * const ast = parse(".foo { color: red; }");
 * toCss(ast, { minify: true }); // ".foo{color:red}"
 * ```
 */
export function toCss(ast: StyleSheet, options?: PrinterOptions): string {
	return native.toCss(ast, options);
}

/**
 * Serialize any AST node to CSS string. Auto-detects the node type.
 *
 * Supports: StyleSheet, Length, LengthPercentage, CssColor.
 *
 * @example
 * ```ts
 * toCssString({ type: "value", value: { unit: "px", value: 16 } }); // "16px"
 * toCssString({ type: "rgb", r: 255, g: 0, b: 0, alpha: 1 }); // "red"
 * ```
 */
export function toCssString(node: Length | LengthPercentage | CssColor | StyleSheet, options?: PrinterOptions): string {
	return native.toCssString(node, options);
}

/**
 * Serialize a Length AST node to CSS string.
 *
 * @example
 * ```ts
 * toCssLength({ type: "value", value: { unit: "px", value: 16 } }); // "16px"
 * ```
 */
export function toCssLength(ast: Length): string {
	return native.toCssLength(ast);
}

/**
 * Serialize a CssColor AST node to CSS string.
 *
 * @example
 * ```ts
 * toCssColor({ type: "rgb", r: 255, g: 0, b: 0, alpha: 1 }); // "red"
 * ```
 */
export function toCssColor(ast: CssColor): string {
	return native.toCssColor(ast);
}

/**
 * Serialize a LengthPercentage AST node to CSS string.
 *
 * @example
 * ```ts
 * toCssLengthPercentage({ type: "dimension", value: { unit: "em", value: 1.5 } }); // "1.5em"
 * ```
 */
export function toCssLengthPercentage(ast: LengthPercentage): string {
	return native.toCssLengthPercentage(ast);
}
