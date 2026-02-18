/**
 * Function Generator
 *
 * Generates typed CSS functions from @webref/css parsed data.
 * All functions are auto-generated from the spec - no manual definitions.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { camelCase } from "es-toolkit";
import { parseSyntax, isTypeNode, isOrNode, isKeywordNode, type SyntaxNode } from "./parse-value-syntax";
import { generateJSDoc } from "./generate-jsdoc";
import type { CSSFeature } from "./filter-baseline";

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "../scripts/paths.json"), "utf-8"));
const OUTPUT_FILE = path.resolve(path.join(__dirname, "..", paths.output.generatedFunctions));

interface GeneratedFunction {
	name: string;
	jsDoc: string;
	signature: string;
}

interface ParamInfo {
	name: string;
	type: string;
	optional: boolean;
}

const BANNER = `/**
 * CSS Functions - AUTO-GENERATED
 * Do not edit manually. Run: bun run scripts/generate-all.ts
 * 
 * Generated from @webref/css with browser compatibility from @mdn/browser-compat-data
 */

import type { Length, Angle, Color, Percentage, CSSNumber, Time, CSSInteger, LengthPercentage, AnglePercentage, TimePercentage, Image, Position } from "./generated-types";

`;

/**
 * Extract parameters from parsed syntax AST.
 */
const RESERVED_WORDS = new Set([
	"if", "var", "let", "const", "function", "class", "interface", "type",
	"enum", "namespace", "module", "import", "export", "from", "as",
	"return", "throw", "new", "delete", "typeof", "void", "null", "undefined",
	"true", "false", "in", "of", "for", "while", "do", "switch", "case",
	"break", "continue", "default", "try", "catch", "finally", "with",
]);

function extractParams(node: SyntaxNode, prefix = ""): ParamInfo[] {
	const params: ParamInfo[] = [];
	let paramIndex = 0;

	function sanitizeTypeName(cssType: string): string {
		let camel = camelCase(cssType.replace(/-/g, "_"));
		if (RESERVED_WORDS.has(camel)) {
			camel = `css${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
		}
		return camel;
	}

	function sanitizeParamName(name: string): string {
		let camel = camelCase(name);
		if (RESERVED_WORDS.has(camel)) {
			camel = `css${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
		}
		if (/^\d/.test(camel)) {
			return `value${camel}`;
		}
		return `_${camel}`;
	}

	function getTsType(cssType: string): string {
		const baseType = cssType.replace(/\[.*\]/, "").trim();
		const typeMap: Record<string, string> = {
			length: "Length",
			"length-percentage": "LengthPercentage",
			angle: "Angle",
			"angle-percentage": "AnglePercentage",
			color: "Color",
			percentage: "Percentage",
			number: "CSSNumber",
			integer: "CSSInteger",
			time: "Time",
			"time-percentage": "TimePercentage",
			string: "string",
			url: "Url",
			image: "Image",
			position: "Position",
			hue: "Angle",
			resolution: "Resolution",
			frequency: "Frequency",
		};
		return typeMap[baseType] ?? "string";
	}

	function extract(n: SyntaxNode, pfx: string): void {
		if (isTypeNode(n)) {
			const tsType = getTsType(n.name);
			const paramName = sanitizeParamName(n.name);
			params.push({
				name: pfx + paramName,
				type: tsType,
				optional: false,
			});
		} else if (isKeywordNode(n)) {
			// Keywords can be literal types
			if (n.value && !["from", "by", "at", "to"].includes(n.value)) {
				params.push({
					name: pfx + `keyword${paramIndex++}`,
					type: `'${n.value}'`,
					optional: false,
				});
			}
		} else if (isOrNode(n)) {
			const typeItems = n.items.filter(isTypeNode);
			const keywordItems = n.items.filter(isKeywordNode);

			if (typeItems.length > 0) {
				const types = typeItems.map((t) => getTsType(t.name));
				const uniqueTypes = [...new Set(types)];
				params.push({
					name: pfx + `value${paramIndex++}`,
					type: uniqueTypes.join(" | "),
					optional: false,
				});
			} else if (keywordItems.length > 0) {
				params.push({
					name: pfx + `value${paramIndex++}`,
					type: keywordItems.map((k) => `'${k.value}'`).join(" | "),
					optional: false,
				});
			}
		} else if (n.type === "separator") {
			// Skip separators, they just delimit
		} else if (n.type === "optional") {
			extract(n.item as SyntaxNode, pfx);
			const lastParam = params[params.length - 1];
			if (lastParam) {
				lastParam.optional = true;
			}
		} else if (n.type === "juxtaposition") {
			const items = n.items as SyntaxNode[];
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item) {
					extract(item, pfx);
				}
			}
		} else if (n.type === "repeat") {
			extract(n.item as SyntaxNode, pfx);
		} else if (n.type === "group") {
			extract(n.item as SyntaxNode, pfx);
		} else if (n.type === "and") {
			const andNode = n as unknown as { items: SyntaxNode[] };
			for (const item of andNode.items) {
				extract(item, pfx);
			}
		}
	}

	extract(node, prefix);

	// Fix: if there are optional params, all params after first optional should be optional
	let foundOptional = false;
	params.forEach((p) => {
		if (foundOptional) p.optional = true;
		if (p.optional) foundOptional = true;
	});

	// Remove duplicate param names by making them unique
	const seen = new Set<string>();
	return params.map((p, idx) => {
		let name = p.name;
		if (seen.has(name)) {
			name = `${p.name}${idx + 1}`;
		}
		seen.add(name);
		return { ...p, name };
	});
}

/**
 * Generate runtime implementation from params.
 */
function generateImplementation(name: string, params: ParamInfo[]): string {
	const paramNames = params.map((p) => p.name);
	const optionalParams = params.filter((p) => p.optional);

	if (optionalParams.length === 0) {
		return `(${paramNames.join(", ")}) => \`${name}(${paramNames.join(", ")})\``;
	}

	const parts: string[] = [];
	for (const p of params) {
		if (p.optional) {
			parts.push(`\${${p.name} !== undefined ? \`, \${${p.name}}\` : ""}`);
		} else {
			parts.push(`\${${p.name}}`);
		}
	}

	return `(${paramNames.join(", ")}) => \`${name}(${parts.join(", ")})\``;
}

/**
 * Generate a typed function for a CSS function.
 */
function extractInnerSyntax(syntax: string): string {
	const match = syntax.match(/^[a-zA-Z-]+\(\s*(.+?)\s*\)$/);
	return match?.[1] ?? syntax;
}

function generateFunction(feature: CSSFeature): GeneratedFunction | null {
	const { name, syntax, status, browserSupport, spec } = feature;

	try {
		const innerSyntax = extractInnerSyntax(syntax);
		const parsed = parseSyntax(innerSyntax);
		const params = extractParams(parsed);

		const jsDoc = generateJSDoc({
			name,
			description: `The \`${name}()\` CSS function.`,
			syntax,
			spec,
			status: status as "modern" | "experimental" | "deprecated",
			browserSupport,
		});

		// Prefix with 'fn' to avoid collision with CSS properties
		let fnName = `fn${camelCase(name).replace(/^[a-z]/, (c) => c.toUpperCase())}`;
		if (RESERVED_WORDS.has(fnName)) {
			fnName = `css${fnName.charAt(0).toUpperCase()}${fnName.slice(1)}`;
		}

		const paramList = params.map((p) => {
			const optional = p.optional ? "?" : "";
			return `${p.name}${optional}: ${p.type}`;
		});

		const returnType = `string`;
		const signature = `(${paramList.join(", ")}) => ${returnType}`;
		const impl = generateImplementation(name, params); // Use original CSS name

		return {
			name: fnName,
			jsDoc,
			signature: `export const ${fnName}: ${signature} = ${impl};`,
		};
	} catch (err) {
		console.warn(`Failed to generate function for ${name}:`, err);
		return null;
	}
}

/**
 * Generate all typed functions from a list of CSS features.
 */
export function generateFunctions(features: CSSFeature[]): GeneratedFunction[] {
	const functions: GeneratedFunction[] = [];
	const usedNames = new Set<string>();

	for (const feature of features) {
		const fn = generateFunction(feature);
		if (fn) {
			// Ensure unique function names
			let uniqueName = fn.name;
			let suffix = 2;
			while (usedNames.has(uniqueName)) {
				uniqueName = `${fn.name}${suffix++}`;
			}
			usedNames.add(uniqueName);
			
			functions.push({
				...fn,
				name: uniqueName,
				signature: fn.signature.replace(`export const ${fn.name}`, `export const ${uniqueName}`),
			});
		}
	}

	return functions;
}

/**
 * Write generated functions to output file.
 */
export function writeFunctionsFile(functions: GeneratedFunction[]): void {
	const lines: string[] = [BANNER];

	// Sort alphabetically
	functions.sort((a, b) => a.name.localeCompare(b.name));

	for (const fn of functions) {
		lines.push(fn.jsDoc);
		lines.push(fn.signature);
		lines.push("");
	}

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, lines.join("\n"));

	console.log(`Generated ${functions.length} functions to ${OUTPUT_FILE}`);
}

/**
 * Main generation function - ALL functions from spec.
 */
export function generateAll(features: CSSFeature[]): void {
	const autoGenerated = generateFunctions(features);

	writeFunctionsFile(autoGenerated);

	console.log(`\nGeneration complete:`);
	console.log(`  - Auto-generated: ${autoGenerated.length}`);
}
