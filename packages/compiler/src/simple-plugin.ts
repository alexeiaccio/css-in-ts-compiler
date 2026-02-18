/**
 * Simple Vite Plugin for cssints
 * 
 * Uses regex-based transformation to convert css.* calls to class names.
 */

import type { Plugin, ResolvedConfig } from "vite";
import * as cssints from "./cssints/index";
import { generateHash } from "./cssints/hash";

interface SimplePluginOptions {
	include?: string[];
	exclude?: string[];
	cssFileName?: string;
	debug?: boolean;
}

export function cssintsPlugin(options: SimplePluginOptions = {}): Plugin {
	const {
		include = ["**/*.tsx", "**/*.ts"],
		exclude = ["**/node_modules/**"],
		cssFileName = "styles.css",
		debug = false,
	} = options;

	const styles = new Map<string, { className: string; properties: Record<string, any> }>();
	const fileStyles = new Map<string, Set<string>>();
	let config: ResolvedConfig | null = null;
	let cssCache = "";

	function matchesPattern(id: string, patterns: string[]): boolean {
		return patterns.some((pattern) => {
			const regex = new RegExp(pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*"));
			return regex.test(id);
		});
	}

	function generateClassName(props: Record<string, any>): string {
		const hash = generateHash(JSON.stringify(props));
		return `x${hash}`;
	}

	function generateCSS(): string {
		if (cssCache) return cssCache;
		const parts: string[] = [];
		for (const [, data] of styles) {
			parts.push(generateClassCSS(data.className, data.properties));
		}
		cssCache = parts.join("\n\n");
		return cssCache;
	}

	function toKebabCase(str: string): string {
		return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
	}

	function generatePropertiesCSS(props: Record<string, any>, indent = "  "): string {
		const lines: string[] = [];
		for (const [key, value] of Object.entries(props)) {
			const cssKey = toKebabCase(key);
			if (typeof value === "object" && value !== null && !key.startsWith("@") && !key.startsWith("&")) {
				lines.push(`${indent}${cssKey}: ${JSON.stringify(value)};`);
			} else if (typeof value !== "object") {
				lines.push(`${indent}${cssKey}: ${value};`);
			}
		}
		return lines.join("\n");
	}

	function generateClassCSS(className: string, props: Record<string, any>): string {
		const lines: string[] = [];
		const nested: string[] = [];

		for (const [key, value] of Object.entries(props)) {
			const cssKey = toKebabCase(key);
			if (typeof value === "object" && value !== null) {
				if (key.startsWith("@media") || key.startsWith("@")) {
					// Media queries go outside the class
					const nestedProps = generatePropertiesCSS(value as Record<string, any>, "    ");
					nested.push(`${key} {\n  .${className} {\n${nestedProps}\n  }\n}`);
				} else if (key.startsWith("&")) {
					// Pseudo-classes/elements
					const selector = key.replace("&", `.${className}`);
					const nestedProps = generatePropertiesCSS(value as Record<string, any>);
					nested.push(`${selector} {\n${nestedProps}\n}`);
				} else {
					lines.push(`  ${cssKey}: ${JSON.stringify(value)};`);
				}
			} else {
				lines.push(`  ${cssKey}: ${value};`);
			}
		}

		const parts: string[] = [];
		if (lines.length > 0) {
			parts.push(`.${className} {\n${lines.join("\n")}\n}`);
		}
		if (nested.length > 0) {
			parts.push(nested.join("\n\n"));
		}
		return parts.join("\n\n");
	}

	// Evaluate a cssints expression and return the result
	function evaluateCssintsExpr(expr: string, cssVar: string): any {
		expr = expr.trim();
		
		// Check if it's a cssints function call
		const pattern = `${cssVar}.`;
		if (!expr.startsWith(pattern)) {
			// Not a cssints call - return the expression as-is (could be a string, number, etc.)
			return parseValue(expr);
		}
		
		// Parse the function name
		let j = pattern.length;
		let fnName = "";
		while (j < expr.length && /[a-zA-Z0-9_]/.test(expr[j] ?? "")) {
			fnName += expr[j];
			j++;
		}
		
		if (!fnName || expr[j] !== "(") {
			return parseValue(expr);
		}
		
		// Find matching closing paren
		let depth = 1;
		let k = j + 1;
		while (k < expr.length && depth > 0) {
			if (expr[k] === "(") depth++;
			else if (expr[k] === ")") depth--;
			k++;
		}
		
		const argsStr = expr.slice(j + 1, k - 1);
		
		// Get the function
		const fn = (cssints as any)[fnName];
		if (typeof fn !== "function") {
			return parseValue(expr);
		}
		
		// Parse arguments (recursively evaluating nested calls)
		const args = parseArgsRecursive(argsStr, cssVar);
		
		try {
			return fn(...args);
		} catch (e) {
			return parseValue(expr);
		}
	}

	function parseArgsRecursive(str: string, cssVar: string): any[] {
		if (!str.trim()) return [];
		
		const args: any[] = [];
		let current = "";
		let depth = 0;
		let inString = false;
		let stringChar = "";

		for (let i = 0; i < str.length; i++) {
			const char = str[i];
			
			if ((char === '"' || char === "'") && str[i - 1] !== '\\') {
				if (!inString) {
					inString = true;
					stringChar = char;
				} else if (char === stringChar) {
					inString = false;
				}
				current += char;
			} else if (!inString) {
				if (char === '(' || char === '[' || char === '{') {
					depth++;
					current += char;
				} else if (char === ')' || char === ']' || char === '}') {
					depth--;
					current += char;
				} else if (char === ',' && depth === 0) {
					args.push(evaluateCssintsExpr(current.trim(), cssVar));
					current = "";
				} else {
					current += char;
				}
			} else {
				current += char;
			}
		}
		
		if (current.trim()) {
			args.push(evaluateCssintsExpr(current.trim(), cssVar));
		}
		
		return args;
	}

	return {
		name: "cssints",
		enforce: "pre",

		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},

		resolveId(id) {
			if (id === "cssints") {
				return "virtual:cssints";
			}
			return null;
		},

		load(id) {
			if (id === "virtual:cssints") {
				return "export default {};";
			}
			return null;
		},

		transform(code, id) {
			if (!matchesPattern(id, include) || matchesPattern(id, exclude)) {
				return null;
			}

			const importRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]cssints['"]\s+with\s*\{[^}]*type:\s*['"]cssints['"][^}]*\}/;
			const importMatch = code.match(importRegex);
			
			if (!importMatch) {
				return null;
			}

			const cssVar = importMatch[1]!;
			
			if (!fileStyles.has(id)) {
				fileStyles.set(id, new Set());
			}
			const currentFileStyles = fileStyles.get(id)!;

			const replacements: { start: number; end: number; className: string }[] = [];
			
			let i = 0;
			while (i < code.length) {
				const pattern = `${cssVar}.`;
				if (code.slice(i, i + pattern.length) === pattern) {
					let j = i + pattern.length;
					let fnName = "";
					while (j < code.length && /[a-zA-Z0-9_]/.test(code[j] ?? "")) {
						fnName += code[j];
						j++;
					}
					
					if (fnName && j < code.length && code[j] === "(") {
						const start = i;
						let depth = 1;
						let k = j + 1;
						while (k < code.length && depth > 0) {
							if (code[k] === "(") depth++;
							else if (code[k] === ")") depth--;
							k++;
						}
						
						const end = k;
						const argsStr = code.slice(j + 1, k - 1);
						
						const fn = (cssints as any)[fnName];
						if (typeof fn === "function") {
							const args = parseArgsRecursive(argsStr, cssVar);
							
							try {
								const result = fn(...args);
								
								if (result && typeof result === "object") {
									const className = generateClassName(result);
									
									styles.set(className, { className, properties: result });
									currentFileStyles.add(className);
									
									// Invalidate CSS cache
									cssCache = "";
									
									replacements.push({ start, end, className });
									
									if (debug) {
										console.log(`[cssints] ${cssVar}.${fnName}(${argsStr}) -> "${className}"`);
									}
								}
							} catch (e) {
								if (debug) console.error(`Error calling ${fnName}:`, e);
							}
						}
						
						i = end;
						continue;
					}
				}
				i++;
			}

			if (replacements.length === 0) {
				return null;
			}

			let transformed = code;
			for (const { start, end, className } of replacements.sort((a, b) => b.start - a.start)) {
				transformed = transformed.slice(0, start) + `"${className}"` + transformed.slice(end);
			}

			return {
				code: transformed,
				map: null,
			};
		},

		configureServer(server) {
			// Serve CSS on a special endpoint
			server.middlewares.use((req, res, next) => {
				if (req.url === "/__cssints__/styles.css") {
					const css = generateCSS();
					res.setHeader("Content-Type", "text/css");
					res.end(css);
					return;
				}
				next();
			});
		},

		transformIndexHtml: {
			order: "post",
			handler(html: string) {
				// Inject CSS link for both dev and prod
				const css = generateCSS();
				if (css) {
					return html.replace(
						"</head>",
						`<link rel="stylesheet" href="/${cssFileName}">\n</head>`
					);
				}
				return html;
			},
		},

		generateBundle() {
			const css = generateCSS();
			if (css) {
				this.emitFile({
					type: "asset",
					fileName: cssFileName,
					source: css,
				});
			}
		},
	};
}

function parseArgs(str: string): any[] {
	if (!str.trim()) return [];
	
	const args: any[] = [];
	let current = "";
	let depth = 0;
	let inString = false;
	let stringChar = "";

	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		
		if ((char === '"' || char === "'") && str[i - 1] !== '\\') {
			if (!inString) {
				inString = true;
				stringChar = char;
			} else if (char === stringChar) {
				inString = false;
			}
			current += char;
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
	
	// String
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
	
	// Undefined/null
	if (value === "undefined") return undefined;
	if (value === "null") return null;
	
	return value;
}
