// What sublayers would cost on the demo: the layers declared and populated, and the minified bytes, against sheet.ts.
//   node measure.mjs
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_DEPTH, depth, lightningcss, pkg, repo, sheetOf, vite } from "./lib.mjs";

await import(pathToFileURL(join(pkg, "src/plugin.ts")).href);
process.chdir(join(repo, "apps/demo"));
const out = await vite.build({ root: process.cwd(), logLevel: "silent", build: { write: false } });
const asset = [out]
  .flat()
  .flatMap((o) => o.output)
  .find((f) => f.fileName.endsWith(".css"));
const rules = globalThis.__cssints.rules;
const minify = (css) =>
  lightningcss
    .transform({ filename: "s.css", code: Buffer.from(css), minify: true })
    .code.toString();

const populated = new Set([...rules.values()].map((r) => `${r.layer}.d${depth(r.prop)}`));
const plain = minify(sheetOf(rules, "mdn"));
const sub = minify(sheetOf(rules, "sublayers"));
const layerNames = (css) => new Set([...css.matchAll(/@layer ([^{;]+)\{/g)].map((m) => m[1]));
console.log({
  demoRules: rules.size,
  demoBuildBytes: String(asset.source).length,
  maxDepth: ALL_DEPTH - 1,
  sublayersDeclaredPerConditionLayer: ALL_DEPTH + 1,
  layersDeclaredWithSublayers: 1 + 5 * (ALL_DEPTH + 1),
  layersDeclaredToday: 6,
  populatedSublayers: populated.size,
  populated: [...populated].sort(),
  bytesSorted: plain.length,
  bytesSublayers: sub.length,
  layerBlocksSorted: layerNames(plain).size,
  layerBlocksSublayers: layerNames(sub).size,
});
process.exit(0);
