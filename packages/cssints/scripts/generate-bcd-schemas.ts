/**
 * Generate Effect TS Schemas from @mdn/browser-compat-data Types
 * Fully data-driven - no hardcoded unit lists or type lists
 */

import { Effect, Data, Schema as SchemaEffect } from "effect";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import bcd from "@mdn/browser-compat-data" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Errors
// ============================================================================

class DataError extends Data.TaggedError("DataError")<{
	readonly reason: string;
}> {}

class WriteError extends Data.TaggedError("WriteError")<{
	readonly path: string;
	readonly reason: string;
}> {}

// ============================================================================
// Types
// ============================================================================

interface CompatSupport {
	version_added?: string | boolean;
	version_removed?: string | boolean;
	alternative_name?: string;
	prefix?: string;
	notes?: string | string[];
	partial_implementation?: boolean;
}

interface CompatStatus {
	deprecated: boolean;
	experimental: boolean;
	standard_track: boolean;
}

interface CompatData {
	description?: string;
	mdn_url?: string | string[];
	spec_url?: string | string[];
	source_file?: string;
	status: CompatStatus;
	support: Record<string, CompatSupport | boolean>;
	tags?: string[];
}

interface BCDTypeEntry {
	__compat?: CompatData;
	[key: string]: unknown;
}

// ============================================================================
// Utility Functions
// ============================================================================

const pascalCase = (s: string): string => s.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());

const extractUnitsFromDescription = (description: string | undefined, typeName?: string): string[] => {
	if (!description) return [];

	const decoded = description
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");

	const allUnits = new Set<string>();

	const codeMatches = decoded.match(/<code>(.*?)<\/code>/g);
	if (codeMatches) {
		const hasUnitWord = decoded.toLowerCase().includes("unit");
		for (const match of codeMatches) {
			const content = match.replace(/<\/?code>/g, "").trim().replace(/[<>]/g, "");
			const unitMatch = content.match(/^([a-zA-Z%]+)$/);
			if (unitMatch && unitMatch[1]) {
				const isSelfReference = typeName && unitMatch[1].toLowerCase() === typeName.toLowerCase();
				if (!isSelfReference || hasUnitWord) {
					allUnits.add(unitMatch[1].toLowerCase());
				}
			}
		}
	}

	return Array.from(allUnits);
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
				const version = (v as CompatSupport).version_added;
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
// Analyze BCD Types
// ============================================================================

interface TypeAnalysis {
	name: string;
	compat?: CompatData;
	units: string[];
	references: string[];
}

const analyzeTypes = (bcdTypes: Record<string, unknown>): Map<string, TypeAnalysis> => {
	const analyses = new Map<string, TypeAnalysis>();

	const nestedUnits: Map<string, string[]> = new Map();
	const nestedTypesData: Map<string, BCDTypeEntry> = new Map();
	const lengthType = bcdTypes["length"] as Record<string, unknown> | undefined;

	if (lengthType && typeof lengthType === "object") {
		for (const [key, value] of Object.entries(lengthType)) {
			if (key === "__compat") continue;
			const entry = value as BCDTypeEntry;
			nestedTypesData.set(key, entry);
			const compat = entry?.__compat as CompatData | undefined;
			if (compat?.description) {
				const units = extractUnitsFromDescription(compat.description, key);
				if (units.length > 0) {
					nestedUnits.set(key, units);
				}
			}
		}
	}

	for (const [typeName, typeData] of Object.entries(bcdTypes)) {
		if (typeName === "__compat") continue;
		const entry = typeData as BCDTypeEntry;
		const compat = entry.__compat as CompatData | undefined;

		const units = nestedUnits.get(typeName) || extractUnitsFromDescription(compat?.description, typeName);

		const references: string[] = [];
		if (compat?.description) {
			const decoded = compat.description
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&amp;/g, "&");
			const typeRefMatch = decoded.match(/<([a-z-]+)>/g);
			if (typeRefMatch) {
				for (const ref of typeRefMatch) {
					const refName = ref.replace(/[<>]/g, "");
					if (refName !== typeName) {
						references.push(refName);
					}
				}
			}
		}

		analyses.set(typeName, {
			name: typeName,
			compat,
			units,
			references,
		});
	}

	for (const [typeName, entry] of nestedTypesData) {
		if (analyses.has(typeName)) continue;
		const compat = entry.__compat as CompatData | undefined;
		const units = nestedUnits.get(typeName) || [];

		const references: string[] = [];
		if (compat?.description) {
			const decoded = compat.description
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&amp;/g, "&");
			const typeRefMatch = decoded.match(/<([a-z-]+)>/g);
			if (typeRefMatch) {
				for (const ref of typeRefMatch) {
					const refName = ref.replace(/[<>]/g, "");
					if (refName !== typeName) {
						references.push(refName);
					}
				}
			}
		}

		analyses.set(typeName, {
			name: typeName,
			compat,
			units,
			references,
		});
	}

	return analyses;
};

// ============================================================================
// Topological Sort for Dependency Order
// ============================================================================

const topologicalSort = (analyses: Map<string, TypeAnalysis>): string[] => {
	const visited = new Set<string>();
	const result: string[] = [];
	const visiting = new Set<string>();

	const visit = (name: string): void => {
		if (visited.has(name)) return;
		if (visiting.has(name)) {
			console.log(`[WARN] Circular dependency detected: ${name}`);
			return;
		}

		visiting.add(name);
		const analysis = analyses.get(name);
		if (analysis) {
			for (const ref of analysis.references) {
				if (analyses.has(ref)) {
					visit(ref);
				}
			}
		}
		visiting.delete(name);
		visited.add(name);
		result.push(name);
	};

	for (const name of analyses.keys()) {
		visit(name);
	}

	return result;
};

// ============================================================================
// Generate Schema for a Single Type
// ============================================================================

const generateTypeSchema = (
	analysis: TypeAnalysis,
	allAnalyses: Map<string, TypeAnalysis>,
	generated: Set<string>,
): string => {
	const { name, compat, units, references } = analysis;
	const lines: string[] = [];

	if (compat?.description) {
		const decoded = compat.description
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&amp;/g, "&");

		lines.push("/**");
		lines.push(` * **Syntax**`);
		lines.push(` * <code>${name}</code>`);
		if (compat.support) {
			lines.push(` *`);
			lines.push(` * **Supports**`);
			lines.push(` * ${formatSupport(compat.support)}`);
		}
		if (compat.mdn_url) {
			lines.push(` *`);
			lines.push(` * @see ${Array.isArray(compat.mdn_url) ? compat.mdn_url[0] : compat.mdn_url}`);
		}
		if (compat.spec_url) {
			lines.push(` * @see ${Array.isArray(compat.spec_url) ? compat.spec_url[0] : compat.spec_url}`);
		}
		lines.push(" */");
	} else {
		lines.push("/**");
		lines.push(" * ...");
		lines.push(" */");
	}

	const refSchemas = references
		.filter((ref) => allAnalyses.has(ref) || generated.has(pascalCase(ref)))
		.map((ref) => pascalCase(ref));

	const isSimpleUnit = units.length === 1 && units[0] === name;

	if (isSimpleUnit) {
		lines.push(`export const ${pascalCase(name)} = Schema.TemplateLiteral([Schema.Number, "${units[0]}"]);`);
	} else if (units.length > 0 && refSchemas.length === 0) {
		const unionParts = units.map((u) => `Schema.TemplateLiteral([Schema.Number, "${u}"])`);
		lines.push(`export const ${pascalCase(name)} = Schema.Union([`);
		lines.push(`\t${unionParts.join(",\n\t")},`);
		lines.push("]);");
	} else if (refSchemas.length > 0 && units.length === 0) {
		lines.push(`export const ${pascalCase(name)} = Schema.Union([`);
		lines.push(`\t${refSchemas.join(",\n\t")},`);
		lines.push("]);");
	} else if (refSchemas.length > 0 && units.length > 0) {
		const unitParts = units.map((u) => `Schema.TemplateLiteral([Schema.Number, "${u}"])`);
		lines.push(`export const ${pascalCase(name)} = Schema.Union([`);
		lines.push(`\t${unitParts.join(",\n\t")},`);
		lines.push(`\t${refSchemas.join(",\n\t")},`);
		lines.push("]);");
	} else {
		lines.push(`export const ${pascalCase(name)} = Schema.String;`);
	}

	generated.add(pascalCase(name));
	return lines.join("\n");
};

// ============================================================================
// Generate All Schemas
// ============================================================================

const generateSchemas = (): string => {
	const bcdCSS = bcd.css;

	if (!bcdCSS.types) {
		throw new Error("No types found in BCD");
	}

	const analyses = analyzeTypes(bcdCSS.types);
	const sortedNames = topologicalSort(analyses);
	const generated = new Set<string>();

	const lines: string[] = [
		"/**",
		" * Generated based on `@mdn/browser-compat-data`.",
		" * @version " + (bcd.__meta?.version || "unknown"),
		" */",
		"",
		"import { SchemaGetter } from \"effect\";",
		"import * as Schema from \"effect/Schema\";",
		"",
	];

	for (const typeName of sortedNames) {
		const analysis = analyses.get(typeName)!;
		if (generated.has(pascalCase(typeName))) continue;

		const schema = generateTypeSchema(analysis, analyses, generated);
		lines.push(schema);
		lines.push("");
	}

	lines.push("// ==============================================================================");
	lines.push("// Type Map");
	lines.push("// ==============================================================================");
	lines.push("");
	lines.push("export const typeMap = {");

	const typeMapKeys = sortedNames.filter((n) => generated.has(pascalCase(n)));
	for (const typeName of typeMapKeys) {
		lines.push(`\t"<${typeName}>": ${pascalCase(typeName)},`);
	}
	lines.push("} as const;");

	return lines.join("\n");
};

// ============================================================================
// File Writing
// ============================================================================

const writeSchemas = (content: string): void => {
	const outputPath = resolve(__dirname, "../src/generated/types.bcd.gen.ts");
	try {
		mkdirSync(dirname(outputPath), { recursive: true });
		writeFileSync(outputPath, content);
		console.log(`Written to: ${outputPath}`);
	} catch (e) {
		const err = e instanceof Error ? e.message : "Unknown error";
		console.error(`Failed to write: ${err}`);
		process.exit(1);
	}
};

// ============================================================================
// Run
// ============================================================================

const main = (): void => {
	try {
		const schemas = generateSchemas();
		writeSchemas(schemas);
		console.log("Successfully generated BCD type schemas!");
	} catch (e) {
		console.error("Error:", e instanceof Error ? e.message : e);
		process.exit(1);
	}
};

main();
