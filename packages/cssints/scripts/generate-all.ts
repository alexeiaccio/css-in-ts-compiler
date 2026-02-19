/**
 * Main Generation Script
 *
 * Orchestrates the complete CSS type generation pipeline.
 * Uses the new IDL-to-AST pipeline for split output files.
 *
 * Usage:
 *   bun run scripts/generate-all.ts
 *   bun run scripts/generate-all.ts --force
 *   bun run scripts/generate-all.ts --legacy (use old generators)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { generatePipeline } from "./generate-pipeline";

// Legacy imports (kept for backward compatibility)
import { getWebRefData, getCSSFunctions } from "./collect-webref";
import { filterFunctions } from "./filter-baseline";
import { generateAll as generateLegacyFunctions } from "./generate-functions";
import { generateTypes as generateLegacyTypes } from "./generate-types";
import { generateAllProperties as generateLegacyProperties } from "./generate-props";

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "paths.json"), "utf-8"));
const LOG_FILE = path.resolve(paths.cache.log);

interface CLIOptions {
	force: boolean;
	verbose: boolean;
	legacy: boolean;
}

function parseArgs(): CLIOptions {
	const args = process.argv.slice(2);
	return {
		force: args.includes("--force"),
		verbose: args.includes("--verbose"),
		legacy: args.includes("--legacy"),
	};
}

function log(message: string, verbose = false): void {
	if (verbose || !message.startsWith("[debug]")) {
		console.log(message);
	}

	const timestamp = new Date().toISOString();
	fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
	fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

/**
 * Legacy generation pipeline (kept for backward compatibility)
 */
async function runLegacyPipeline(options: CLIOptions): Promise<void> {
	log("Using legacy generation pipeline...", options.verbose);

	// Step 1: Collect WebRef data
	log("\n[1/6] Collecting WebRef data...");
	const webrefData = await getWebRefData({ force: options.force });
	log(`  Collected ${Object.keys(webrefData.css).length} CSS specs`);

	// Step 2: Extract functions
	log("\n[2/6] Extracting CSS functions...");
	const allFunctions = getCSSFunctions(webrefData);
	log(`  Found ${allFunctions.length} CSS functions`);

	// Step 3: Filter to modern baseline
	log("\n[3/6] Filtering to modern baseline...");
	const filtered = filterFunctions(allFunctions, {
		status: ["modern", "experimental"],
		includeVendorPrefixed: false,
	});
	log(`  Filtered to ${filtered.length} functions (${filtered.filter((f) => f.status === "modern").length} modern)`);

	// Step 4: Generate types
	log("\n[4/6] Generating CSS types...");
	generateLegacyTypes();

	// Step 5: Generate typed functions
	log("\n[5/6] Generating typed functions...");
	generateLegacyFunctions(filtered);

	// Step 6: Generate properties
	log("\n[6/6] Generating CSS properties...");
	await generateLegacyProperties();
}

/**
 * New generation pipeline with split output files
 */
async function runNewPipeline(options: CLIOptions): Promise<void> {
	log("Using new IDL-to-AST generation pipeline...", options.verbose);

	const result = await generatePipeline({
		options: {
			forceRefresh: options.force,
			includeJSDoc: true,
			includeDeprecated: true,
			mergePartials: true,
		},
	});

	if (!result.success) {
		throw new Error(`Generation failed with ${result.errors.length} errors`);
	}
}

async function main(): Promise<void> {
	const options = parseArgs();

	log("Starting CSS generation...");
	log(`Options: force=${options.force}, verbose=${options.verbose}, legacy=${options.legacy}`, options.verbose);

	try {
		if (options.legacy) {
			await runLegacyPipeline(options);
		} else {
			await runNewPipeline(options);
		}

		log("\n✅ Generation complete!");
	} catch (err) {
		log(`\n❌ Generation failed: ${err}`);
		process.exit(1);
	}
}

void main();
