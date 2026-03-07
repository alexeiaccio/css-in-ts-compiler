/**
 * Generate All - Run all generators in sequence
 */

console.log("Running all generators...\n");

// Sequential execution via dynamic imports
async function main() {
	// Generate unified data first (required by other generators)
	await import("./generate-unified-data.ts");

	// Generate TaggedClass types from WebRef and BCD
	await import("./generate-tagged-classes.ts");

	// Generate property functions with status tags
	await import("./generate-functions.ts");

	console.log("\n✅ All generation complete!");
}

main().catch(console.error);
