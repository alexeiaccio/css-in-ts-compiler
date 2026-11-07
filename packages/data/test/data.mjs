// @cssints/data through the engine: the rig lands once for two calls, no class is printed, the three statistics and the
// counter are there, and an unknown `data-data` matches no rig rule. Run: node test/data.mjs
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

const once = (needle) => css.split(needle).length - 1;
// two calls of a member that prints globals: each rule once
const rules = [
  "[data-data] { display: inline-grid; grid-template-columns: auto; width: max-content; overflow: clip }",
  "[data-data] > ul { margin: 0; padding: 0; list-style: none; height: 0 }",
  '[data-data="max"] > ul { display: grid }',
  '[data-data="max"] > ul > li { width: calc(var(--value) * 1px); height: 0 }',
  '[data-data="sum"] > ul { display: flex; width: max-content }',
  '[data-data="sum"] > ul > li { flex: none; width: calc(var(--value) * 1px); height: 0 }',
  '[data-data="count"] > ul { display: flex; width: max-content }',
  '[data-data="count"] > ul > li { width: 1px; height: 0 }',
  "[data-read] { display: block; container-type: inline-size }",
  "[data-read] > * { --data-result: round(100cqw / 1px) }",
  '[data-data="max"] [data-read] output::after, [data-data="sum"] [data-read] output::after, [data-data="count"] [data-read] output::after { counter-reset: out var(--data-result); content: counter(out) }',
];
for (const rule of rules) assert.equal(once(rule), 1, `${rule}\n${css}`);

// the counter and the custom property it reads
assert.equal(once("--data-result"), 2, css);
assert.equal(once("counter-reset: out var(--data-result)"), 1, css);
assert.equal(once("content: counter(out)"), 1, css);
// the counter matches the three statistics only, so an unknown `data-data` prints nothing
assert.equal(
  css.match(/\[data-data="(max|sum|count)"\] \[data-read\] output::after/g)?.length,
  3,
  css,
);

// only the three names: a statistic the rig does not know matches no rule
assert.ok(!css.includes('[data-data="median"]'), css);
assert.ok(!css.includes("[data-data] > ul > li"), css);

// no class: the call leaves no marker and no runtime import
assert.ok(!transformed.includes("@cssints/data"), transformed);
assert.ok(!transformed.includes("_data"), transformed);
assert.ok(!/\._data/.test(css), css);

await server.close();
console.log("data ok");
process.exit(0);
