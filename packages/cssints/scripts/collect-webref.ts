/**
 * WebRef Data Collector
 *
 * Fetches and caches CSS data from @webref/css package.
 * Caches to node_modules/.cache/cssints/webref-cache.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { listAll } from "@webref/css";

interface CacheData {
	version: string;
	timestamp: string;
	css: Record<string, unknown>;
}

const CACHE_VERSION = "1.0.0";
const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "../scripts/paths.json"), "utf-8"));
const CACHE_DIR = path.resolve(paths.cache.dir);
const CACHE_FILE = path.resolve(paths.cache.webref);
const LOG_FILE = path.resolve(paths.cache.log);

function log(message: string): void {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] ${message}\n`;
	fs.mkdirSync(CACHE_DIR, { recursive: true });
	fs.appendFileSync(LOG_FILE, logMessage);
	console.log(message);
}

async function collectWebRef(): Promise<CacheData> {
	log("Fetching WebRef CSS data...");

	const cssData: Record<string, unknown> = {};
	const allCss = await listAll();

	for (const [spec, data] of Object.entries(allCss)) {
		cssData[spec] = data;
	}

	const cacheData: CacheData = {
		version: CACHE_VERSION,
		timestamp: new Date().toISOString(),
		css: cssData,
	};

	return cacheData;
}

function loadCache(): CacheData | null {
	if (!fs.existsSync(CACHE_FILE)) {
		return null;
	}

	try {
		const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
		return data as CacheData;
	} catch {
		return null;
	}
}

function saveCache(data: CacheData): void {
	fs.mkdirSync(CACHE_DIR, { recursive: true });
	fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
	log(`Cache saved to ${CACHE_FILE}`);
}

export async function getWebRefData(options?: { force?: boolean }): Promise<CacheData> {
	const { force = false } = options ?? {};

	// Check cache
	if (!force) {
		const cached = loadCache();
		if (cached && cached.version === CACHE_VERSION) {
			log("Using cached WebRef data");
			return cached;
		}
	}

	// Fetch fresh data
	const data = await collectWebRef();
	saveCache(data);

	return data;
}

export function getCSSFunctions(data: CacheData): Array<{ name: string; syntax: string; spec: string }> {
	const functions: Array<{ name: string; syntax: string; spec: string }> = [];

	const css = data.css as {
		functions?: Array<{ name?: string; syntax?: string; href?: string }>;
	};

	if (css.functions) {
		for (const fn of css.functions) {
			if (fn.name && fn.syntax) {
				const spec = fn.href?.match(/https:\/\/drafts\.csswg\.org\/([^/]+)/)?.[1] ?? "unknown";
				functions.push({
					name: fn.name.replace("()", ""),
					syntax: fn.syntax,
					spec,
				});
			}
		}
	}

	return functions;
}

export function getCSSProperties(data: CacheData): Array<{ name: string; syntax: string; spec: string }> {
	const properties: Array<{ name: string; syntax: string; spec: string }> = [];

	const css = data.css as {
		properties?: Array<{ name?: string; syntax?: string; href?: string }>;
	};

	if (css.properties) {
		for (const prop of css.properties) {
			if (prop.name && prop.syntax) {
				const spec = prop.href?.match(/https:\/\/drafts\.csswg\.org\/([^/]+)/)?.[1] ?? "unknown";
				properties.push({
					name: prop.name,
					syntax: prop.syntax,
					spec,
				});
			}
		}
	}

	return properties;
}

// CLI entry point
if (import.meta.main) {
	getWebRefData({ force: true })
		.then((data) => {
			console.log("WebRef data collected successfully");
			console.log(`CSS specs: ${Object.keys(data.css).length}`);
		})
		.catch((err) => {
			console.error("Failed to collect WebRef data:", err);
			process.exit(1);
		});
}
