/**
 * Run Quint's own typechecker over every spec in `specs/`.
 *
 *     bun run typecheck:quint
 *
 * Our generator (@quint-machine/core) is deliberately more permissive
 * than Quint: it implements checks for the two classes we hit (built-in-name
 * shadowing and ill-typed `step` unions) but does not run the full analyzer.
 * This runs the real oracle, so a spec that Quint would reject can never merge.
 */
import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const specs = existsSync("specs")
  ? readdirSync("specs", { recursive: true, encoding: "utf8" })
      .filter((entry) => entry.endsWith(".qnt"))
      .map((entry) => `specs/${entry.replaceAll("\\", "/")}`)
      .sort()
  : [];

const failed: string[] = [];

for (const spec of specs) {
  const result = spawnSync("quint", ["typecheck", spec], {
    stdio: "inherit",
  });
  if (result.status !== 0) failed.push(spec);
}

if (failed.length > 0) {
  throw new Error(`quint typecheck failed for ${failed.length} spec(s): ${failed.join(", ")}`);
}
console.log(`quint typecheck: ${specs.length} spec(s) clean`);
