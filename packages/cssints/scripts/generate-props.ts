/**
 * Property Generator
 *
 * Generates typed CSS property functions from @webref/css.
 * Supports multi-param signatures with auto-join and number→rem scaling.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getWebRefData, getCSSProperties } from "./collect-webref";
import { generateJSDoc } from "./generate-jsdoc";
import { scaleValue, type ScaleValue } from "../lib/scale";

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "paths.json"), "utf-8"));
const OUTPUT_FILE = path.resolve(path.join(__dirname, "..", paths.output.generatedProps ?? "lib/generated-props.ts"));

// ============================================================================
// Types
// ============================================================================

interface PropertyDefinition {
	name: string;
	camelName: string;
	syntax: string;
	spec: string;
	initial?: string;
	inherited?: boolean;
}

// ============================================================================
// Property Name Conversion
// ============================================================================

function toCamelCase(name: string): string {
	return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

const RESERVED_WORDS = new Set([
	"if", "var", "let", "const", "function", "class", "interface", "type",
	"enum", "namespace", "module", "import", "export", "from", "as",
	"return", "throw", "new", "delete", "typeof", "void", "null", "undefined",
	"true", "false", "in", "of", "for", "while", "do", "switch", "case",
	"break", "continue", "default", "try", "catch", "finally", "with", "debugger",
]);

function sanitizePropName(name: string): string {
	const camel = toCamelCase(name);
	if (RESERVED_WORDS.has(camel)) {
		return `css${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
	}
	return camel;
}

// ============================================================================
// Property Categorization
// ============================================================================

const MULTI_PARAM_PROPS = new Set([
	"padding", "margin", "border-width", "border-style", "border-color",
	"border-radius", "border-spacing", "inset",
	"margin-top", "margin-right", "margin-bottom", "margin-left",
	"padding-top", "padding-right", "padding-bottom", "padding-left",
]);

const LENGTH_PROPS = new Set([
	"width", "height", "min-width", "max-width", "min-height", "max-height",
	"padding", "margin", "gap", "row-gap", "column-gap",
	"top", "right", "bottom", "left", "inset",
	"font-size", "line-height", "letter-spacing", "word-spacing",
	"border-width", "border-radius", "border-spacing",
	"outline-width", "outline-offset",
]);

// ============================================================================
// Generator Functions
// ============================================================================

function generatePropertyFunction(prop: PropertyDefinition): string {
	const { name, camelName, syntax, spec } = prop;
	const isMultiParam = MULTI_PARAM_PROPS.has(name);
	const isLength = LENGTH_PROPS.has(name);

	let signature: string;
	let implementation: string;

	if (isMultiParam) {
		signature = `(${camelName}: ScaleValue, ${camelName}2?: ScaleValue, ${camelName}3?: ScaleValue, ${camelName}4?: ScaleValue) => string`;
		implementation = `(${camelName}, ${camelName}2, ${camelName}3, ${camelName}4) => {
			const values = [${camelName}, ${camelName}2, ${camelName}3, ${camelName}4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return \`${name}: \${scaled.join(' ')}\`;
		}`;
	} else if (isLength) {
		signature = `(value: Length | number | string) => string`;
		implementation = `(value) => \`${name}: \${typeof value === 'number' ? scaleValue(value) : value}\``;
	} else {
		signature = `(value: string | number) => string`;
		implementation = `(value) => \`${name}: \${value}\``;
	}

	const jsDoc = generateJSDoc({
		name: camelName,
		description: `CSS \`${name}\` property.`,
		syntax,
		spec,
		status: "modern",
	});

	return `${jsDoc}
export const ${camelName}: ${signature} = ${implementation};`;
}

function generateProperties(props: PropertyDefinition[]): string[] {
	return props.map(generatePropertyFunction);
}

// ============================================================================
// Main Generator
// ============================================================================

export async function generateAllProperties(): Promise<void> {
	console.log("Generating CSS properties...");

	const webrefData = await getWebRefData();
	const rawProperties = getCSSProperties(webrefData);

	const properties: PropertyDefinition[] = rawProperties
		.filter((p) => !p.name.startsWith("-"))
		.map((p) => ({
			name: p.name,
			camelName: sanitizePropName(p.name),
			syntax: p.syntax,
			spec: p.spec,
		}));

	properties.sort((a, b) => a.camelName.localeCompare(b.camelName));

	const lines: string[] = [];

	lines.push(`/**
 * CSS Properties - AUTO-GENERATED
 * Do not edit manually. Run: bun run scripts/generate-all.ts
 * 
 * Generated from @webref/css
 * 
 * Property Signatures:
 * - Single value: display('flex')
 * - Number scale: padding(4) → '1rem' (scale: 0.25)
 * - Multi-param: padding(1, 2, 3, 4) → '0.25rem 0.5rem 0.75rem 1rem'
 */

import type { Length } from "./generated-types";
import { scaleValue, type ScaleValue } from "./scale";
`);

	const propFunctions = generateProperties(properties);
	lines.push(...propFunctions);

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, lines.join("\n\n"));

	console.log(`Generated ${properties.length} properties to ${OUTPUT_FILE}`);
}

// CLI entry point
if (import.meta.main) {
	generateAllProperties().catch(console.error);
}
