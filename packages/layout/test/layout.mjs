// @cssints/layout through the engine: the kernels and method classes of each primitive, derived conflicts with the
// container's properties, and the grammar of the methods at build time. Run: node test/layout.mjs
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
const flat = (css) => css.replace(/\s+/g, " ").trim();
const failure = async (f) => {
  try {
    await code(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};
const classes = (name) => transformed.match(new RegExp(`const ${name} = "([^"]*)"`))[1].split(" ");
const rule = (cls) => out.match(new RegExp(`\\.${cls}\\{([^}]*)\\}`))?.[1];

const transformed = await code("use.ts");
const css = sheet("use.ts");
const out = flat(css);
console.log(css);

// a call is the two kernel classes, each method one class more
assert.deepEqual(classes("plain"), ["_layout-stack-core", "_layout-stack-base"]);
assert.equal(classes("toolbar").length, 5);
assert.ok(!transformed.includes("@cssints/layout"), `no runtime import\n${transformed}`);

// the kernels, in _.k: the container's properties read the custom properties, whose defaults the base sets
const kernels = [
  "._layout-stack-base { --layout-stack-gap: 1rem; }",
  "._layout-stack-core{gap:var(--layout-stack-gap);display:flex;flex-direction:column}",
  "._layout-cluster-core{gap:var(--layout-cluster-gap);display:flex;flex-wrap:wrap;justify-content:var(--layout-cluster-justify);align-items:var(--layout-cluster-align)}",
  "._layout-sidebar-base > :first-child { flex: var(--layout-sidebar-ff); min-inline-size: var(--layout-sidebar-fm); }",
  "._layout-sidebar-base > :last-child { flex: var(--layout-sidebar-lf); min-inline-size: var(--layout-sidebar-lm); }",
  "--layout-sidebar-ff: 1 1 var(--layout-sidebar-width); --layout-sidebar-fm: auto; --layout-sidebar-lf: 999 1 0; --layout-sidebar-lm: var(--layout-sidebar-content);",
  "._layout-switcher-base > * { flex-grow: 1; flex-basis: calc((var(--layout-switcher-threshold) - 100%) * 999); }",
  "._layout-cover-core{gap:var(--layout-cover-gap);display:flex;flex-direction:column;justify-content:center;min-block-size:var(--layout-cover-min)}",
  "._layout-grid-core{gap:var(--layout-grid-gap);display:grid;grid-template-columns:repeat(auto-fit, minmax(min(var(--layout-grid-min), 100%), 1fr))}",
];
for (const k of kernels) assert.ok(out.includes(k), `${k}\n${css}`);
assert.ok(out.startsWith("@layer _.k, _.a, _.b, _.c, _.d, _.e;"), css);

// the methods: a number is a spacing step, a token its var(), side("right") swaps the children
const [, , pageGap] = classes("page");
assert.equal(rule(pageGap), "--layout-stack-gap:1rem");
assert.equal(rule(classes("toolbar")[2]), "--layout-cluster-gap:var(--space-md)");
assert.deepEqual(classes("aside").slice(2, 6).map(rule), [
  "--layout-sidebar-ff:999 1 0",
  "--layout-sidebar-fm:var(--layout-sidebar-content)",
  "--layout-sidebar-lf:1 1 var(--layout-sidebar-width)",
  "--layout-sidebar-lm:auto",
]);
assert.equal(rule(classes("buttons")[2]), "--layout-switcher-threshold:30rem");
assert.equal(rule(classes("hero")[2]), "--layout-cover-min:100dvh");
assert.equal(rule(classes("cards")[2]), "--layout-grid-min:16rem");
// a condition puts the method's class in _.b
assert.ok(
  out.includes("@layer _.b { @media (width >= 40rem) { ._1bkayo5{--layout-stack-gap:2rem}"),
  css,
);

// derived conflicts: a property a kernel sets, or one that meets it, in the same cn()
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: layout: kernel stack-core sets display, flex-direction, gap (this style also sets display)",
);
assert.deepEqual({ line: e.loc?.line, column: e.loc?.column }, { line: 4, column: 17 });
e = await failure("conflict-gap.ts");
assert.equal(
  e.message,
  "cssints: layout: kernel grid-core sets display, grid-template-columns, gap (this style also sets row-gap)",
);

// the grammar of the methods, and a method used once
e = await failure("bad-justify.ts");
assert.match(e.message, /^cluster\.justify: unexpected "between" in "between"/);
assert.equal(e.loc?.line, 4);
e = await failure("bad-content.ts");
assert.match(
  e.message,
  /^sidebar\.content: unexpected "120%" in "120%", expected <percentage \[0,100\]>/,
);
e = await failure("twice.ts");
assert.equal(e.message, "cssints: stack().gap() is used twice");

await server.close();
console.log("layout: ok");
process.exit(0);
