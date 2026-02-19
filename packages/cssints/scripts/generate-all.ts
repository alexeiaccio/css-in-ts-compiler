/**
 * Main Generation Script
 *
 * Orchestrates the complete CSS type generation pipeline.
 * Uses the new IDL-to-AST pipeline for split output files.
 *
 * Usage:
 *   bun run scripts/generate-all.ts
 *   bun run scripts/generate-all.ts --force
 *   bun run scripts/generate-all.ts --verbose
 */

import * as fs from "node:fs";
import { generatePipeline } from "./generate-pipeline";

const LOG_FILE = "./node_modules/.cache/cssints/generation.log";

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
	fs.mkdirSync("./node_modules/.cache/cssints", { recursive: true });
	fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

async function main(): Promise<void> {
	const options = parseArgs();

	log("Starting CSS type generation pipeline...");
	log(`Options: force=${options.force}, verbose=${options.verbose}`, options.verbose);

	try {
		const result = await generatePipeline({
			options: {
				forceRefresh: options.force,
				includeJSDoc: true,
				includeDeprecated: true,
				mergePartials: true,
			},
		});

		if (result.success) {
			log("\n✅ Generation complete!");
			log(`\nGenerated files:`);
			for (const [filename] of result.files) {
				log(`  - ${filename}`);
			}
		} else {
			log(`\n❌ Generation failed with ${result.errors.length} errors`);
			for (const err of result.errors) {
				log(`  ${err.file}: ${err.error.message}`);
			}
			process.exit(1);
		}
	} catch (err) {
		log(`\n❌ Generation failed: ${err}`);
		process.exit(1);
	}
}

void main();
