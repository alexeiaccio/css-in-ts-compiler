import * as Bun from "bun";

import { generateCSS } from "./compiler.js";
import { clearRegistry } from "./compiler.js";

const args = Bun.argv.slice(2);

interface CLIOptions {
	output?: string;
	watch: boolean;
	help: boolean;
}

function parseArgs(args: string[]): CLIOptions {
	const options: CLIOptions = {
		watch: false,
		help: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "build" || arg === undefined) {
			continue;
		}

		if (arg === "watch") {
			options.watch = true;
			continue;
		}

		if (arg === "-o" || arg === "--output") {
			options.output = args[i + 1];
			i++;
			continue;
		}

		if (arg === "-h" || arg === "--help") {
			options.help = true;
			continue;
		}

		if (!arg.startsWith("-")) {
			continue;
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
Usage: wort [command] [options]

Commands:
  build    Build styles (default)
  watch    Watch mode for development

Options:
  -o, --output <file>    Output file (supports [hash] placeholder)
  -h, --help             Show this help message

Examples:
  wort build src/styles.ts -o dist/[hash].css
  wort watch src/styles.ts -o dist/styles.css
`);
}

async function generateHash(): Promise<string> {
	const timestamp = Date.now().toString();
	let hash = 0;
	for (let i = 0; i < timestamp.length; i++) {
		const char = timestamp.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(8, "0");
}

export async function build(inputPath?: string, outputPath?: string): Promise<void> {
	const originalLog = console.log;
	const originalError = console.error;
	const originalWarn = console.warn;

	console.log = (...args) => originalError(...args);
	console.error = (...args) => originalError(...args);
	console.warn = (...args) => originalWarn(...args);

	if (inputPath) {
		try {
			await import(Bun.pathToFileURL(inputPath).href);
		} catch (error) {
			// Ignore import errors, the file might already be imported
		}
	}

	const css = generateCSS();

	console.log = originalLog;
	console.error = originalError;
	console.warn = originalWarn;

	if (outputPath) {
		let finalPath = outputPath;

		if (outputPath.includes("[hash]")) {
			const hash = await generateHash();
			finalPath = outputPath.replace("[hash]", hash);
		}

		await Bun.write(finalPath, css);
		console.log(`Output written to: ${finalPath}`);
	} else {
		process.stdout.write(css);
	}

	clearRegistry();
}

export async function watch(inputPath: string, outputPath: string): Promise<void> {
	console.log(`Watching ${inputPath} for changes...`);

	const watcher = Bun.watch(inputPath);

	for await (const event of watcher) {
		if (event === "change") {
			console.log("Changes detected, rebuilding...");
			try {
				await build(inputPath, outputPath);
				console.log("Build complete.");
			} catch (error) {
				console.error("Build failed:", error);
			}
		}
	}
}

export async function main(): Promise<void> {
	const options = parseArgs(args);

	if (options.help) {
		showHelp();
		return;
	}

	const inputPath = args.find((arg) => !arg.startsWith("-") && arg !== "build" && arg !== "watch");

	if (options.watch) {
		if (!inputPath) {
			console.error("Error: Input file required for watch mode");
			process.exit(1);
		}
		if (!options.output) {
			console.error("Error: Output file required for watch mode");
			process.exit(1);
		}
		watch(inputPath, options.output);
		return;
	}

	if (inputPath) {
		await build(inputPath, options.output);
	} else {
		showHelp();
	}
}

if (import.meta.main) {
	main().catch(console.error);
}
