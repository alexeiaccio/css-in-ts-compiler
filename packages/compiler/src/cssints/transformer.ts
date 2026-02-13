/**
 * CSSints Transformer - Simple regex-based transformer for css.* function calls
 *
 * This is a simplified version that uses regex patterns to find and replace
 * css.* function calls. For production, you'd want to use OXC AST-based approach.
 */

import * as cssints from "./index";
import { registry, StyleEntry } from "./registry";
import { generateHash } from "./hash";

export interface TransformOptions {
	debug?: boolean;
}

export function transformCode(code: string, fileId: string, options: TransformOptions = {}): {
	code: string;
	css: string;
} {
	const debug = options.debug || false;

	// Find cssints imports
	const importRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]cssints['"]\s+with\s*\{[^}]*type:\s*['"]cssints['"][^}]*\}/;
	const importMatch = code.match(importRegex);
	
	if (!importMatch) {
		return { code, css: "" };
	}

	const cssVar = importMatch[1] as string; // e.g., "css" from `import * as css from "cssints"`

	// Find all css.* function calls
	// Pattern: css.functionName(args)
	const callPattern = new RegExp(`${cssVar}\\.(\\w+)\\s*\\(([^)]*)\\)`, 'g');
	
	let hasChanges = false;
	let transformedCode = code;
	const replacements: { start: number; end: number; replacement: string }[] = [];

	let match = callPattern.exec(code);
	while (match !== null) {
		const fullMatch = match[0];
		const fnName = match[1] as string;
		const argsStr = match[2] as string;
		
		const start = match.index as number;
		const end = start + fullMatch.length;

		// Get the cssints function
		const cssintsFn = (cssints as any)[fnName];
		
		if (typeof cssintsFn !== "function") {
			if (debug) {
				console.log(`[cssints] Unknown function: css.${fnName}`);
			}
			continue;
		}

		// Parse arguments
		const args = parseArguments(argsStr);
		
		// Evaluate the function
		let result: any;
		try {
			result = cssintsFn(...args);
		} catch (e) {
			if (debug) {
				console.error(`[cssints] Error evaluating css.${fnName}(${argsStr}):`, e);
			}
			continue;
		}

		// Convert result to CSS properties
		const cssProps = normalizeResult(result);
		
		if (!cssProps || Object.keys(cssProps).length === 0) {
			if (debug) {
				console.log(`[cssints] No CSS properties from css.${fnName}(${argsStr})`);
			}
			continue;
		}

		// Generate class name
		const className = generateClassName(cssProps);
		
		// Register the style
		registry.register({
			fileId,
			className,
			properties: cssProps,
		});

		// Store replacement
		replacements.push({
			start,
			end,
			replacement: `"${className}"`,
		});

		hasChanges = true;

		if (debug) {
			console.log(`[cssints] css.${fnName}(${argsStr}) → "${className}"`);
		}
	}

	if (!hasChanges) {
		return { code, css: "" };
	}

	// Apply replacements (in reverse order to maintain correct positions)
	const sortedReplacements = replacements.sort((a, b) => b.start - a.start);
	
	for (const { start, end, replacement } of sortedReplacements) {
		transformedCode = transformedCode.slice(0, start) + replacement + transformedCode.slice(end);
	}

	// Generate CSS
	const css = registry.generateCSS(fileId);

	return {
		code: transformedCode,
		css,
	};
}

function parseArguments(argsStr: string): any[] {
	if (!argsStr.trim()) return [];

	const args: any[] = [];
	let current = "";
	let depth = 0;
	let inString = false;
	let stringChar = "";

	for (let i = 0; i < argsStr.length; i++) {
		const char = argsStr[i];

		if ((char === '"' || char === "'") && argsStr[i - 1] !== '\\') {
			if (!inString) {
				inString = true;
				stringChar = char;
				current += char;
			} else if (char === stringChar) {
				inString = false;
				current += char;
			} else {
				current += char;
			}
		} else if (!inString) {
			if (char === '(' || char === '[' || char === '{') {
				depth++;
				current += char;
			} else if (char === ')' || char === ']' || char === '}') {
				depth--;
				current += char;
			} else if (char === ',' && depth === 0) {
				args.push(parseValue(current.trim()));
				current = "";
			} else {
				current += char;
			}
		} else {
			current += char;
		}
	}

	if (current.trim()) {
		args.push(parseValue(current.trim()));
	}

	return args;
}

function parseValue(value: string): any {
	if (!value) return undefined;
	
	// String literal
	if ((value.startsWith('"') && value.endsWith('"')) || 
	    (value.startsWith("'") && value.endsWith("'"))) {
		return value.slice(1, -1);
	}

	// Number
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return parseFloat(value);
	}

	// Boolean
	if (value === "true") return true;
	if (value === "false") return false;

	// Object literal - simplified (would need proper parsing for complex cases)
	if (value.startsWith("{") && value.endsWith("}")) {
		return parseObjectLiteral(value);
	}

	// Array literal
	if (value.startsWith("[") && value.endsWith("]")) {
		const inner = value.slice(1, -1);
		return parseArguments(inner);
	}

	// Undefined/null
	if (value === "undefined") return undefined;
	if (value === "null") return null;

	// Identifier - might be a CSS keyword or variable reference
	return value;
}

function parseObjectLiteral(str: string): Record<string, any> {
	const inner = str.slice(1, -1);
	const result: Record<string, any> = {};
	
	if (!inner.trim()) return result;

	let current = "";
	let depth = 0;
	let inString = false;
	let stringChar = "";
	let key = "";

	for (let i = 0; i < inner.length; i++) {
		const char = inner[i];

		if ((char === '"' || char === "'") && inner[i - 1] !== '\\') {
			if (!inString) {
				inString = true;
				stringChar = char;
			} else if (char === stringChar) {
				inString = false;
			}
			current += char;
		} else if (!inString) {
			if (char === ':' && depth === 0 && !key) {
				key = current.trim();
				current = "";
			} else if (char === ',' && depth === 0) {
				result[key] = parseValue(current.trim());
				key = "";
				current = "";
			} else if (char === '(' || char === '[' || char === '{') {
				depth++;
				current += char;
			} else if (char === ')' || char === ']' || char === '}') {
				depth--;
				current += char;
			} else {
				current += char;
			}
		} else {
			current += char;
		}
	}

	if (key && current.trim()) {
		result[key] = parseValue(current.trim());
	}

	return result;
}

function normalizeResult(result: any): Record<string, any> | null {
	if (!result) return null;
	if (typeof result !== "object") return null;
	return result;
}

function generateClassName(properties: Record<string, any>): string {
	const hash = generateHash(JSON.stringify(properties));
	return `x${hash}`;
}

export { registry };
