/**
 * Generate TaggedClass Types from WebRef and BCD
 *
 * Generates Effect Schema TaggedClass definitions for atomic CSS unit types
 * with JSDoc including @deprecated and @experimental tags from BCD status flags.
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

export class WriteError extends Data.TaggedError("WriteError")<{
	readonly path: string;
	readonly reason: string;
}> {}

export class DataError extends Data.TaggedError("DataError")<{
	readonly reason: string;
}> {}

// ============================================================================
// Types
// ============================================================================

interface WebRefType {
	name: string;
	href?: string;
	prose?: string;
	syntax?: string;
	value?: string;
	for?: string[];
}

interface WebRefCSSData {
	types: WebRefType[];
	properties: WebRefType[];
	atrules: WebRefType[];
	selectors: WebRefType[];
}

interface BCDCompatData {
	description?: string;
	mdn_url?: string | string[];
	spec_url?: string | string[];
	support?: Record<string, unknown>;
	status?: {
		deprecated: boolean;
		experimental: boolean;
		standard_track: boolean;
	};
}

interface TypeAnalysis {
	name: string;
	units: string[];
	compat: {
		description?: string;
		support?: Record<string, unknown>;
		mdn_url?: string | string[];
		spec_url?: string | string[];
		status?: {
			deprecated: boolean;
			experimental: boolean;
			standard_track: boolean;
		};
	};
	isUnit: boolean;
}

// ============================================================================
// Data Loading
// ============================================================================

function loadWebRefData(): Effect.Effect<WebRefCSSData, DataError> {
	return Effect.tryPromise({
		try: async () => {
			const path = resolve(__dirname, "../../../node_modules/@webref/css/css.json");
			const content = await import(path, { assert: { type: "json" } });
			return content.default as WebRefCSSData;
		},
		catch: (e: unknown) => new DataError({ reason: e instanceof Error ? e.message : "Unknown error" }),
	});
}

// ============================================================================
// Utility Functions
// ============================================================================

const pascalCase = (s: string): string => {
	return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatSupport = (support: Record<string, unknown>): string => {
	const browsers: string[] = [];
	const browserNames: Record<string, string> = { chrome: "Chrome", firefox: "Firefox", safari: "Safari" };

	for (const [browser, name] of Object.entries(browserNames)) {
		if (support[browser] !== undefined) {
			const v = support[browser];
			if (typeof v === "boolean") {
				browsers.push(v ? name : `${name} ✗`);
			} else if (typeof v === "object" && v !== null) {
				const version = (v as { version_added?: string | boolean }).version_added;
				if (typeof version === "string") {
					browsers.push(`${name} ${version}`);
				} else if (version === true) {
					browsers.push(name);
				} else {
					browsers.push(`${name} ✗`);
				}
			}
		}
	}
	return browsers.join(" | ");
};

// ============================================================================
// Flatten BCD Types
// ============================================================================

function flattenBCDTypes(bcdTypes: Record<string, unknown>): Map<string, BCDCompatData> {
	const flat = new Map<string, BCDCompatData>();

	for (const [typeName, typeData] of Object.entries(bcdTypes)) {
		if (typeName === "__compat") {
			const entry = typeData as { __compat?: BCDCompatData };
			if (entry.__compat) {
				flat.set(typeName, entry.__compat);
			}
		} else if (typeof typeData === "object" && typeData !== null && !Array.isArray(typeData)) {
			const nested = typeData as Record<string, unknown>;
			for (const [subName, subData] of Object.entries(nested)) {
				if (subName === "__compat") {
					const entry = subData as BCDCompatData;
					flat.set(typeName, entry);
				} else if (typeof subData === "object" && subData !== null) {
					const entry = subData as { __compat?: BCDCompatData };
					if (entry.__compat && entry.__compat.description) {
						const desc = entry.__compat.description;
						const unitMatch = desc.match(/<code>([a-z]+)<\/code> unit/i);
						if (unitMatch && unitMatch[1]) {
							flat.set(subName, entry.__compat);
						}
					}
				}
			}
		}
	}

	return flat;
}

// ============================================================================
// Analyze Types
// ============================================================================

function analyzeTypes(webrefData: WebRefCSSData, bcdFlat: Map<string, BCDCompatData>): Map<string, TypeAnalysis> {
	const analyses = new Map<string, TypeAnalysis>();

	const webrefTypes = webrefData.types || [];

	for (const type of webrefTypes) {
		analyses.set(type.name, {
			name: type.name,
			units: [],
			compat: {
				description: type.prose,
				mdn_url: type.href,
			},
			isUnit: false,
		});
	}

	for (const [typeName, compat] of bcdFlat.entries()) {
		const existing = analyses.get(typeName);

		if (existing) {
			existing.compat.support = compat.support;
			if (compat.mdn_url) existing.compat.mdn_url = compat.mdn_url;
			if (compat.spec_url) existing.compat.spec_url = compat.spec_url;
			if (compat.status) existing.compat.status = compat.status;

			if (compat.description) {
				const unitMatch = compat.description.match(/<code>([a-z]+)<\/code> unit/i);
				if (unitMatch && unitMatch[1] === typeName) {
					existing.isUnit = true;
					existing.units = [typeName];
				}
			}
		} else {
			let isUnit = false;
			let units: string[] = [];

			if (compat.description) {
				const unitMatch = compat.description.match(/<code>([a-z]+)<\/code> unit/i);
				if (unitMatch && unitMatch[1] === typeName) {
					isUnit = true;
					units = [typeName];
				}
			}

			analyses.set(typeName, {
				name: typeName,
				units,
				compat: {
					description: compat.description,
					mdn_url: compat.mdn_url,
					spec_url: compat.spec_url,
					support: compat.support,
					status: compat.status,
				},
				isUnit,
			});
		}
	}

	return analyses;
}

// ============================================================================
// Identify Atomic Units
// ============================================================================

function identifyAtomicUnits(analyses: Map<string, TypeAnalysis>): TypeAnalysis[] {
	const atomicUnits: TypeAnalysis[] = [];

	for (const analysis of analyses.values()) {
		if (!analysis.isUnit) continue;
		if (analysis.name.startsWith("-")) continue;
		atomicUnits.push(analysis);
	}

	return atomicUnits.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================================
// Generate JSDoc
// ============================================================================

function generateJSDoc(analysis: TypeAnalysis): string {
	const lines: string[] = ["/**"];

	if (analysis.compat.description) {
		const decoded = analysis.compat.description.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

		const descLines = decoded.split("\n");
		for (const line of descLines) {
			lines.push(` * ${line}`);
		}
		if (descLines.length > 0) {
			lines.push(" *");
		}
	}

	lines.push(` * **Syntax:** \`${analysis.name}\``);
	lines.push(" *");

	if (analysis.compat.status?.deprecated) {
		lines.push(" * @deprecated");
	}

	if (analysis.compat.status?.experimental) {
		lines.push(" * @experimental");
	}

	if (analysis.compat.support) {
		lines.push(" * **Supports:**");
		lines.push(` * ${formatSupport(analysis.compat.support)}`);
	}

	if (analysis.compat.mdn_url) {
		const url = Array.isArray(analysis.compat.mdn_url) ? analysis.compat.mdn_url[0] : analysis.compat.mdn_url;
		lines.push(" *");
		lines.push(` * @see ${url}`);
	}
	if (analysis.compat.spec_url) {
		const url = Array.isArray(analysis.compat.spec_url) ? analysis.compat.spec_url[0] : analysis.compat.spec_url;
		lines.push(` * @see ${url}`);
	}

	lines.push(" */");
	return lines.join("\n");
}

// ============================================================================
// Generate Wrapper Exports Only (skip TaggedClass for now due to TypeScript Go compilation issues)
// ============================================================================

function generateWrapperExports(types: TypeAnalysis[]): string {
	const lines: string[] = [
		"/**",
		" * Generated based on `@mdn/browser-compat-data`.",
		" * @version " + (bcd.__meta?.version || "unknown"),
		" */",
		"",
		"// Note: Core TaggedClass types need to be manually implemented",
		"// in src/core/types.ts due to TypeScript Go limitations",
		"",
		'import type { DimensionNodeSchema } from "@cssints/css-syntax";',
		'import * as Schema from "effect/Schema";',
		"",
		"// =========================================================================",
		"// Unit Constructor Functions",
		"// =========================================================================",
		"",
	];

	for (const type of types) {
		const jsDoc = generateJSDoc(type);
		const className = pascalCase(type.name);

		lines.push(`${jsDoc}`);
		lines.push(`export function ${type.name}(value: number): string {`);
		lines.push(`  return \`\${value}${type.name}\`;`);
		lines.push("}");
		lines.push("");
	}

	return lines.join("\n");
}

// ============================================================================
// File Writing
// ============================================================================

function writeFile(content: string, filename: string): Effect.Effect<void, WriteError> {
	return Effect.gen(function* () {
		const outputPath = resolve(__dirname, `../${filename}`);
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
// Main Program
// ============================================================================

const program = Effect.gen(function* () {
	console.log("Analyzing types from WebRef and BCD...\n");

	const webrefData = yield* loadWebRefData();
	const bcdFlat = flattenBCDTypes(bcd.css.types || {});

	console.log(`Found ${bcdFlat.size} flattened BCD types`);

	const analyses = analyzeTypes(webrefData, bcdFlat);
	const atomicUnits = identifyAtomicUnits(analyses);

	console.log(`Found ${atomicUnits.length} atomic unit types`);

	const wrapperExports = generateWrapperExports(atomicUnits);
	yield* writeFile(wrapperExports, "src/generated/types.gen.ts");
	console.log(`Generated src/generated/types.gen.ts`);

	console.log(`\nGenerated ${atomicUnits.length} unit type functions`);

	const deprecatedCount = atomicUnits.filter((t) => t.compat.status?.deprecated).length;
	const experimentalCount = atomicUnits.filter((t) => t.compat.status?.experimental).length;
	if (deprecatedCount > 0) {
		console.log(`  - Deprecated: ${deprecatedCount}`);
	}
	if (experimentalCount > 0) {
		console.log(`  - Experimental: ${experimentalCount}`);
	}
});

void Effect.runPromiseExit(program).then((exit) => {
	if (exit._tag === "Failure") {
		console.error("Error:", exit.cause);
		process.exit(1);
	}
});
