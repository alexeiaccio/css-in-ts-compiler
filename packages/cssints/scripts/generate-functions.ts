/**
 * Generate CSS Property Functions from Unified Data
 *
 * Generates TypeScript functions for all CSS properties with:
 * - Type-safe value parameters
 * - JSDoc with syntax, browser compat, and descriptions
 * - @deprecated and @experimental tags from BCD status flags
 */

import { Effect, Data } from "effect";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Errors
// ============================================================================

export class ReadError extends Data.TaggedError("ReadError")<{
	readonly path: string;
	readonly reason: string;
}> {}

export class WriteError extends Data.TaggedError("WriteError")<{
	readonly path: string;
	readonly reason: string;
}> {}

// ============================================================================
// Types
// ============================================================================

interface PropertyData {
	name: string;
	syntax: string;
	description?: string;
	browsers?: string[];
	baseline?: {
		status: "high" | "low" | "false";
		baseline_low_date?: string;
		baseline_high_date?: string;
	};
	values?: Array<{
		name: string;
		description?: string;
		browsers?: string[];
	}>;
	references?: Array<{
		name: string;
		url: string;
	}>;
	relevance?: number;
	restrictions?: string[];
	typeRef: string;
	typeRefs: string[];
	atRule?: string;
	// BCD status flags
	deprecated?: boolean;
	experimental?: boolean;
	standard_track?: boolean;
}

interface UnifiedData {
	properties: PropertyData[];
	composablePatterns: Array<{
		name: string;
		description?: string;
		properties: Array<{
			property: string;
			value: string;
		}>;
	}>;
}

// ============================================================================
// Load Unified Data
// ============================================================================

function loadUnifiedData(): Effect.Effect<UnifiedData, ReadError> {
	return Effect.gen(function* () {
		const path = resolve(__dirname, "../src/generated/unified-data.json");
		try {
			const content = readFileSync(path, "utf-8");
			return JSON.parse(content) as UnifiedData;
		} catch (e) {
			return yield* Effect.fail(new ReadError({ path, reason: e instanceof Error ? e.message : "Unknown error" }));
		}
	});
}

// ============================================================================
// Generate JSDoc
// ============================================================================

function formatBrowserTable(browsers?: string[]): string {
	if (!browsers || browsers.length === 0) return "";

	// Parse browser codes (E12, FF1, S1, C1, etc.)
	const browserMap: Record<string, string[]> = {};
	for (const code of browsers) {
		const match = code.match(/^([A-Z]+)(\d+\.?\d*)$/);
		if (match) {
			const [, browser, version] = match;
			const name: Record<string, string> = {
				E: "Edge",
				FF: "Firefox",
				S: "Safari",
				C: "Chrome",
				IE: "IE",
				O: "Opera",
			};
			const browserName = name[browser] || browser;
			if (!browserMap[browserName]) {
				browserMap[browserName] = [];
			}
			browserMap[browserName].push(version);
		}
	}

	if (Object.keys(browserMap).length === 0) return "";

	const lines = [" * **Browser Support:**", " * ", " * | Browser | Version |", " * |:-------:|:-------:|"];
	for (const [browser, versions] of Object.entries(browserMap)) {
		lines.push(` * | ${browser} | ${versions.join(", ")} |`);
	}

	return lines.join("\n");
}

function formatBaseline(baseline?: { status: string; baseline_low_date?: string }): string {
	if (!baseline) return "";

	const statusEmoji = {
		high: "✅",
		low: "🆕",
		false: "❌",
	};

	const statusText = {
		high: "Widely available",
		low: "Newly available",
		false: "Limited support",
	};

	return ` * **Baseline:** ${statusEmoji[baseline.status as keyof typeof statusEmoji] || ""} ${statusText[baseline.status as keyof typeof statusText] || baseline.status}`;
}

function generateJSDoc(prop: PropertyData): string {
	const lines: string[] = ["/**"];

	if (prop.description) {
		// Word wrap description
		const words = prop.description.split(" ");
		let currentLine = " * ";
		for (const word of words) {
			if (currentLine.length + word.length > 80) {
				lines.push(currentLine);
				currentLine = " * " + word;
			} else {
				currentLine += (currentLine === " * " ? "" : " ") + word;
			}
		}
		if (currentLine !== " * ") {
			lines.push(currentLine);
		}
	}

	lines.push(" *");
	lines.push(` * **Syntax:** \`${prop.syntax}\``);

	// Add @deprecated tag
	if (prop.deprecated) {
		lines.push(" *");
		lines.push(" * @deprecated");
	}

	// Add @experimental tag
	if (prop.experimental) {
		lines.push(" *");
		lines.push(" * @experimental");
	}

	const browserTable = formatBrowserTable(prop.browsers);
	if (browserTable) {
		lines.push(" *");
		for (const line of browserTable.split("\n")) {
			lines.push(line);
		}
	}

	const baselineInfo = formatBaseline(prop.baseline);
	if (baselineInfo) {
		lines.push(" *");
		lines.push(baselineInfo);
	}

	if (prop.references && prop.references.length > 0) {
		lines.push(" *");
		for (const ref of prop.references) {
			lines.push(` * @see ${ref.url}`);
		}
	}

	lines.push(" */");

	return lines.join("\n");
}

// ============================================================================
// Generate Function
// ============================================================================

function toFunctionName(propName: string): string {
	// Convert kebab-case to camelCase
	return propName
		.split("-")
		.map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
		.join("");
}

function generateFunction(prop: PropertyData): string {
	const fnName = toFunctionName(prop.name);
	const jsDoc = generateJSDoc(prop);

	// Determine value type
	const valueType = prop.typeRef + "Value";

	return `${jsDoc}
export function ${fnName}(value: ${valueType}): Style {
	return createStyle({
		property: "${prop.name}",
		value: String(value),
		description: ${prop.description ? JSON.stringify(prop.description) : "undefined"},
		syntax: ${JSON.stringify(prop.syntax)},
		browserCompat: ${prop.browsers ? JSON.stringify(prop.browsers) : "undefined"},
		baseline: ${prop.baseline ? JSON.stringify(prop.baseline) : "undefined"},
		ast: createValueAST(String(value)),
	});
}`;
}

// ============================================================================
// Generate Composable Functions
// ============================================================================

function generateComposable(pattern: UnifiedData["composablePatterns"][0]): string {
	const fnName = pattern.name;
	const description = pattern.description || `Set ${pattern.name}`;

	// Check if it's a simple display property
	if (pattern.properties.length === 1 && pattern.properties[0].property === "display") {
		return `/**
 * ${description}
 */
export function ${fnName}(): Style {
	return createStyle({
		property: "display",
		value: "${pattern.properties[0].value}",
		description: "${description}",
	});
}`;
	}

	// Check if it's a value-accepting function (like items, justify)
	if (pattern.properties.length === 1 && pattern.properties[0].value === "$value") {
		return `/**
 * ${description}
 */
export function ${fnName}(value: string): Style {
	return createStyle({
		property: "${pattern.properties[0].property}",
		value: String(value),
		description: "${description}",
	});
}`;
	}

	// Composite function (returns multiple styles or CSS properties object)
	return `/**
 * ${description}
 */
export function ${fnName}(...styles: Style[]): Style[] {
	return styles;
}`;
}

// ============================================================================
// Generate Index
// ============================================================================

function generateIndex(properties: PropertyData[], composables: UnifiedData["composablePatterns"]): string {
	const lines: string[] = [
		"// Re-export types",
		"export * from './types.gen.js';",
		"",
		"// Core",
		"export { Style, createStyle, createPropertyFn } from './core/style.js';",
		"export { parseValue, generateCSS, createValueAST } from './core/ast.js';",
		"",
		"// Property functions",
	];

	for (const prop of properties) {
		if (!prop.name.startsWith("-")) {
			lines.push(`export { ${toFunctionName(prop.name)} } from './properties.gen.js';`);
		}
	}

	lines.push("");
	lines.push("// Composable utilities");
	for (const pattern of composables) {
		lines.push(`export { ${pattern.name} } from './composables.gen.js';`);
	}

	lines.push("");
	lines.push("// CSS map for property lookup");
	lines.push("export { CSS } from './css-map.gen.js';");

	return lines.join("\n");
}

// ============================================================================
// Generate CSS Map
// ============================================================================

function generateCSSMap(properties: PropertyData[]): string {
	const lines: string[] = [
		"import type { Style } from './core/style.js';",
		"import type { PropertyValueTypeMap } from './types.gen.js';",
		"",
		"/**",
		" * CSS Property Map",
		" * Provides type-safe access to CSS property functions",
		" */",
		"export const CSS = {",
	];

	for (const prop of properties) {
		if (!prop.name.startsWith("-")) {
			const fnName = toFunctionName(prop.name);
			lines.push(`\t/** ${prop.description || prop.name} */`);
			lines.push(`\t"${prop.name}": ${fnName},`);
		}
	}

	lines.push("} as const;");
	lines.push("");
	lines.push("export type CSSPropertyName = keyof typeof CSS;");

	return lines.join("\n");
}

// ============================================================================
// Main Generation
// ============================================================================

function writeFile(content: string, filename: string): Effect.Effect<void, WriteError> {
	return Effect.gen(function* () {
		const outputPath = resolve(__dirname, `../src/generated/${filename}`);
		try {
			mkdirSync(dirname(outputPath), { recursive: true });
			writeFileSync(outputPath, content);
		} catch (e) {
			return yield* Effect.fail(
				new WriteError({ path: outputPath, reason: e instanceof Error ? e.message : "Unknown error" }),
			);
		}
	});
}

// ============================================================================
// Run
// ============================================================================

const program = Effect.gen(function* () {
	const data = yield* loadUnifiedData();

	// Filter out vendor-prefixed properties
	const standardProps = data.properties.filter((p) => !p.name.startsWith("-"));

	// Generate property functions
	const propFunctions: string[] = [
		"// ==============================================================================",
		"// CSS Property Functions - AUTO-GENERATED",
		"// Do not edit manually.",
		"// ==============================================================================",
		"",
		"import { Style, createStyle } from '../core/style.js';",
		"import { createValueAST } from '../core/ast.js';",
		"",
	];

	for (const prop of standardProps) {
		propFunctions.push(generateFunction(prop));
		propFunctions.push("");
	}

	yield* writeFile(propFunctions.join("\n"), "properties.gen.ts");

	// Generate composable functions
	const composableFunctions: string[] = [
		"// ==============================================================================",
		"// Composable CSS Utilities - AUTO-GENERATED",
		"// Do not edit manually.",
		"// ==============================================================================",
		"",
		"import { Style, createStyle } from '../core/style.js';",
		"",
	];

	for (const pattern of data.composablePatterns) {
		composableFunctions.push(generateComposable(pattern));
		composableFunctions.push("");
	}

	yield* writeFile(composableFunctions.join("\n"), "composables.gen.ts");

	// Generate CSS map
	yield* writeFile(generateCSSMap(standardProps), "css-map.gen.ts");

	// Generate index
	yield* writeFile(generateIndex(standardProps, data.composablePatterns), "index.gen.ts");

	console.log("Generated:");
	console.log(`  properties.gen.ts - ${standardProps.length} property functions`);
	const deprecatedCount = standardProps.filter((p) => p.deprecated).length;
	const experimentalCount = standardProps.filter((p) => p.experimental).length;
	if (deprecatedCount > 0) {
		console.log(`    - Deprecated: ${deprecatedCount}`);
	}
	if (experimentalCount > 0) {
		console.log(`    - Experimental: ${experimentalCount}`);
	}
	console.log(`  composables.gen.ts - ${data.composablePatterns.length} composable utilities`);
	console.log(`  css-map.gen.ts - CSS property map`);
	console.log(`  index.gen.ts - Main exports`);
});

void Effect.runPromiseExit(program).then((exit) => {
	if (exit._tag === "Failure") {
		console.error("Error:", exit.cause);
		process.exit(1);
	}
});
