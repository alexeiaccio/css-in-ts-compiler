// The global sheet: sort order, one rule per class across modules, dev invalidation, and the demo build's one
// CSS file. Run: node sheet.mjs
import assert from "node:assert/strict";

import { Cause, Effect, Exit } from "effect";
import { build, createServer } from "vite";

import cssints, { addGlobal, addLayers, globalEntries, renderSheet } from "../src/plugin.ts";
import { forgetKernels } from "../src/registry.ts";

const SHEET = "\0virtual:cssints.css";
const LAYERS = ["_.k", "_.a", "_.b", "_.c", "_.d", "_.e"];

// Shorthand first by leaf count, from Chrome's expansion (css-grammar longhands.ts): all sets every longhand, so it is
// first; border reaches border-top's leaves only through border-width/-style/-color.
const fake = { _1: "border-top", _2: "border", _3: "padding-left", _4: "padding", _5: "all" };
for (const [c, prop] of Object.entries(fake))
  globalThis.__cssints.rules.set(c, {
    layer: "_.a",
    cond: [],
    wrap: [],
    prop,
    css: `.${c}{${prop}:x}`,
  });
const order = [...Effect.runSync(renderSheet(Object.keys(fake))).matchAll(/\.(_\d)\{/g)].map(
  (m) => fake[m[1]],
);
assert.deepEqual(order, ["all", "border", "padding", "border-top", "padding-left"]);
assert.ok(
  !Effect.runSync(renderSheet(Object.keys(fake))).includes("_.k {"),
  "no globals, no _.k block",
);
// A global rule lands in layer _.k, below _.a. It is the content that identifies it: the same rule from two modules is
// one, another rule is another, and a module's sheet has the rules of that module.
const state = globalThis.__cssints;
const at = (file) => ({ file, site: 0, offset: 0 });
const render = (...files) =>
  Effect.runSync(
    renderSheet([...Object.keys(fake), ...files.flatMap((f) => globalEntries(state, f))]),
  );
Effect.runSync(addGlobal({ css: "*{box-sizing:border-box}" }, at("a.ts")));
Effect.runSync(addGlobal({ css: "*{box-sizing:border-box}" }, at("b.ts")));
Effect.runSync(addGlobal({ css: "*{box-sizing:content-box}" }, at("b.ts")));
const withGlobal = render("a.ts");
assert.equal(withGlobal.match(/box-sizing/g).length, 1, withGlobal);
assert.ok(
  withGlobal.includes("@layer _.k {\n  *{box-sizing:border-box}\n}\n@layer _.a {"),
  withGlobal,
);
assert.equal(render("a.ts", "b.ts").match(/box-sizing/g).length, 2);
assert.ok(!render("c.ts").includes("box-sizing"), "no module, no rule");
// What a module held goes when it runs again; a rule another module holds stays.
forgetKernels("a.ts");
assert.equal(render("a.ts").match(/box-sizing/g), null);
assert.equal(state.globals.size, 2);
forgetKernels("b.ts");
assert.equal(state.globals.size, 0);
// A layered global (a look) goes to a top-level layer, after _.k, and the layer must be declared: the sheet prints
// the statement once, after the engine's layers.
const layered = { css: '[data-mode="dark"]{--color-bg:#000}', layer: "app" };
const outcome = (program) => {
  const exit = Effect.runSyncExit(program);
  return Exit.isFailure(exit) ? Cause.squash(exit.cause).message : "ok";
};
assert.match(outcome(addGlobal(layered, at("a.ts"))), /the layer "app" is not declared/);
Effect.runSync(addLayers({ names: ["app", "author", "viewer"] }, at("a.ts")));
Effect.runSync(addLayers({ names: ["app", "author", "viewer"] }, at("b.ts")));
Effect.runSync(addGlobal(layered, at("a.ts")));
const withLayers = render("a.ts", "b.ts");
assert.ok(
  withLayers.startsWith("@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer app, author, viewer;\n") &&
    withLayers.includes('@layer app {\n  [data-mode="dark"]{--color-bg:#000}\n}\n'),
  withLayers,
);
assert.equal(withLayers.match(/@layer app, author/g).length, 1, "once");
// A statement inside another is fine (same order), another order or a partial overlap is an error at the call
for (const [names, message] of [
  [["author"], /^ok$/],
  [["viewer", "app"], /in another order than layers\(app, author, viewer\)/],
  [["viewer", "base"], /share layers, and neither holds the other/],
  [["app", "app"], /each once/],
  [["a b"], /takes names of layers/],
])
  assert.match(outcome(addLayers({ names }, at("a.ts"))), message, names.join());
// Layers declared before the engine's: their statements come first, so the engine's classes beat what is in them; a
// layer declared both before and after is an error at the call, either way round.
Effect.runSync(addLayers({ names: ["reset"], before: true }, at("b.ts")));
Effect.runSync(addLayers({ names: ["reset", "base"], before: true }, at("b.ts")));
Effect.runSync(addGlobal({ css: "*{margin:0}", layer: "reset" }, at("b.ts")));
const below = render("a.ts", "b.ts");
assert.ok(
  below.startsWith(
    "@layer reset, base;\n@layer reset;\n@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer app, author, viewer;\n",
  ) && below.includes("@layer reset {\n  *{margin:0}\n}\n"),
  below,
);
assert.match(
  outcome(addLayers({ names: ["reset"] }, at("a.ts"))),
  /layers\(reset\) declares reset after the engine's layers, and layers\(reset\) before/,
);
assert.match(
  outcome(addLayers({ names: ["viewer"], before: true }, at("a.ts"))),
  /declares viewer before the engine's layers, and layers\(app, author, viewer\) after/,
);
forgetKernels("a.ts");
forgetKernels("b.ts");
assert.equal(state.layers.size, 0);
for (const c in fake) state.rules.delete(c);

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
assert.ok(css.startsWith("@layer _.k, _.a, _.b, _.c, _.d, _.e;"), css);
await client.transformRequest("/fixtures/order.ts");
assert.equal(client.moduleGraph.getModuleById(SHEET).transformResult, null);
css = await served();
assert.ok(css.indexOf("padding:1rem") < css.indexOf("padding-left:"), css);
await server.close();

// Build: the demo emits one CSS file, the layer order first, the placeholder filled.
// The working directory is the project, as in a user's build: icons() reads @iconify-json/* from it.
const cwd = process.cwd();
process.chdir(`${import.meta.dirname}/../../../apps/demo`);
const out = await build({
  root: process.cwd(),
  logLevel: "warn",
  build: { write: false },
});
process.chdir(cwd);
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
  [...LAYERS, "app", "author", "viewer"], // the demo's look (@cssints/mise-en-mode) declares its sources
);
assert.ok(demo.includes("{padding:2rem}"), demo);
assert.ok(demo.includes("{width:calc(100% - 2rem)}"), demo); // a math function survives the build
console.log(
  `sheet: order, dedupe, dev invalidation ok; demo ${assets[0].fileName} ${demo.length} bytes`,
);
process.exit(0);
