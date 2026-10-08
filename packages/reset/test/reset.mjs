// @cssints/reset through the engine: where the reset lands in the sheet (below every other style), the blocks the flags
// add, and that a call prints no class. Run: node test/reset.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("warn"),
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);

const transformed = await code("use.ts");
const css = sheet("use.ts");
console.log(css);

// The order: `reset` is declared before the engine's layers, so it ranks below `_.k` (global(), tokens), the class
// layers and `app`, which is declared after them.
assert.ok(
  css.startsWith("@layer reset;\n@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer app;\n"),
  css,
);
assert.match(css, /^@layer _\.k \{\n {2}body\{margin:1rem\}\n\}$/m);
assert.equal(css.match(/^@layer reset \{$/gm).length, 3, "base once (two calls), media, prose");
assert.ok(!css.includes("  @layer reset"), "not nested in _.k");

assert.ok(css.includes("*, *::before, *::after { box-sizing: border-box } * { margin: 0 }"), css);
assert.ok(css.includes(":where(img, picture, video, canvas, svg) { display: block;"), css);
assert.ok(css.includes(":not([class]) { margin-block-start: 1em }"), css);

// without flags only the base
await code("base.ts");
const base = sheet("base.ts");
assert.equal(base.match(/^@layer reset \{$/gm).length, 1, base);
assert.ok(!base.includes("max-inline-size") && !base.includes(":not([class])"), base);

// a reset prints no class and leaves no runtime import
assert.ok(!transformed.includes("@cssints/reset"), `no runtime import\n${transformed}`);

await server.close();
console.log("reset: ok");
process.exit(0);
