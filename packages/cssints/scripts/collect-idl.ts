/**
 * IDL Data Collector
 *
 * Fetches and caches WebIDL data from @webref/idl package.
 * Caches to node_modules/.cache/cssints/idl-cache.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { listAll } from "@webref/idl";

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "paths.json"), "utf-8"));

const CACHE_VERSION = "1.0.0";
const CACHE_DIR = path.resolve(paths.cache.dir);
const CACHE_FILE = path.resolve(CACHE_DIR, "idl-cache.json");
const LOG_FILE = path.resolve(paths.cache.log);

export interface IDLCollection {
	version: string;
	timestamp: string;
	files: Map<string, string>;
}

interface CacheData {
	version: string;
	timestamp: string;
	files: Record<string, string>;
}

function log(message: string): void {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] ${message}\n`;
	fs.mkdirSync(CACHE_DIR, { recursive: true });
	fs.appendFileSync(LOG_FILE, logMessage);
	console.log(message);
}

async function collectIDL(): Promise<IDLCollection> {
	log("Fetching WebRef IDL data...");

	const files = new Map<string, string>();
	const allIdl = await listAll();

	for (const [specName, file] of Object.entries(allIdl)) {
		try {
			const text = await file.text();
			files.set(specName, text);
		} catch (err) {
			log(`  Warning: Failed to fetch ${specName}: ${err}`);
		}
	}

	log(`  Collected ${files.size} IDL files`);

	return {
		version: CACHE_VERSION,
		timestamp: new Date().toISOString(),
		files,
	};
}

function loadCache(): IDLCollection | null {
	if (!fs.existsSync(CACHE_FILE)) {
		return null;
	}

	try {
		const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as CacheData;
		
		if (data.version !== CACHE_VERSION) {
			log("  Cache version mismatch, refetching...");
			return null;
		}

		// Convert plain object back to Map
		const files = new Map<string, string>();
		for (const [key, value] of Object.entries(data.files)) {
			files.set(key, value);
		}

		return {
			version: data.version,
			timestamp: data.timestamp,
			files,
		};
	} catch (err) {
		log(`  Cache load failed: ${err}`);
		return null;
	}
}

function saveCache(data: IDLCollection): void {
	fs.mkdirSync(CACHE_DIR, { recursive: true });
	
	// Convert Map to plain object for JSON serialization
	const cacheData: CacheData = {
		version: data.version,
		timestamp: data.timestamp,
		files: Object.fromEntries(data.files),
	};
	
	fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
	log(`Cache saved to ${CACHE_FILE}`);
}

export async function getIDLData(options?: { force?: boolean }): Promise<IDLCollection> {
	const { force = false } = options ?? {};

	// Check cache
	if (!force) {
		const cached = loadCache();
		if (cached) {
			log("Using cached IDL data");
			return cached;
		}
	}

	// Fetch fresh data
	const data = await collectIDL();
	saveCache(data);

	return data;
}

export function getIDLFilesByPattern(
	data: IDLCollection, 
	pattern: RegExp | string
): Map<string, string> {
	const regex = typeof pattern === "string" 
		? new RegExp(pattern) 
		: pattern;
	
	const matches = new Map<string, string>();
	for (const [name, content] of data.files) {
		if (regex.test(name)) {
			matches.set(name, content);
		}
	}
	return matches;
}

// CLI entry point
if (import.meta.main) {
	getIDLData({ force: true })
		.then((data) => {
			console.log("IDL data collected successfully");
			console.log(`Files: ${data.files.size}`);
			console.log("\nSample files:");
			const sample = Array.from(data.files.keys()).slice(0, 10);
			sample.forEach((f) => console.log(`  - ${f}`));
		})
		.catch((err) => {
			console.error("Failed to collect IDL data:", err);
			process.exit(1);
		});
}
