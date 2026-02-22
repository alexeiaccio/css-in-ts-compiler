/**
 * Generate All - Run all generators in sequence
 */

console.log("Running all generators...\n");

// Sequential execution via dynamic imports
async function main() {
	await import("./generate-unified-data.ts");
	await import("./generate-types.ts");
	await import("./generate-functions.ts");

	console.log("\n✅ All generation complete!");
}

main().catch(console.error);
