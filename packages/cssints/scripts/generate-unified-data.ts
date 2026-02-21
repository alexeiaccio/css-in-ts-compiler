/**
 * Generate Unified CSS Data
 *
 * Merges csstree data.js with @vscode/web-custom-data to create
 * a unified data source for TypeScript generation.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Types
// ============================================================================

interface CsstreeData {
	generic: boolean;
	cssWideKeywords: string[];
	units: Record<string, string[]>;
	types: Record<string, string>;
	properties: Record<string, string>;
	atrules: Record<string, {
		prelude?: string;
		descriptors?: Record<string, string>;
	}>;
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

// Load csstree data
const csstreeDataPath = resolve(
	__dirname,
	"../node_modules/css-tree/dist/data.js"
);
const csstreeData = (await import(csstreeDataPath, { assert: { type: "json" } })).default;

// Load VS Code CSS data
const vscodeDataPath = resolve(
	__dirname,
	"../node_modules/@vscode/web-custom-data/data/browsers.css-data.json"
);
const vscodeData = JSON.parse(
	await import("node:fs").then((fs) =>
		fs.readFileSync(vscodeDataPath, "utf-8")
	)
);

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
	// Check for exact matches first
	for (const [pattern, type] of Object.entries(TYPE_MAP)) {
		if (syntax.includes(pattern)) {
			return type;
		}
	}

	// Check for common patterns
	if (syntax.includes("|")) {
		// Multiple options - check if all are keywords
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
// Merge Properties
// ============================================================================

interface VSCodeProperty {
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
}

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
}

// Create map from VS Code properties
const vscodePropsMap = new Map<string, (typeof vscodeData.properties)[0]>();
for (const prop of vscodeData.properties || []) {
	vscodePropsMap.set(prop.name, prop);
}

// Merge properties
const properties: MergedProperty[] = [];

// Use csstree properties as base (has syntax)
for (const [name, syntax] of Object.entries(csstreeData.properties || {})) {
	const vscodeProp = vscodePropsMap.get(name);

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
	};

	if (vscodeProp?.atRule) {
		merged.atRule = vscodeProp.atRule;
	}

	properties.push(merged);
}

// Add any VS Code properties not in csstree
for (const prop of vscodeData.properties || []) {
	if (!csstreeData.properties?.[prop.name]) {
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
		});
	}
}

// ============================================================================
// Merge Atrules
// ============================================================================

interface MergedAtrule {
	name: string;
	prelude?: string;
	syntax?: string;
	description?: string;
	browsers?: string[];
	descriptors?: Record<string, string>;
}

const atrules: MergedAtrule[] = [];

// Create map from VS Code atDirectives
const vscodeAtrulesMap = new Map<string, (typeof vscodeData.atDirectives)[0]>();
for (const atrule of vscodeData.atDirectives || []) {
	vscodeAtrulesMap.set(atrule.name, atrule);
}

// Use csstree atrules as base
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

// ============================================================================
// Types from csstree
// ============================================================================

interface TypeInfo {
	name: string;
	syntax: string;
	description?: string;
}

const types: TypeInfo[] = [];

for (const [name, syntax] of Object.entries(csstreeData.types || {})) {
	types.push({
		name,
		syntax,
	});
}

// ============================================================================
// Units from csstree
// ============================================================================

const units: Record<string, string[]> = csstreeData.units || {};

// ============================================================================
// CSS Wide Keywords
// ============================================================================

const cssWideKeywords: string[] = csstreeData.cssWideKeywords || [
	"initial",
	"inherit",
	"unset",
	"revert",
	"revert-layer",
];

// ============================================================================
// Pseudo Classes & Elements from VS Code
// ============================================================================

const pseudoClasses = vscodeData.pseudoClasses || [];
const pseudoElements = vscodeData.pseudoElements || [];

// ============================================================================
// Composables (patterns for flex, grid, etc.)
// ============================================================================

interface ComposablePattern {
	name: string;
	description?: string;
	properties: Array<{
		property: string;
		value: string;
		description?: string;
	}>;
}

const composablePatterns: ComposablePattern[] = [];

// Flex container
composablePatterns.push({
	name: "flex",
	description: "Create a flex container with composable utilities",
	properties: [
		{ property: "display", value: "flex", description: "Flex container" },
	],
});

// Grid container
composablePatterns.push({
	name: "grid",
	description: "Create a grid container with composable utilities",
	properties: [
		{ property: "display", value: "grid", description: "Grid container" },
	],
});

// Common flex/grid items
const itemsValues = vscodePropsMap.get("align-items")?.values || [];
if (itemsValues.length > 0) {
	composablePatterns.push({
		name: "items",
		description: "Set align-items",
		properties: [
			{ property: "align-items", value: "$value" },
		],
	});
}

const justifyValues = vscodePropsMap.get("justify-content")?.values || [];
if (justifyValues.length > 0) {
	composablePatterns.push({
		name: "justify",
		description: "Set justify-content",
		properties: [
			{ property: "justify-content", value: "$value" },
		],
	});
}

// ============================================================================
// Output Unified Data
// ============================================================================

const unifiedData = {
	version: "1.0.0",
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

const outputPath = resolve(__dirname, "../src/generated/unified-data.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(unifiedData, null, 2));

console.log("Generated unified-data.json:");
console.log(`  Properties: ${properties.length}`);
console.log(`  Atrules: ${atrules.length}`);
console.log(`  Types: ${types.length}`);
console.log(`  Units: ${Object.keys(units).length} categories`);
console.log(`  Pseudo-classes: ${pseudoClasses.length}`);
console.log(`  Pseudo-elements: ${pseudoElements.length}`);
console.log(`  Composable patterns: ${composablePatterns.length}`);
