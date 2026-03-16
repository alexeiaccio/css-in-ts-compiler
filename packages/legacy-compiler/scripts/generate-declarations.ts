/**
 * Generate TypeScript declaration files
 */
import * as Bun from "bun";

const files = [
  "src/index.ts",
  "src/vite-plugin.ts",
  "src/oxc-plugin.ts",
];

console.log("Generating TypeScript declarations...");

for (const file of files) {
  const proc = Bun.spawn(["tsc", "--declaration", "--emitDeclarationOnly", "--outDir", "./dist", file], {
    stdio: ["inherit", "inherit", "inherit"],
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`Failed to generate declarations for ${file}`);
    process.exit(1);
  }
}

console.log("✅ Declarations generated successfully");
