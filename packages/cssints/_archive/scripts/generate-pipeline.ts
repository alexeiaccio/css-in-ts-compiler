/**
 * Generation Pipeline Orchestrator
 *
 * Coordinates all data sources and generates split output files:
 * - types.gen.ts (from IDL)
 * - syntax.gen.ts (from mdn-data)
 * - compat.gen.ts (from browser-compat-data)
 * - properties.gen.ts (from @webref/css)
 * - functions.gen.ts (from @webref/css)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getIDLData } from "./collect-idl";
import { extractCSSIDLTypes } from "./extract-css-idl";
import { getSyntaxData, type SyntaxCollection } from "./collect-syntax";
import { getWebRefData, getCSSFunctions, getCSSProperties } from "./collect-webref";
import { filterFunctions } from "./filter-baseline";
import { parseWebIDL } from "./ast/idl-parser";
import { parseSyntax, parseAllSyntaxes } from "./ast/syntax-parser";
import { 
  emitAST, 
  emitType, 
  emitProperty, 
  emitCSSFunction,
  emitIDLTypes,
  emitSyntaxTypes,
  emitCompatData,
  emitProperties,
  emitFunctions 
} from "./ast/ts-emitter";
import type { CSSTypeAST, IDLType, CSSValueType, CSSProperty, CSSFunction } from "./ast/css-type-ast";
import { createTypeRef } from "./ast/css-type-ast";

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "paths.json"), "utf-8"));

// ============================================================================
// Configuration
// ============================================================================

export interface GenerationConfig {
	/** Which sources to include */
	sources: {
		idl: boolean;
		syntax: boolean;
		compat: boolean;
		properties: boolean;
		functions: boolean;
	};
	/** Output file configuration */
	output: {
		dir: string;
		types: string;      // types.gen.ts
		syntax: string;     // syntax.gen.ts
		compat: string;     // compat.gen.ts
		properties: string; // properties.gen.ts
		functions: string;  // functions.gen.ts
	};
	/** Generation options */
	options: {
		includeJSDoc: boolean;
		includeDeprecated: boolean;
		mergePartials: boolean;
		forceRefresh: boolean;
	};
}

const DEFAULT_CONFIG: GenerationConfig = {
	sources: {
		idl: true,
		syntax: true,
		compat: true,
		properties: true,
		functions: true,
	},
	output: {
		dir: path.resolve(__dirname, "..", "lib"),
		types: "types.gen.ts",
		syntax: "syntax.gen.ts",
		compat: "compat.gen.ts",
		properties: "properties.gen.ts",
		functions: "functions.gen.ts",
	},
	options: {
		includeJSDoc: true,
		includeDeprecated: true,
		mergePartials: true,
		forceRefresh: false,
	},
};

// ============================================================================
// Data Collection
// ============================================================================

interface CollectedData {
	idlTypes: Map<string, IDLType>;
	syntaxTypes: Map<string, CSSValueType>;
	properties: Map<string, CSSProperty>;
	functions: Map<string, CSSFunction>;
	errors: Array<{ phase: string; error: Error }>;
}

/**
 * Collect all data from configured sources
 */
async function collectData(config: GenerationConfig): Promise<CollectedData> {
	const data: CollectedData = {
		idlTypes: new Map(),
		syntaxTypes: new Map(),
		properties: new Map(),
		functions: new Map(),
		errors: [],
	};

	console.log("\n=== Phase 1: Data Collection ===\n");

	// Collect IDL data
	if (config.sources.idl) {
		console.log("[1/5] Collecting IDL data...");
		try {
			const idlCollection = await getIDLData({ force: config.options.forceRefresh });
			const cssExtraction = extractCSSIDLTypes(idlCollection);
			
			// Merge extracted types
			for (const [name, type] of cssExtraction.cssTypes) {
				data.idlTypes.set(name, type);
			}
			
			console.log(`  ✓ Extracted ${data.idlTypes.size} CSS IDL types`);
		} catch (err) {
			data.errors.push({ phase: "idl", error: err as Error });
			console.error(`  ✗ Failed: ${err}`);
		}
	}

	// Collect syntax data
	if (config.sources.syntax) {
		console.log("[2/5] Collecting syntax data...");
		console.log("  ⚠ Syntax parsing temporarily disabled (performance issues)");
		// TODO: Fix syntax parser hanging issue
		// const syntaxCollection = getSyntaxData({ force: config.options.forceRefresh });
		// const parsedSyntaxes = parseAllSyntaxes(...)
	}

	// Collect WebRef CSS data
	if (config.sources.properties || config.sources.functions) {
		console.log("[3/5] Collecting WebRef CSS data...");
		try {
			const webrefData = await getWebRefData({ force: config.options.forceRefresh });
			
			// Extract properties
			if (config.sources.properties) {
				const allProps = getCSSProperties(webrefData);
				const filteredProps = allProps; // TODO: Apply baseline filtering
				
				for (const prop of filteredProps) {
					// Create CSSProperty AST node
					const cssProp: CSSProperty = {
						type: "property",
						name: prop.name,
						syntax: prop.syntax,
						valueType: createTypeRef("string"), // Simplified for now
						spec: prop.spec,
					};
					data.properties.set(prop.name, cssProp);
				}
				
				console.log(`  ✓ Extracted ${data.properties.size} CSS properties`);
			}
			
			// Extract functions
			if (config.sources.functions) {
				const allFunctions = getCSSFunctions(webrefData);
				const filteredFunctions = filterFunctions(allFunctions, {
					status: ["modern", "experimental"],
					includeVendorPrefixed: false,
				});
				
				for (const fn of filteredFunctions) {
					// Create CSSFunction AST node
					const cssFn: CSSFunction = {
						type: "function",
						name: fn.name,
						syntax: fn.syntax,
						parameters: [], // TODO: Parse syntax to extract parameters
						returnType: createTypeRef("string"),
						spec: fn.spec,
					};
					data.functions.set(fn.name, cssFn);
				}
				
				console.log(`  ✓ Extracted ${data.functions.size} CSS functions`);
			}
		} catch (err) {
			data.errors.push({ phase: "webref", error: err as Error });
			console.error(`  ✗ Failed: ${err}`);
		}
	}

	// Collect compat data (placeholder for now)
	if (config.sources.compat) {
		console.log("[4/5] Collecting browser compat data...");
		// TODO: Implement compat data collection
		console.log("  ⚠ Compat data collection not yet implemented");
	}

	console.log("\n=== Data Collection Complete ===");
	console.log(`Total: ${data.idlTypes.size} IDL types, ${data.syntaxTypes.size} syntax types, ${data.properties.size} properties, ${data.functions.size} functions`);

	return data;
}

// ============================================================================
// AST Assembly
// ============================================================================

/**
 * Build unified CSSTypeAST from collected data
 */
function buildAST(data: CollectedData, config: GenerationConfig): CSSTypeAST {
	const ast: CSSTypeAST = {
		version: "1.0.0",
		generatedAt: new Date().toISOString(),
		valueTypes: new Map(),
		properties: data.properties,
		functions: data.functions,
		idlTypes: data.idlTypes,
	};

	// Merge syntax types into valueTypes
	for (const [name, type] of data.syntaxTypes) {
		ast.valueTypes.set(name, type);
	}

	return ast;
}

// ============================================================================
// File Generation
// ============================================================================

interface GenerationResult {
	success: boolean;
	files: Map<string, string>; // filename -> content
	errors: Array<{ file: string; error: Error }>;
}

/**
 * Generate all output files
 */
function generateFiles(data: CollectedData, config: GenerationConfig): GenerationResult {
	const result: GenerationResult = {
		success: true,
		files: new Map(),
		errors: [],
	};

	console.log("\n=== Phase 2: File Generation ===\n");

	const emitterConfig = {
		jsdoc: config.options.includeJSDoc,
		deprecated: config.options.includeDeprecated,
	};

	// Generate types.gen.ts (IDL types)
	if (config.sources.idl && data.idlTypes.size > 0) {
		console.log("[1/5] Generating types.gen.ts...");
		try {
			const content = emitIDLTypes(data.idlTypes, emitterConfig);
			result.files.set(config.output.types, content);
			console.log(`  ✓ Generated ${content.split("\n").length} lines`);
		} catch (err) {
			result.errors.push({ file: config.output.types, error: err as Error });
			console.error(`  ✗ Failed: ${err}`);
		}
	}

	// Generate syntax.gen.ts (syntax types)
	if (config.sources.syntax && data.syntaxTypes.size > 0) {
		console.log("[2/5] Generating syntax.gen.ts...");
		try {
			const content = emitSyntaxTypes(data.syntaxTypes, emitterConfig);
			result.files.set(config.output.syntax, content);
			console.log(`  ✓ Generated ${content.split("\n").length} lines`);
		} catch (err) {
			result.errors.push({ file: config.output.syntax, error: err as Error });
			console.error(`  ✗ Failed: ${err}`);
		}
	}

	// Generate compat.gen.ts (browser compat)
	if (config.sources.compat) {
		console.log("[3/5] Generating compat.gen.ts...");
		// TODO: Implement compat generation
		console.log("  ⚠ Compat generation not yet implemented");
	}

	// Generate properties.gen.ts
	if (config.sources.properties && data.properties.size > 0) {
		console.log("[4/5] Generating properties.gen.ts...");
		try {
			const content = emitProperties(data.properties, emitterConfig);
			result.files.set(config.output.properties, content);
			console.log(`  ✓ Generated ${content.split("\n").length} lines`);
		} catch (err) {
			result.errors.push({ file: config.output.properties, error: err as Error });
			console.error(`  ✗ Failed: ${err}`);
		}
	}

	// Generate functions.gen.ts
	if (config.sources.functions && data.functions.size > 0) {
		console.log("[5/5] Generating functions.gen.ts...");
		try {
			const content = emitFunctions(data.functions, emitterConfig);
			result.files.set(config.output.functions, content);
			console.log(`  ✓ Generated ${content.split("\n").length} lines`);
		} catch (err) {
			result.errors.push({ file: config.output.functions, error: err as Error });
			console.error(`  ✗ Failed: ${err}`);
		}
	}

	result.success = result.errors.length === 0;
	return result;
}



// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Main generation pipeline
 */
export async function generatePipeline(config?: Partial<GenerationConfig>): Promise<GenerationResult> {
	const fullConfig = {
		...DEFAULT_CONFIG,
		...config,
		sources: { ...DEFAULT_CONFIG.sources, ...config?.sources },
		output: { ...DEFAULT_CONFIG.output, ...config?.output },
		options: { ...DEFAULT_CONFIG.options, ...config?.options },
	};

	console.log("Starting CSS type generation pipeline...");
	console.log(`Sources: IDL=${fullConfig.sources.idl}, Syntax=${fullConfig.sources.syntax}, Compat=${fullConfig.sources.compat}, Properties=${fullConfig.sources.properties}, Functions=${fullConfig.sources.functions}`);

	try {
		// Phase 1: Collect data
		const data = await collectData(fullConfig);

		// Phase 2: Generate files
		const result = generateFiles(data, fullConfig);

		// Phase 3: Write files
		if (result.success) {
			console.log("\n=== Phase 3: Writing Files ===\n");
			
			fs.mkdirSync(fullConfig.output.dir, { recursive: true });
			
			for (const [filename, content] of result.files) {
				const filepath = path.join(fullConfig.output.dir, filename);
				fs.writeFileSync(filepath, content);
				console.log(`  ✓ Written ${filepath} (${content.length} bytes)`);
			}
			
			console.log("\n✅ Generation complete!");
		} else {
			console.log("\n❌ Generation failed with errors:");
			for (const err of result.errors) {
				console.error(`  ${err.file}: ${err.error.message}`);
			}
		}

		return result;
	} catch (err) {
		console.error("\n❌ Pipeline failed:", err);
		return {
			success: false,
			files: new Map(),
			errors: [{ file: "pipeline", error: err as Error }],
		};
	}
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (import.meta.main) {
	const args = process.argv.slice(2);
	const force = args.includes("--force") || args.includes("-f");
	
	generatePipeline({
		options: {
			...DEFAULT_CONFIG.options,
			forceRefresh: force,
		},
	}).then((result) => {
		process.exit(result.success ? 0 : 1);
	});
}
