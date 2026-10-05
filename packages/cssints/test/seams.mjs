// The engine seams plugins stand on, through test-only scopes (fixtures/seam-kit.ts): the style node's markers and
// kernels, kernel collisions, and a definition site. Run: node seams.mjs
import assert from "node:assert/strict";

import { createLogger, createServer } from "vite";

import cssints from "../src/plugin.ts";
import { forget } from "../src/registry.ts";

const warnings = [];
const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const { kernels } = globalThis.__cssints;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;

// A style that prints a marker and needs a kernel; cn() merges them once; a function from a definition site
// (seam-defs.ts: `mdi = makeIcons({...})`) is called in a client module and that call is a replaced site.
const use = await code("seam-use.ts");
const [, m1] = /export const a = "(_box-core _\w+)"/.exec(use) ?? [];
assert.ok(m1, use);
assert.match(
  use,
  /export const b = "_box-core _\w+ _\w+";/,
  "cn(): the marker once, the declarations deduped",
);
assert.ok(
  use.includes(`export const c = "${m1}";`),
  "mdi('home') is a replaced site: box().width('2px')",
);
assert.match(use, /export const d = "_box-core _\w+";/);
assert.ok(!use.includes("makeIcons") && !use.includes("seam-"), "build-time imports are gone");
const css = sheet("seam-use.ts");
assert.equal(css.match(/\._box-core\{/g).length, 1, "a kernel is registered once, whoever uses it");
assert.ok(
  css.indexOf("@property --bx-w") > 0 &&
    css.indexOf("@property --bx-w") < css.indexOf("@layer _.k {"),
  "atProperty at the top, before the layers",
);
assert.ok(
  css.indexOf("._box-core{") < css.indexOf("@layer _.a {"),
  "the kernel css is in _.k, below _.a",
);
assert.ok(css.startsWith("@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@property --bx-w"), css);
// requires: a support warning naming the kernel and the feature, once, never an error
const needs = warnings.filter((w) => w.includes("kernel box.core needs "));
assert.equal(needs.length, 1, warnings.join("\n"));
assert.match(
  needs[0],
  /needs css\.at-rules\.container\.style_queries_for_custom_properties, not supported by /,
);
await code("seam-use.ts");
assert.equal(
  warnings.filter((w) => w.includes("kernel box.core needs ")).length,
  1,
  "once per build",
);

// A sheet with no kernel is what it was: no _.k block, no @property.
await code("seam-plain.ts");
assert.equal(
  sheet("seam-plain.ts"),
  "@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer _.a {\n  ._1t8gqy5{padding:0.5rem}\n}\n",
);

// Collisions are build errors at the call site. Each fixture holds both kernels in one cn(). (The same name with other content is the identity check of scope(), test/scope.mjs.)
const clash = async (f, text) => {
  kernels.clear();
  await assert.rejects(code(f), (e) => {
    assert.equal(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, 5, "the call site");
    assert.ok(e.id.endsWith(f));
    return true;
  });
};
await clash(
  "seam-clash-var.ts",
  "cssints: kernels box.core and ring.core both declare --bx-w: a plugin picks its own short custom-property names",
);
await clash(
  "seam-clash-marker.ts",
  "cssints: kernels chip.a-b and chip-a.b both print the marker _chip-a-b",
);
// across modules too: box.core is held by seam-use, the clash module brings the other key
kernels.clear();
client.moduleGraph.invalidateAll();
await code("seam-use.ts");
await assert.rejects(
  code("seam-clash-var.ts"),
  /kernels box.core and ring.core both declare --bx-w/,
);
// what a module held is forgotten when it runs again (its kernels, unless another module uses them)
const file = `${import.meta.dirname}/fixtures/seam-use.ts`;
assert.ok(kernels.get("box.core").users.has(file));
forget(file);
assert.ok(kernels.has("box.core"), "the clash module still holds it");
forget(`${import.meta.dirname}/fixtures/seam-clash-var.ts`);
assert.ok(!kernels.has("box.core"));

await server.close();
console.log("seams: markers, kernels, collisions, definition site ok");
process.exit(0);
