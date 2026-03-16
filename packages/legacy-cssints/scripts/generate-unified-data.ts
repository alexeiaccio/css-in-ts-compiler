/**
 * Generate Unified CSS Data
 *
 * Merges csstree data.js with @vscode/web-custom-data and @mdn/browser-compat-data
 * to create a unified data source for TypeScript generation.
 */

import bcd from "@mdn/browser-compat-data" with { type: "json" };
import { Effect, Data } from "effect";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Errors
// ============================================================================

export class DataLoadError extends Data.TaggedError("DataLoadError")<{
	readonly path: string;
	readonly reason: string;
}> {
	constructor(path: string, reason: string) {
		super({ path, reason });
	}
}

export class WriteError extends Data.TaggedError("WriteError")<{
	readonly path: string;
	readonly reason: string;
}> {
	constructor(path: string, reason: string) {
		super({ path, reason });
	}
}

// ============================================================================
// Types
// ============================================================================

interface CsstreeData {
	generic: boolean;
	cssWideKeywords: string[];
	units: Record<string, string[]>;
	types: Record<string, string>;
	properties: Record<string, string>;
	atrules: Record<
		string,
		{
			prelude?: string;
			descriptors?: Record<string, string>;
		}
	>;
}

interface VSCodeCSSData {
	version: number;
	properties: Array<{
		name: string;
		syntax?: string;
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
		atRule?: string;
	}>;
	atDirectives: Array<{
		name: string;
		description?: string;
		browsers?: string[];
	}>;
	pseudoClasses: Array<{
		name: string;
		description?: string;
		browsers?: string[];
	}>;
	pseudoElements: Array<{
		name: string;
		description?: string;
		browsers?: string[];
	}>;
}

// ============================================================================
// Data Loading
// ============================================================================

function loadCsstreeData(): Effect.Effect<CsstreeData, DataLoadError> {
	// Path to workspace root node_modules
	const path = resolve(__dirname, "../../../node_modules/css-tree/dist/data.js");
	return Effect.tryPromise({
		try: async () => {
			const mod = await import(path, { assert: { type: "json" } });
			return mod.default as CsstreeData;
		},
		catch: (e: unknown) => new DataLoadError(path, e instanceof Error ? e.message : "Unknown error"),
	});
}

function loadVSCodeData(): Effect.Effect<VSCodeCSSData, DataLoadError> {
	return Effect.gen(function* () {
		const path = resolve(__dirname, "../../../node_modules/@vscode/web-custom-data/data/browsers.css-data.json");
		try {
			const content = readFileSync(path, "utf-8");
			return JSON.parse(content) as VSCodeCSSData;
		} catch (e) {
			return yield* Effect.fail(new DataLoadError(path, e instanceof Error ? e.message : "Unknown error"));
		}
	});
}

function loadBCDData(): Effect.Effect<typeof bcd, DataLoadError> {
	return Effect.succeed(bcd);
}

// ============================================================================
// Type Inference from Syntax
// ============================================================================

const TYPE_MAP: Record<string, string> = {
	"<color>": "Color",
	"<length>": "Length",
	"<percentage>": "Percentage",
	"<length-percentage>": "LengthPercentage",
	"<angle>": "Angle",
	"<angle-percentage>": "AnglePercentage",
	"<time>": "Time",
	"<time-percentage>": "TimePercentage",
	"<number>": "Number",
	"<integer>": "Integer",
	"<string>": "String",
	"<url>": "Url",
	"<image>": "Image",
	"<position>": "Position",
	"<gradient>": "Gradient",
	"<transform-function>": "TransformFunction",
	"<transform-list>": "TransformList",
	"<filter-function>": "FilterFunction",
	"<frequency>": "Frequency",
	"<resolution>": "Resolution",
	"<ratio>": "Ratio",
	"<flex>": "Flex",
	"<counter>": "Counter",
	"<shape>": "Shape",
	"<calc-sum>": "CalcSum",
	"<custom-ident>": "CustomIdent",
	"<dashed-ident>": "DashedIdent",
};

function inferTypeFromSyntax(syntax: string): string {
	for (const [pattern, type] of Object.entries(TYPE_MAP)) {
		if (syntax.includes(pattern)) {
			return type;
		}
	}

	if (syntax.includes("|")) {
		const parts = syntax.split("|").map((p) => p.trim());
		const allKeywords = parts.every((p) => /^[a-z-]+$/.test(p) && !p.startsWith("<"));
		if (allKeywords) {
			return "Keyword";
		}
	}

	return "String";
}

function extractTypeReferences(syntax: string): string[] {
	const types: string[] = [];
	const typeRegex = /<([a-z-]+)>/g;
	let match;

	while ((match = typeRegex.exec(syntax)) !== null) {
		const typeName = match[1];
		const key = `<${typeName}>`;
		if (key in TYPE_MAP) {
			types.push(TYPE_MAP[key]!);
		}
	}

	return [...new Set(types)];
}

// ============================================================================
// Data Types
// ============================================================================

interface MergedProperty {
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

interface MergedAtrule {
	name: string;
	prelude?: string;
	syntax?: string;
	description?: string;
	browsers?: string[];
	descriptors?: Record<string, string>;
}

interface TypeInfo {
	name: string;
	syntax: string;
	description?: string;
}

interface ComposablePattern {
	name: string;
	description?: string;
	properties: Array<{
		property: string;
		value: string;
		description?: string;
	}>;
}

interface UnifiedData {
	version: string;
	generated: string;
	properties: MergedProperty[];
	atrules: MergedAtrule[];
	types: TypeInfo[];
	units: Record<string, string[]>;
	cssWideKeywords: string[];
	pseudoClasses: Array<{ name: string; description?: string }>;
	pseudoElements: Array<{ name: string; description?: string }>;
	composablePatterns: ComposablePattern[];
}

// ============================================================================
// Data Merging
// ============================================================================

function mergeProperties(csstreeData: CsstreeData, vscodeData: VSCodeCSSData, bcdData: typeof bcd): MergedProperty[] {
	const vscodePropsMap = new Map<string, VSCodeCSSData["properties"][0]>();
	for (const prop of vscodeData.properties || []) {
		vscodePropsMap.set(prop.name, prop);
	}

	const properties: MergedProperty[] = [];

	for (const [name, syntax] of Object.entries(csstreeData.properties || {})) {
		const vscodeProp = vscodePropsMap.get(name);
		const bcdProp = bcdData.css.properties[name as keyof typeof bcdData.css.properties];

		const merged: MergedProperty = {
			name,
			syntax: vscodeProp?.syntax || syntax,
			description: vscodeProp?.description,
			browsers: vscodeProp?.browsers,
			baseline: vscodeProp?.baseline,
			values: vscodeProp?.values,
			references: vscodeProp?.references,
			relevance: vscodeProp?.relevance,
			restrictions: vscodeProp?.restrictions,
			typeRef: inferTypeFromSyntax(vscodeProp?.syntax || syntax),
			typeRefs: extractTypeReferences(vscodeProp?.syntax || syntax),
			// Extract BCD status flags
			deprecated: bcdProp?.__compat?.status?.deprecated,
			experimental: bcdProp?.__compat?.status?.experimental,
			standard_track: bcdProp?.__compat?.status?.standard_track,
		};

		if (vscodeProp?.atRule) {
			merged.atRule = vscodeProp.atRule;
		}

		properties.push(merged);
	}

	for (const prop of vscodeData.properties || []) {
		if (!csstreeData.properties?.[prop.name]) {
			const bcdProp = bcdData.css.properties[prop.name as keyof typeof bcdData.css.properties];
			properties.push({
				name: prop.name,
				syntax: prop.syntax || "",
				description: prop.description,
				browsers: prop.browsers,
				baseline: prop.baseline,
				values: prop.values,
				references: prop.references,
				relevance: prop.relevance,
				restrictions: prop.restrictions,
				typeRef: inferTypeFromSyntax(prop.syntax || ""),
				typeRefs: extractTypeReferences(prop.syntax || ""),
				atRule: prop.atRule,
				// Extract BCD status flags
				deprecated: bcdProp?.__compat?.status?.deprecated,
				experimental: bcdProp?.__compat?.status?.experimental,
				standard_track: bcdProp?.__compat?.status?.standard_track,
			});
		}
	}

	return properties;
}

function mergeAtrules(csstreeData: CsstreeData, vscodeData: VSCodeCSSData): MergedAtrule[] {
	const vscodeAtrulesMap = new Map<string, VSCodeCSSData["atDirectives"][0]>();
	for (const atrule of vscodeData.atDirectives || []) {
		vscodeAtrulesMap.set(atrule.name, atrule);
	}

	const atrules: MergedAtrule[] = [];

	for (const [name, data] of Object.entries(csstreeData.atrules || {})) {
		const vscodeAtrule = vscodeAtrulesMap.get(`@${name}`);

		atrules.push({
			name: `@${name}`,
			prelude: data.prelude || undefined,
			description: vscodeAtrule?.description,
			browsers: vscodeAtrule?.browsers,
			descriptors: data.descriptors || undefined,
		});
	}

	return atrules;
}

function extractTypes(csstreeData: CsstreeData): TypeInfo[] {
	const types: TypeInfo[] = [];

	for (const [name, syntax] of Object.entries(csstreeData.types || {})) {
		types.push({
			name,
			syntax,
		});
	}

	return types;
}

function extractUnits(csstreeData: CsstreeData): Record<string, string[]> {
	return csstreeData.units || {};
}

function extractCssWideKeywords(csstreeData: CsstreeData): string[] {
	return csstreeData.cssWideKeywords || ["initial", "inherit", "unset", "revert", "revert-layer"];
}

function extractPseudoClasses(vscodeData: VSCodeCSSData): Array<{ name: string; description?: string }> {
	return vscodeData.pseudoClasses || [];
}

function extractPseudoElements(vscodeData: VSCodeCSSData): Array<{ name: string; description?: string }> {
	return vscodeData.pseudoElements || [];
}

function buildComposablePatterns(vscodeData: VSCodeCSSData): ComposablePattern[] {
	const patterns: ComposablePattern[] = [];

	patterns.push({
		name: "flex",
		description: "Create a flex container with composable utilities",
		properties: [{ property: "display", value: "flex", description: "Flex container" }],
	});

	patterns.push({
		name: "grid",
		description: "Create a grid container with composable utilities",
		properties: [{ property: "display", value: "grid", description: "Grid container" }],
	});

	const vscodePropsMap = new Map<string, VSCodeCSSData["properties"][0]>();
	for (const prop of vscodeData.properties || []) {
		vscodePropsMap.set(prop.name, prop);
	}

	const itemsValues = vscodePropsMap.get("align-items")?.values || [];
	if (itemsValues.length > 0) {
		patterns.push({
			name: "items",
			description: "Set align-items",
			properties: [{ property: "align-items", value: "$value" }],
		});
	}

	const justifyValues = vscodePropsMap.get("justify-content")?.values || [];
	if (justifyValues.length > 0) {
		patterns.push({
			name: "justify",
			description: "Set justify-content",
			properties: [{ property: "justify-content", value: "$value" }],
		});
	}

	return patterns;
}

// ============================================================================
// Main Program
// ============================================================================

function generateUnifiedData(): Effect.Effect<UnifiedData, DataLoadError> {
	return Effect.gen(function* () {
		const csstreeData = yield* loadCsstreeData();
		const vscodeData = yield* loadVSCodeData();
		const bcdData = yield* loadBCDData();

		const properties = mergeProperties(csstreeData, vscodeData, bcdData);
		const atrules = mergeAtrules(csstreeData, vscodeData);
		const types = extractTypes(csstreeData);
		const units = extractUnits(csstreeData);
		const cssWideKeywords = extractCssWideKeywords(csstreeData);
		const pseudoClasses = extractPseudoClasses(vscodeData);
		const pseudoElements = extractPseudoElements(vscodeData);
		const composablePatterns = buildComposablePatterns(vscodeData);

		return {
			version: "1.1.0",
			generated: new Date().toISOString(),
			properties,
			atrules,
			types,
			units,
			cssWideKeywords,
			pseudoClasses,
			pseudoElements,
			composablePatterns,
		};
	});
}

function writeUnifiedData(data: UnifiedData): Effect.Effect<void, WriteError> {
	return Effect.gen(function* () {
		const outputPath = resolve(__dirname, "../src/generated/unified-data.json");
		try {
			mkdirSync(dirname(outputPath), { recursive: true });
			writeFileSync(outputPath, JSON.stringify(data, null, 2));
		} catch (e) {
			return yield* Effect.fail(new WriteError(outputPath, e instanceof Error ? e.message : "Unknown error"));
		}
	});
}

function logSummary(data: UnifiedData): Effect.Effect<void> {
	return Effect.sync(() => {
		console.log("Generated unified-data.json:");
		console.log(`  Properties: ${data.properties.length}`);
		const deprecatedCount = data.properties.filter((p) => p.deprecated).length;
		const experimentalCount = data.properties.filter((p) => p.experimental).length;
		if (deprecatedCount > 0) {
			console.log(`    - Deprecated: ${deprecatedCount}`);
		}
		if (experimentalCount > 0) {
			console.log(`    - Experimental: ${experimentalCount}`);
		}
		console.log(`  Atrules: ${data.atrules.length}`);
		console.log(`  Types: ${data.types.length}`);
		console.log(`  Units: ${Object.keys(data.units).length} categories`);
		console.log(`  Pseudo-classes: ${data.pseudoClasses.length}`);
		console.log(`  Pseudo-elements: ${data.pseudoElements.length}`);
		console.log(`  Composable patterns: ${data.composablePatterns.length}`);
	});
}

// ============================================================================
// Run
// ============================================================================

const program = Effect.gen(function* () {
	const data = yield* generateUnifiedData();
	yield* writeUnifiedData(data);
	yield* logSummary(data);
});

void Effect.runPromiseExit(program).then((exit) => {
	if (exit._tag === "Failure") {
		console.error("Error:", exit.cause);
		process.exit(1);
	}
});
