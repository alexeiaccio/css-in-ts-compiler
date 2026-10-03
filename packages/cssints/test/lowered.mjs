// A support warning is dropped for a value that LightningCSS lowers for the targets of the warning (src/lowered.ts):
// the output of `x{prop:value}` gains a declaration before the original, and that one no longer holds the feature.
// Run: node lowered.mjs
import assert from "node:assert/strict";
import { stripVTControlCharacters } from "node:util";

// The targets are read when the grammar package loads: set them first, so the imports come after.
process.env.BROWSERSLIST = "chrome 100, safari 15.2";
const { createLogger, createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const warnings = [];
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null },
  plugins: cssints(),
});
await server.environments.client.transformRequest("/fixtures/lowered.ts");

const lines = warnings.map((w) =>
  stripVTControlCharacters(w.split("\n")[0]).replace(/^.*warning: /, ""),
);
const both = "chrome 100, safari 15.2";
const rel = "oklch(from var(--lowered-brand) l c h)";
// i: an inline style never goes through LightningCSS. g: a var() inside is unknown to it, two features warn. h: it has
// no prefixed text-wrap to add. a to f, lowered or prefixed, give nothing.
assert.deepEqual(lines, [
  `color: "lab()" in "lab(40% 20 -50)" is not supported by chrome 100 (css.types.color.lab)`,
  `color: "oklch()" in "${rel}" is not supported by ${both} (css.types.color.oklch)`,
  `color: "from" in "${rel}" is not supported by ${both} (css.types.color.oklch.relative_syntax)`,
  `text-wrap: the property in "balance" is not supported by ${both} (css.properties.text-wrap)`,
]);

await server.close();
console.log("lowered: warnings dropped for what LightningCSS lowers, kept for what it leaves");
