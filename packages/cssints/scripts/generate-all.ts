/**
 * Main Generation Script
 *
 * Orchestrates: collect -> filter -> parse -> generate types -> generate functions -> generate props
 *
 * Usage:
 *   bun run scripts/generate-all.ts
 *   bun run scripts/generate-all.ts --force
 *   bun run scripts/generate-all.ts --verbose
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { getWebRefData, getCSSFunctions } from "./collect-webref";
import { filterFunctions } from "./filter-baseline";
import { generateAll } from "./generate-functions";
import { generateTypes } from "./generate-types";
import { generateAllProperties } from "./generate-props";

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "paths.json"), "utf-8"));
const LOG_FILE = path.resolve(paths.cache.log);

interface CLIOptions {
	force: boolean;
	verbose: boolean;
}

function parseArgs(): CLIOptions {
	const args = process.argv.slice(2);
	return {
		force: args.includes("--force"),
		verbose: args.includes("--verbose"),
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

async function main(): Promise<void> {
	const options = parseArgs();

	log("Starting CSS generation...");
	log(`Options: force=${options.force}, verbose=${options.verbose}`, options.verbose);

	try {
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
		generateTypes();

		// Step 5: Generate typed functions
		log("\n[5/6] Generating typed functions...");
		generateAll(filtered);

		// Step 6: Generate properties
		log("\n[6/6] Generating CSS properties...");
		await generateAllProperties();

		log("\n✅ Generation complete!");
	} catch (err) {
		log(`\n❌ Generation failed: ${err}`);
		process.exit(1);
	}
}

void main();
