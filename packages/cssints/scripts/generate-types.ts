/**
 * Generate TypeScript Types from Unified CSS Data
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

interface UnifiedData {
	version: string;
	generated: string;
	properties: Array<{
		name: string;
		syntax: string;
		typeRef: string;
		typeRefs: string[];
	}>;
	types: Array<{
		name: string;
		syntax: string;
	}>;
	units: Record<string, string[]>;
	cssWideKeywords: string[];
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
			return yield* Effect.fail(
				new ReadError({ path, reason: e instanceof Error ? e.message : "Unknown error" }),
			);
		}
	});
}

// ============================================================================
// Generate Types
// ============================================================================

function generateTypesFile(data: UnifiedData): string {
	const lines: string[] = [
		"/**",
		" * CSS Value Types - AUTO-GENERATED",
		" * Do not edit manually.",
		" */",
		"",
		"// ==============================================================================",
		"// Brand Helper",
		"// ==============================================================================",
		"",
		"declare const __brand: unique symbol;",
		"",
		"export type Brand<T, B extends string> = T & { readonly [__brand]: B };",
		"export type Typed<T, B extends string> = Brand<T, B>;",
		"",
		"export function createTyped<T, B extends string>(value: T): Typed<T, B> {",
		"\treturn value as Typed<T, B>;",
		"}",
		"",
		"// ==============================================================================",
		"// CSS Global Keywords",
		"// ==============================================================================",
		"",
		"export type CSSGlobalKeyword = 'inherit' | 'initial' | 'unset' | 'revert' | 'revert-layer';",
		"",
		"// ==============================================================================",
		"// Common Values",
		"// ==============================================================================",
		"",
		"export type Auto = 'auto';",
		"export type None = 'none';",
		"export type Normal = 'normal';",
		"",
	];

	// Unit types
	lines.push("// ==============================================================================");
	lines.push("// Unit Types");
	lines.push("// ==============================================================================");
	lines.push("");

	for (const [category, unitList] of Object.entries(data.units)) {
		lines.push(`// ${category.charAt(0).toUpperCase() + category.slice(1)} units`);
		for (const unit of unitList) {
			const typeName = unit.charAt(0).toUpperCase() + unit.slice(1);
			lines.push(`export type ${typeName} = string & { readonly __unit: "${unit}" };`);
		}
		lines.push("");
	}

	// Composite types
	lines.push("// Composite types");
	lines.push("export type Length = string | number;");
	lines.push("export type Angle = string | number;");
	lines.push("export type Time = string;");
	lines.push("export type Percentage = string;");
	lines.push("export type LengthPercentage = Length | Percentage;");
	lines.push("export type AnglePercentage = Angle | Percentage;");
	lines.push("");

	// Core value types
	lines.push("// ==============================================================================");
	lines.push("// Core Value Types");
	lines.push("// ==============================================================================");
	lines.push("");

	const coreTypes = [
		"Color",
		"Position",
		"Image",
		"Gradient",
		"TransformFunction",
		"TransformList",
		"FilterFunction",
		"Url",
		"String",
		"Number",
		"Integer",
		"Keyword",
		"CustomIdent",
		"DashedIdent",
		"Frequency",
		"Resolution",
		"Ratio",
		"Flex",
		"Counter",
		"Shape",
		"CalcSum",
	];

	for (const typeName of coreTypes) {
		lines.push(`export type ${typeName}Value = string;`);
	}
	lines.push("");

	// Unit constructors
	lines.push("// ==============================================================================");
	lines.push("// Unit Constructors");
	lines.push("// ==============================================================================");
	lines.push("");

	for (const [category, unitList] of Object.entries(data.units)) {
		for (const unit of unitList) {
			const typeName = unit.charAt(0).toUpperCase() + unit.slice(1);
			lines.push(`export const ${unit} = (value: number): ${typeName} => \`\${value}${unit}\` as ${typeName};`);
		}
	}
	lines.push("export const pct = (value: number): Percentage => \`\${value}%\` as Percentage;");
	lines.push("");

	// Property value type map
	lines.push("// ==============================================================================");
	lines.push("// Property Value Types Map");
	lines.push("// ==============================================================================");
	lines.push("");
	lines.push("export interface PropertyValueTypeMap {");

	let count = 0;
	for (const prop of data.properties) {
		if (prop.name.startsWith("-")) continue;
		count++;
		const valueTypes = prop.typeRefs.length > 0 ? prop.typeRefs : [prop.typeRef];
		const types = [...new Set(valueTypes)].join(" | ");
		lines.push(`\t"${prop.name}": ${types}Value;`);
	}

	lines.push("}");
	lines.push("");

	return lines.join("\n");
}

// ============================================================================
// File Operations
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
	const content = generateTypesFile(data);
	yield* writeFile(content, "types.gen.ts");

	console.log("Generated types.gen.ts");
	console.log(`  Unit categories: ${Object.keys(data.units).length}`);
	console.log(`  Properties mapped: ${data.properties.filter(p => !p.name.startsWith("-")).length}`);
});

void Effect.runPromiseExit(program).then((exit) => {
	if (exit._tag === "Failure") {
		console.error("Error:", exit.cause);
		process.exit(1);
	}
});
