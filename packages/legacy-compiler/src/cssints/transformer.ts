/**
 * CSSints Transformer - Simple regex-based transformer for css.* function calls
 *
 * This is a simplified version that uses regex patterns to find and replace
 * css.* function calls. For production, you'd want to use OXC AST-based approach.
 */

import { generateHash } from "./hash";
import * as cssints from "./index";
import { registry, StyleEntry } from "./registry";

export interface TransformOptions {
	debug?: boolean;
	plugins?: string[];
}

interface PluginFunction {
	name: string;
	fn: (...args: any[]) => any;
}

const pluginRegistry = new Map<string, PluginFunction>();

export function transformCode(code: string, fileId: string, options: TransformOptions = {}): {
	code: string;
	css: string;
} {
	const debug = options.debug || false;

	// Load plugins if specified
	if (options.plugins) {
		loadPlugins(options.plugins, debug);
	}

	// Find cssints imports (both namespace and named imports)
	const namespaceImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]cssints['"]\s+with\s*\{[^}]*type:\s*['"]cssints['"][^}]*\}/;
	const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"](@cssints\/[^'"]+)['"]\s+with\s*\{[^}]*type:\s*['"]cssints['"][^}]*\}/;

	const namespaceMatch = code.match(namespaceImportRegex);
	const namedMatch = code.match(namedImportRegex);

	const importedNames = new Map<string, string>();

	if (namespaceMatch) {
		const cssVar = namespaceMatch[1] as string;
		importedNames.set(cssVar, "namespace");
	}

	if (namedMatch) {
		const namesStr = namedMatch[1];
		if (namesStr) {
			const names = namesStr.split(",").map((n) => n.trim().replace(/as\s+\w+$/, "").trim());
			for (const name of names) {
				importedNames.set(name, "named");
			}
		}
	}

	if (importedNames.size === 0) {
		return { code, css: "" };
	}

	const cssVar = namespaceMatch ? namespaceMatch[1] as string : "";

	let hasChanges = false;
	let transformedCode = code;
	const replacements: { start: number; end: number; replacement: string }[] = [];

	// Handle namespace imports (css.* function calls)
	if (cssVar) {
		const callPattern = new RegExp(`${cssVar}\\.(\\w+)\\s*\\(([^)]*)\\)`, 'g');

		let match = callPattern.exec(code);
		while (match !== null) {
			const fullMatch = match[0];
			const fnName = match[1] as string;
			const argsStr = match[2] as string;

			const start = match.index as number;
			const end = start + fullMatch.length;

			// Try cssints function first
			const cssintsFn = (cssints as any)[fnName];

			// Try plugin function
			const pluginFn = pluginRegistry.get(fnName);

			if (typeof cssintsFn === "function") {
				processFunctionCall(cssintsFn, fnName, argsStr, start, end, fileId, debug, replacements);
				hasChanges = true;
			} else if (pluginFn) {
				processFunctionCall(pluginFn.fn, fnName, argsStr, start, end, fileId, debug, replacements);
				hasChanges = true;
			} else if (debug) {
				console.log(`[cssints] Unknown function: ${cssVar}.${fnName}`);
			}

			match = callPattern.exec(code);
		}
	}

	// Handle named imports (direct function calls like icon())
	for (const [name] of importedNames) {
		if (!cssVar || name !== cssVar) {
			const callPattern = new RegExp(`\\b${name}\\s*\\(([^)]*)\\)`, 'g');

			let match = callPattern.exec(code);
			while (match !== null) {
				const fullMatch = match[0];
				const argsStr = match[1] as string;

				const start = match.index as number;
				const end = start + fullMatch.length;

				const pluginFn = pluginRegistry.get(name);

				if (pluginFn) {
					processFunctionCall(pluginFn.fn, name, argsStr, start, end, fileId, debug, replacements);
					hasChanges = true;
				} else if (debug) {
					console.log(`[cssints] Unknown function: ${name}()`);
				}

				match = callPattern.exec(code);
			}
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

		if ((char === '"' || char === "'") && argsStr[i - 1] !== "\\") {
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
			if (char === "(" || char === "[" || char === "{") {
				depth++;
				current += char;
			} else if (char === ")" || char === "]" || char === "}") {
				depth--;
				current += char;
			} else if (char === "," && depth === 0) {
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
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

		if ((char === '"' || char === "'") && inner[i - 1] !== "\\") {
			if (!inString) {
				inString = true;
				stringChar = char;
			} else if (char === stringChar) {
				inString = false;
			}
			current += char;
		} else if (!inString) {
			if (char === ":" && depth === 0 && !key) {
				key = current.trim();
				current = "";
			} else if (char === "," && depth === 0) {
				result[key] = parseValue(current.trim());
				key = "";
				current = "";
			} else if (char === "(" || char === "[" || char === "{") {
				depth++;
				current += char;
			} else if (char === ")" || char === "]" || char === "}") {
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

function processFunctionCall(
	fn: (...args: any[]) => any,
	fnName: string,
	argsStr: string,
	start: number,
	end: number,
	fileId: string,
	debug: boolean,
	replacements: { start: number; end: number; replacement: string }[],
): void {
	const args = parseArguments(argsStr);

	let result: any;
	try {
		result = fn(...args);
	} catch (e) {
		if (debug) {
			console.error(`[cssints] Error evaluating ${fnName}(${argsStr}):`, e);
		}
		return;
	}

	const cssProps = normalizeResult(result);

	if (!cssProps || Object.keys(cssProps).length === 0) {
		if (debug) {
			console.log(`[cssints] No CSS properties from ${fnName}(${argsStr})`);
		}
		return;
	}

	const className = generateClassName(cssProps);

	registry.register({
		fileId,
		className,
		properties: cssProps,
	});

	replacements.push({
		start,
		end,
		replacement: `"${className}"`,
	});

	if (debug) {
		console.log(`[cssints] ${fnName}(${argsStr}) → "${className}"`);
	}
}

function loadPlugins(pluginPackages: string[], debug: boolean): void {
	for (const pkg of pluginPackages) {
		try {
			const plugin = require(pkg);

			for (const [name, fn] of Object.entries(plugin)) {
				if (typeof fn === "function") {
					pluginRegistry.set(name, { name, fn: fn as (...args: any[]) => any });
					if (debug) {
						console.log(`[cssints] Registered plugin function: ${name} from ${pkg}`);
					}
				}
			}
		} catch (e) {
			if (debug) {
				console.warn(`[cssints] Failed to load plugin ${pkg}:`, e);
			}
		}
	}
}
