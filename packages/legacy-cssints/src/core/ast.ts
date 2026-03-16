/**
 * CSS AST Utilities
 *
 * Utilities for parsing and generating CSS using csstree.
 */

import type { CssNode, Value, DSNodeGroup } from "css-tree";

import { parse, generate, definitionSyntax } from "css-tree";

// ============================================================================
// Parse CSS Value
// ============================================================================

/**
 * Parse a CSS value string into csstree AST
 */
export function parseValue(value: string): Value {
	return parse(value, { context: "value" }) as Value;
}

/**
 * Parse a CSS declaration value
 */
export function parseDeclaration(property: string, value: string): CssNode {
	return parse(`${property}: ${value};`, { context: "declaration" });
}

// ============================================================================
// Parse Definition Syntax
// ============================================================================

/**
 * Parse a CSS syntax definition string (e.g., "<length> | <percentage>")
 */
export function parseSyntaxDef(syntax: string): DSNodeGroup {
	return definitionSyntax.parse(syntax);
}

/**
 * Generate syntax string from AST
 */
export function generateSyntax(syntaxAst: DSNodeGroup): string {
	return definitionSyntax.generate(syntaxAst);
}

// ============================================================================
// Generate CSS
// ============================================================================

/**
 * Generate CSS string from csstree AST
 */
export function generateCSS(ast: CssNode): string {
	return generate(ast);
}

/**
 * Generate CSS declaration string
 */
export function generateDeclaration(property: string, value: string): string {
	return `${property}: ${value};`;
}

// ============================================================================
// AST Creation Helpers
// ============================================================================

/**
 * Create a simple identifier AST node
 */
export function createIdentifier(name: string): { type: "Identifier"; name: string } {
	return { type: "Identifier", name };
}

/**
 * Create a simple number AST node
 */
export function createNumber(value: string): { type: "Number"; value: string } {
	return { type: "Number", value };
}

/**
 * Create a dimension AST node (e.g., "12px")
 */
export function createDimension(value: string, unit: string): { type: "Dimension"; value: string; unit: string } {
	return { type: "Dimension", value, unit };
}

/**
 * Create a percentage AST node
 */
export function createPercentage(value: string): { type: "Percentage"; value: string } {
	return { type: "Percentage", value };
}

/**
 * Create a simple value AST from a string
 */
export function createValueAST(value: string): Value {
	// Try to parse, fallback to raw value
	try {
		return parseValue(value);
	} catch {
		// If parsing fails, create a raw value node
		return {
			type: "Value",
			children: [],
		};
	}
}

// ============================================================================
// Value Analysis
// ============================================================================

/**
 * Check if a value is a CSS keyword (unquoted identifier)
 */
export function isKeyword(value: string): boolean {
	return /^[a-z-]+$/i.test(value);
}

/**
 * Check if a value is a number
 */
export function isNumber(value: string): boolean {
	return /^-?\d+(\.\d+)?$/.test(value);
}

/**
 * Check if a value has a unit (e.g., "12px", "1.5rem")
 */
export function hasUnit(value: string): boolean {
	return /^-?\d+(\.\d+)?[a-z%]+$/i.test(value);
}

/**
 * Extract unit from a value string
 */
export function extractUnit(value: string): { number: string; unit: string } | null {
	const match = value.match(/^(-?\d+(?:\.\d+)?)([a-z%]+)$/i);
	if (match) {
		return { number: match[1], unit: match[2] };
	}
	return null;
}

// ============================================================================
// Type Exports
// ============================================================================

export type { CssNode, Value, DSNodeGroup } from "css-tree";
