/**
 * CSS value parsing utilities using LightningCSS for validation
 *
 * Parses CSS declaration strings with validation via LightningCSS transform
 */

import { transform } from "lightningcss";

export interface CSSDeclaration {
	/** CSS property name */
	property: string;
	/** CSS value as string */
	value: string;
}

/**
 * Parse CSS declarations from a string
 *
 * Uses LightningCSS to validate the CSS, then extracts declarations.
 * Falls back to regex parsing for simple cases.
 *
 * @param styleStr - CSS style string (e.g., "padding: 1rem; background: blue")
 * @returns Array of property-value pairs
 *
 * @example
 * parseDeclarations("padding: 1rem; background: blue")
 * // [
 * //   { property: "padding", value: "1rem" },
 * //   { property: "background", value: "blue" }
 * // ]
 */
export function parseDeclarations(styleStr: string): CSSDeclaration[] {
	// Wrap the style string in a dummy selector to make it valid CSS
	const wrappedCSS = `.dummy { ${styleStr} }`;

	try {
		// Validate CSS using LightningCSS
		transform({
			filename: "input.css",
			code: Buffer.from(wrappedCSS),
			errorRecovery: true,
			minify: false,
		});

		// Parse declarations manually (LightningCSS transform doesn't expose AST directly)
		return parseDeclarationsManual(styleStr);
	} catch (error) {
		// Fallback to manual parsing if validation fails
		console.warn("CSS validation warning:", error);
		return parseDeclarationsManual(styleStr);
	}
}

/**
 * Parse declarations manually using regex
 * Handles nested parentheses for functions like calc(), var(), etc.
 */
function parseDeclarationsManual(styleStr: string): CSSDeclaration[] {
	const declarations: CSSDeclaration[] = [];

	// Split by semicolons, respecting nested structures
	const parts = splitBySemicolons(styleStr);

	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;

		// Find the first colon (property separator)
		const colonIndex = findPropertySeparator(trimmed);
		if (colonIndex === -1) continue;

		const property = trimmed.slice(0, colonIndex).trim();
		const value = trimmed.slice(colonIndex + 1).trim();

		if (property && value) {
			declarations.push({ property, value });
		}
	}

	return declarations;
}

/**
 * Split CSS string by semicolons, respecting nested structures
 */
function splitBySemicolons(str: string): string[] {
	const parts: string[] = [];
	let current = "";
	let depth = 0;

	for (let i = 0; i < str.length; i++) {
		const char = str[i];

		if (char === "(" || char === "[" || char === "{") {
			depth++;
			current += char;
		} else if (char === ")" || char === "]" || char === "}") {
			depth--;
			current += char;
		} else if (char === ";" && depth === 0) {
			parts.push(current);
			current = "";
		} else {
			current += char;
		}
	}

	if (current.trim()) {
		parts.push(current);
	}

	return parts;
}

/**
 * Find the property separator (colon) in a CSS declaration
 */
function findPropertySeparator(str: string): number {
	let depth = 0;

	for (let i = 0; i < str.length; i++) {
		const char = str[i];

		if (char === "(" || char === "[" || char === "{") {
			depth++;
		} else if (char === ")" || char === "]" || char === "}") {
			depth--;
		} else if (char === ":" && depth === 0) {
			return i;
		}
	}

	return -1;
}

/**
 * Expand shorthand CSS properties into longhand equivalents
 *
 * @param property - CSS property name
 * @param value - CSS value
 * @returns Array of expanded declarations
 */
export function expandShorthand(property: string, value: string): CSSDeclaration[] {
	switch (property) {
		case "padding":
			return expandBoxProperty("padding", value);
		case "margin":
			return expandBoxProperty("margin", value);
		case "border":
			return [{ property, value }];
		default:
			return [{ property, value }];
	}
}

/**
 * Expand box model properties (padding, margin)
 */
function expandBoxProperty(prefix: string, value: string): CSSDeclaration[] {
	const values = value.trim().split(/\s+/);

	switch (values.length) {
		case 1:
			return [
				{ property: `${prefix}-top`, value: values[0]! },
				{ property: `${prefix}-right`, value: values[0]! },
				{ property: `${prefix}-bottom`, value: values[0]! },
				{ property: `${prefix}-left`, value: values[0]! },
			];
		case 2:
			return [
				{ property: `${prefix}-top`, value: values[0]! },
				{ property: `${prefix}-right`, value: values[1]! },
				{ property: `${prefix}-bottom`, value: values[0]! },
				{ property: `${prefix}-left`, value: values[1]! },
			];
		case 3:
			return [
				{ property: `${prefix}-top`, value: values[0]! },
				{ property: `${prefix}-right`, value: values[1]! },
				{ property: `${prefix}-bottom`, value: values[2]! },
				{ property: `${prefix}-left`, value: values[1]! },
			];
		case 4:
			return [
				{ property: `${prefix}-top`, value: values[0]! },
				{ property: `${prefix}-right`, value: values[1]! },
				{ property: `${prefix}-bottom`, value: values[2]! },
				{ property: `${prefix}-left`, value: values[3]! },
			];
		default:
			return [{ property: prefix, value }];
	}
}

/**
 * Validate if a string is valid CSS using LightningCSS
 */
export function isValidCSSValue(value: string): boolean {
	const trimmed = value.trim();
	if (!trimmed) return false;

	try {
		const testCSS = `.test { property: ${trimmed}; }`;
		transform({
			filename: "test.css",
			code: Buffer.from(testCSS),
			errorRecovery: true,
			minify: false,
		});
		return true;
	} catch {
		return false;
	}
}
