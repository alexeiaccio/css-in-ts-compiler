/**
 * Generate ast.d.ts from ast.json using Effect's SchemaRepresentation pipeline.
 *
 * Pipeline: ast.json (JSON Schema from schemars)
 *   → JsonSchema.fromSchemaDraft07 → fromJsonSchemaDocument
 *   → toMultiDocument → toCodeDocument → ast.d.ts
 *
 * Usage: node scripts/generate-all.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

async function main() {
	const { JsonSchema, SchemaRepresentation } = await import("effect");

	console.log("Reading ast.json...");
	const raw = JSON.parse(readFileSync(join(root, "ast.json"), "utf-8"));

	console.log("Converting Draft-07 → Draft-2020-12...");
	const draft07 = JsonSchema.fromSchemaDraft07(raw);

	console.log("Converting to Effect SchemaRepresentation...");
	const doc = SchemaRepresentation.fromJsonSchemaDocument(draft07);

	console.log("Building MultiDocument...");
	const multi = SchemaRepresentation.toMultiDocument(doc);

	console.log("Generating code via toCodeDocument...");
	const codeDoc = SchemaRepresentation.toCodeDocument(multi);

	// Collect all definition names from ast.json
	const allDefNames = new Set(Object.keys(raw.definitions || {}));
	if (raw.title) allDefNames.add(raw.title);

	// Collect all schemas
	const allSchemas = new Map();
	for (const [$ref, code] of Object.entries(codeDoc.references.recursives)) {
		allSchemas.set($ref, { runtime: code.runtime, type: code.Type, isRecursive: true });
	}
	for (const { $ref, code } of codeDoc.references.nonRecursives) {
		allSchemas.set($ref, { runtime: code.runtime, type: code.Type, isRecursive: false });
	}

	// Build types file only (runtime schemas deferred to Phase 2)
	const typeLines = [];
	typeLines.push("/**");
	typeLines.push(" * Auto-generated TypeScript types for lightningcss AST.");
	typeLines.push(" * Generated from ast.json via SchemaRepresentation.toCodeDocument.");
	typeLines.push(" * Do not edit manually.");
	typeLines.push(" */");
	typeLines.push("");

	for (const [$ref, { type }] of allSchemas) {
		if (type) {
			typeLines.push(`export type ${$ref} = ${type}`);
			typeLines.push("");
		}
	}

	// Root StyleSheet type
	if (!allSchemas.has("StyleSheet") && codeDoc.codes.length > 0) {
		const rootCode = codeDoc.codes[0];
		if (rootCode.Type) {
			typeLines.push(`export type StyleSheet = ${rootCode.Type}`);
			typeLines.push("");
		}
	}

	const typeOutput = typeLines.join("\n");
	const typePath = join(root, "src", "ast.d.ts");
	writeFileSync(typePath, typeOutput);

	console.log(`Generated ${typePath} (${typeOutput.length} bytes)`);
	console.log(`  ${allSchemas.size} types`);
}

main().catch((err) => {
	console.error("Failed:", err);
	process.exit(1);
});
