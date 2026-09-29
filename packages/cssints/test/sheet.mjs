// The global sheet: sort order, one rule per class across modules, dev invalidation, and the demo build's one
// CSS file. Run: node sheet.mjs
import assert from "node:assert/strict";

import { Effect } from "effect";
import { build, createServer } from "vite";

import cssints, { renderSheet } from "../src/plugin.ts";

const SHEET = "\0virtual:cssints.css";
const LAYERS = ["_.a", "_.b", "_.c", "_.d", "_.e"];

// Shorthand first by leaf inclusion: border reaches border-top's leaves only through border-width/-style/-color.
globalThis.__cssints ??= { sites: new Map(), rules: new Map(), warnings: [], warned: new Set() };
const fake = { _1: "border-top", _2: "border", _3: "padding-left", _4: "padding", _5: "all" };
for (const [c, prop] of Object.entries(fake))
  globalThis.__cssints.rules.set(c, { layer: "_.a", cond: [], prop, css: `.${c}{${prop}:x}` });
const order = [...Effect.runSync(renderSheet(Object.keys(fake))).matchAll(/\.(_\d)\{/g)].map(
  (m) => fake[m[1]],
);
assert.deepEqual(order, ["border", "padding", "border-top", "padding-left", "all"]);
for (const c in fake) globalThis.__cssints.rules.delete(c);

// Dev: two modules with the same rule give it once; a module with a new rule invalidates the served sheet.
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins: [cssints()],
});
const client = server.environments.client;
const served = async () =>
  JSON.parse((await client.transformRequest(SHEET)).code.match(/const __vite__css = (".*")/)[1]);
await client.transformRequest("/fixtures/dedupe-a.ts");
await client.transformRequest("/fixtures/dedupe-b.ts");
let css = await served();
assert.equal(css.match(/padding:1rem/g)?.length, 1, css);
assert.ok(css.startsWith("@layer _.a, _.b, _.c, _.d, _.e;"), css);
await client.transformRequest("/fixtures/order.ts");
assert.equal(client.moduleGraph.getModuleById(SHEET).transformResult, null);
css = await served();
assert.ok(css.indexOf("padding:1rem") < css.indexOf("padding-left:"), css);
await server.close();

// Build: the demo emits one CSS file, the layer order first, the placeholder filled.
const out = await build({
  root: `${import.meta.dirname}/../../../apps/demo`,
  logLevel: "warn",
  build: { write: false },
});
const assets = [out]
  .flat()
  .flatMap((o) => o.output)
  .filter((f) => f.fileName.endsWith(".css"));
assert.equal(assets.length, 1);
const demo = String(assets[0].source);
// LightningCSS folds the statement into the first block (@layer _.a{…}@layer _.b,…;): same order.
assert.ok(demo.startsWith("@layer "), demo);
assert.deepEqual(
  [...new Set([...demo.matchAll(/@layer ([^{;]+)/g)].flatMap((m) => m[1].split(",")))],
  LAYERS,
);
assert.ok(demo.includes("{padding:2rem}"), demo);
console.log(
  `sheet: order, dedupe, dev invalidation ok; demo ${assets[0].fileName} ${demo.length} bytes`,
);
process.exit(0);
