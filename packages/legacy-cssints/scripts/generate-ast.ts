import { Effect, Console, Data, Layer } from "effect";
import { FileService } from "./file-service.ts";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEMP_DIR = resolve(__dirname, "../temp-lightningcss");
const DATA_DIR = resolve(__dirname, "../data");
const AST_JSON_PATH = resolve(DATA_DIR, "ast.json");
const VERSION_FILE = resolve(DATA_DIR, "lightningcss-version.json");
const LIGHTNINGCSS_REPO = "https://github.com/parcel-bundler/lightningcss.git";

export class VersionError extends Data.TaggedError("VersionError")<{
	reason: string;
}> {}

export class ProcessError extends Data.TaggedError("ProcessError")<{
	step: string;
	reason: string;
}> {}

interface VersionInfo {
	readonly commitHash: string;
	readonly generatedAt: string;
}

export const main = Effect.gen(function* () {
	const fileService = yield* FileService;

	yield* Console.log("🔍 Checking lightningcss version...");

	const currentVersion = yield* getGitVersion();
	yield* Console.log(`   Current version: ${currentVersion}`);

	const storedVersion = yield* getStoredVersion(fileService);

	if (storedVersion === currentVersion) {
		yield* Console.log("✅ Version unchanged - skipping generation");
		yield* Console.log(`   (version: ${currentVersion})`);
		return { skipped: true as const };
	}

	yield* Console.log(`   Previous: ${storedVersion ?? "none"}`);
	yield* Console.log("🔄 Version changed - regenerating...\n");

	yield* Console.log("📦 Step 1: Cloning lightningcss...");
	yield* cloneRepo();

	yield* Console.log("\n⚙️  Step 2: Building ast.json...");
	yield* buildAst();

	yield* Console.log("\n📋 Step 3: Copying to data folder...");
	const srcPath = resolve(TEMP_DIR, "node/ast.json");
	yield* copyFile(fileService, srcPath, AST_JSON_PATH);

	yield* storeVersion(fileService, currentVersion);

	yield* Console.log("\n🧹 Step 4: Cleaning up temp directory...");
	yield* cleanup(fileService);

	yield* Console.log("\n✅ Generation complete!");
	yield* Console.log(`   Version: ${currentVersion}`);

	return { skipped: false as const };
});

const getGitVersion = () =>
	Effect.gen(function* () {
		return yield* Effect.try({
			try: () => {
				const { execSync } = require("child_process");
				const fs = require("fs");
				if (!fs.existsSync(TEMP_DIR)) {
					return null;
				}
				const hash = execSync("git rev-parse HEAD", {
					cwd: TEMP_DIR,
					encoding: "utf-8",
				}).trim();
				return hash.slice(0, 7);
			},
			catch: () => null,
		});
	});

const getStoredVersion = (fileService: FileService["Service"]) =>
	Effect.gen(function* () {
		const exists = yield* fileService.exists(VERSION_FILE);
		if (!exists) {
			return null;
		}

		const content = yield* fileService.readFileString(VERSION_FILE);
		const info: VersionInfo = JSON.parse(content);
		return info.commitHash;
	});

const storeVersion = (fileService: FileService["Service"], version: string) =>
	Effect.gen(function* () {
		const dir = dirname(VERSION_FILE);
		yield* fileService.makeDirectory(dir);

		const info: VersionInfo = {
			commitHash: version,
			generatedAt: new Date().toISOString(),
		};

		yield* fileService.writeFileString(VERSION_FILE, JSON.stringify(info, null, 2));
	});

const cloneRepo = () =>
	Effect.gen(function* () {
		yield* Effect.try({
			try: () => {
				const { execSync } = require("child_process");
				const fs = require("fs");

				if (fs.existsSync(TEMP_DIR)) {
					fs.rmSync(TEMP_DIR, { recursive: true, force: true });
				}

				execSync(`git clone --depth 1 ${LIGHTNINGCSS_REPO} ${TEMP_DIR}`, {
					stdio: "inherit",
				});
			},
			catch: (error) =>
				new ProcessError({
					step: "clone repo",
					reason: error instanceof Error ? error.message : "Failed",
				}),
		});
	});

const buildAst = () =>
	Effect.gen(function* () {
		yield* Effect.try({
			try: () => {
				const { execSync } = require("child_process");
				execSync("cargo run --example schema --features jsonschema", {
					cwd: TEMP_DIR,
					stdio: "inherit",
				});
			},
			catch: (error) =>
				new ProcessError({
					step: "build ast.json",
					reason: error instanceof Error ? error.message : "Failed - is Cargo installed?",
				}),
		});
	});

const copyFile = (fileService: FileService["Service"], src: string, dest: string) =>
	fileService.readFileString(src).pipe(
		Effect.flatMap((content) => fileService.writeFileString(dest, content)),
	);

const cleanup = (fileService: FileService["Service"]) =>
	Effect.gen(function* () {
		const exists = yield* fileService.exists(TEMP_DIR);
		if (exists) {
			// Note: FileService doesn't have remove, so we'll just log
			yield* Console.log(`   Note: Temp directory ${TEMP_DIR} remains (remove not implemented)`);
		}
	});

Effect.runPromiseExit(main.pipe(
	Effect.provide(FileService.layer),
	Effect.provide(NodeFileSystem.layer),
	Effect.provide(NodePath.layer),
)).then((exit) => {
	if (exit._tag === "Failure") {
		Console.error("❌ Failed:", exit.cause);
		process.exit(1);
	}
});
