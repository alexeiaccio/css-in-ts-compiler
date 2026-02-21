/**
 * CSS Syntax Collector
 *
 * Collects and normalizes CSS syntax definitions from mdn-data/css/syntaxes.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import syntaxes from "mdn-data/css/syntaxes.json" with { type: "json" };

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "paths.json"), "utf-8"));

const CACHE_VERSION = "1.0.0";
const CACHE_DIR = path.resolve(paths.cache.dir);
const CACHE_FILE = path.resolve(CACHE_DIR, "syntax-cache.json");
const LOG_FILE = path.resolve(paths.cache.log);

export interface SyntaxDefinition {
	/** The syntax name (e.g., '<length>', '<color>') */
	name: string;
	/** The CSS syntax string */
	syntax: string;
	/** Human-readable prose description (if available) */
	prose?: string;
	/** Source reference */
	source: string;
}

export interface SyntaxCollection {
	version: string;
	timestamp: string;
	/** Map of syntax name to definition */
	definitions: Map<string, SyntaxDefinition>;
	/** Total number of definitions */
	count: number;
}

interface CacheData {
	version: string;
	timestamp: string;
	definitions: Record<string, SyntaxDefinition>;
	count: number;
}

function log(message: string): void {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] ${message}\n`;
	fs.mkdirSync(CACHE_DIR, { recursive: true });
	fs.appendFileSync(LOG_FILE, logMessage);
	console.log(message);
}

/**
 * Load syntax definitions from mdn-data
 */
function collectSyntaxes(): SyntaxCollection {
	log("Loading CSS syntax definitions from mdn-data...");

	const definitions = new Map<string, SyntaxDefinition>();

	// Parse mdn-data/css/syntaxes.json
	for (const [name, entry] of Object.entries(syntaxes)) {
		// Skip invalid or internal syntaxes
		if (shouldSkipSyntax(name)) {
			continue;
		}

		// Handle different entry formats
		const syntax = (entry as any).syntax ?? "";
		const prose = (entry as any).prose;

		const def: SyntaxDefinition = {
			name,
			syntax,
			prose,
			source: "mdn-data/css/syntaxes.json",
		};

		definitions.set(name, def);
	}

	log(`  Loaded ${definitions.size} syntax definitions`);

	return {
		version: CACHE_VERSION,
		timestamp: new Date().toISOString(),
		definitions,
		count: definitions.size,
	};
}

/**
 * Determine if a syntax should be skipped
 */
function shouldSkipSyntax(name: string): boolean {
	// Skip vendor-prefixed
	if (name.startsWith("-")) return true;
	
	// Skip token types
	if (name.endsWith("-token")) return true;
	
	// Skip internal/implementation details
	if (name.includes("(@")) return true;
	
	// Skip function calls notation
	if (name.startsWith("(") && name.endsWith(")")) return true;
	
	return false;
}

function loadCache(): SyntaxCollection | null {
	if (!fs.existsSync(CACHE_FILE)) {
		return null;
	}

	try {
		const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as CacheData;
		
		if (data.version !== CACHE_VERSION) {
			log("  Cache version mismatch, reloading...");
			return null;
		}

		// Convert plain object back to Map
		const definitions = new Map<string, SyntaxDefinition>();
		for (const [key, value] of Object.entries(data.definitions)) {
			definitions.set(key, value);
		}

		return {
			version: data.version,
			timestamp: data.timestamp,
			definitions,
			count: data.count,
		};
	} catch (err) {
		log(`  Cache load failed: ${err}`);
		return null;
	}
}

function saveCache(data: SyntaxCollection): void {
	fs.mkdirSync(CACHE_DIR, { recursive: true });
	
	const cacheData: CacheData = {
		version: data.version,
		timestamp: data.timestamp,
		definitions: Object.fromEntries(data.definitions),
		count: data.count,
	};
	
	fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
	log(`Cache saved to ${CACHE_FILE}`);
}

/**
 * Get syntax definitions (from cache or fresh load)
 */
export function getSyntaxData(options?: { force?: boolean }): SyntaxCollection {
	const { force = false } = options ?? {};

	// Check cache
	if (!force) {
		const cached = loadCache();
		if (cached) {
			log("Using cached syntax data");
			return cached;
		}
	}

	// Load fresh data
	const data = collectSyntaxes();
	saveCache(data);

	return data;
}

/**
 * Get syntax definitions filtered by pattern
 */
export function getSyntaxesByPattern(
	data: SyntaxCollection,
	pattern: RegExp | string
): Map<string, SyntaxDefinition> {
	const regex = typeof pattern === "string" 
		? new RegExp(pattern) 
		: pattern;
	
	const matches = new Map<string, SyntaxDefinition>();
	for (const [name, def] of data.definitions) {
		if (regex.test(name)) {
			matches.set(name, def);
		}
	}
	return matches;
}

/**
 * Get syntaxes by category
 */
export function getSyntaxesByCategory(data: SyntaxCollection): {
	primitives: Map<string, SyntaxDefinition>;
	composites: Map<string, SyntaxDefinition>;
	functions: Map<string, SyntaxDefinition>;
} {
	const primitives = new Map<string, SyntaxDefinition>();
	const composites = new Map<string, SyntaxDefinition>();
	const functions = new Map<string, SyntaxDefinition>();

	for (const [name, def] of data.definitions) {
		if (isPrimitiveSyntax(name)) {
			primitives.set(name, def);
		} else if (isFunctionSyntax(name)) {
			functions.set(name, def);
		} else {
			composites.set(name, def);
		}
	}

	return { primitives, composites, functions };
}

function isPrimitiveSyntax(name: string): boolean {
	// Primitive types in mdn-data don't use angle brackets in keys
	// They match CSS syntax references like "length", "color", "number"
	const primitives = [
		"length", "percentage", "length-percentage",
		"angle", "time", "frequency", "resolution",
		"color", "image", "url", "string", "number", "integer",
		"position", "identifier", "custom-ident",
		"angle-percentage", "time-percentage",
		"flex", "line-height", "line-width",
	];
	return primitives.includes(name);
}

function isFunctionSyntax(name: string): boolean {
	// Function syntaxes usually end with ()
	return name.endsWith("()") || name.includes("(");
}

/**
 * Get common CSS value types
 */
export function getCommonValueTypes(data: SyntaxCollection): SyntaxDefinition[] {
	const common = [
		"<length>",
		"<percentage>",
		"<length-percentage>",
		"<angle>",
		"<time>",
		"<color>",
		"<image>",
		"<url>",
		"<string>",
		"<number>",
		"<integer>",
	];

	return common
		.map(name => data.definitions.get(name))
		.filter((def): def is SyntaxDefinition => def !== undefined);
}

// CLI entry point
if (import.meta.main) {
	// Run synchronously for CLI
	const data = getSyntaxData({ force: true });
	
	console.log("\n=== CSS Syntax Collection ===");
	console.log(`Total definitions: ${data.count}`);
	
	const categories = getSyntaxesByCategory(data);
	console.log(`  Primitives: ${categories.primitives.size}`);
	console.log(`  Functions: ${categories.functions.size}`);
	console.log(`  Composites: ${categories.composites.size}`);
	
	console.log("\n=== Common Value Types ===");
	const common = getCommonValueTypes(data);
	for (const def of common) {
		console.log(`  ${def.name}: ${def.syntax.slice(0, 60)}${def.syntax.length > 60 ? "..." : ""}`);
	}
	
	console.log("\n=== Sample Composites ===");
	const composites = Array.from(categories.composites.values()).slice(0, 5);
	for (const def of composites) {
		console.log(`  ${def.name}: ${def.syntax.slice(0, 60)}${def.syntax.length > 60 ? "..." : ""}`);
	}
}
