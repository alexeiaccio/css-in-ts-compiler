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

// The order: the engine's layers, then the declared ones; the reset is a layer nested in `_.k`, so it ranks below the
// rules of `_.k` (global(), tokens), the class layers and `app`.
assert.ok(css.startsWith("@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer app;\n"), css);
const k = css.slice(css.indexOf("@layer _.k {"));
assert.match(k, /^@layer _\.k \{\n {2}@layer reset \{ /);
assert.ok(k.indexOf("body{margin:1rem}") > 0, css);
assert.ok(k.indexOf("@layer app {") > k.indexOf("body{margin:1rem}"), css);
assert.ok(css.indexOf("@layer _.a {") > css.indexOf("@layer app {"), css);
assert.equal(css.match(/@layer reset/g).length, 3, "base once (two calls), media, prose");

assert.ok(css.includes("*, *::before, *::after { box-sizing: border-box } * { margin: 0 }"), css);
assert.ok(css.includes(":where(img, picture, video, canvas, svg) { display: block;"), css);
assert.ok(css.includes(":not([class]) { margin-block-start: 1em }"), css);

// without flags only the base
await code("base.ts");
const base = sheet("base.ts");
assert.equal(base.match(/@layer reset/g).length, 1, base);
assert.ok(!base.includes("max-inline-size") && !base.includes(":not([class])"), base);

// a reset prints no class and leaves no runtime import
assert.ok(!transformed.includes("@cssints/reset"), `no runtime import\n${transformed}`);

await server.close();
console.log("reset: ok");
process.exit(0);
