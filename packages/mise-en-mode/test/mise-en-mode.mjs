// @cssints/mise-en-mode through the engine: the Mode Contract cases (layers, fragments, containment, fill-through), the
// checks against the token set, and check.contrast over looks. Run: node test/mise-en-mode.mjs
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

const transformed = await code("use.ts");
const css = sheet("use.ts");
const out = flat(css);
console.log(css);

// Rule 5: the sources are declared layers, once, after the engine's, so a look ranks above its `:root` fallbacks
assert.ok(
  css.startsWith("@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer app, author, viewer;\n"),
  `layer order\n${css}`,
);
assert.equal(css.match(/@layer app, author, viewer;/g).length, 1);

// Rule 4: each aspect (a top-level token group) matches the bare marker or its `expression/aspect` fragment
const arms = (e, aspect) => `:where([data-mode="${e}"], [data-mode~="${e}/${aspect}"])`;
assert.ok(
  out.includes(`@layer app { ${arms("dark", "color")}{--color-bg:#0b0b0f;--color-fg:#f3f4f6`),
  css,
);
assert.ok(out.includes(`@layer app { ${arms("dark", "typography")}{--typography-size:24px}`), css);
// fill-through: a viewer look that sets one variable is its own rule in a higher layer; the rest comes from the app's
assert.ok(out.includes(`@layer viewer { ${arms("dark", "color")}{--color-bg:#101018`), css);
// an alias that depends on an override is declared again with it, on that scope
assert.ok(out.includes("--color-edge:color-mix(in oklab, var(--color-bg), black 10%)"), css);
// exact record-key matching: a dotted reverse-DNS expression, quoted at the call
assert.ok(
  out.includes(`@layer author { ${arms("com.alice.midnight", "color")}{--color-bg:#0a0a12`),
  css,
);
// a reference to another token
assert.ok(out.includes(`@layer app { ${arms("refs", "color")}{--color-fg:var(--color-bg)}`), css);

// Rule 7: a foreign look confined to its content subtree
assert.ok(
  out.includes(`@layer author { @scope (article.post){${arms("hero", "color")}{--color-bg:#123456`),
  css,
);

// a look prints no class and leaves no runtime import
assert.ok(!transformed.includes("mise-en-mode"), `no runtime import\n${transformed}`);

// the overrides are checked against the token set at build time, and the expression against its grammar
let e = await failure("bad-value.ts");
assert.match(e.message, /^cssints: createGlobalTheme\(\): color\.bg value "blu" is not a <color>$/);
assert.deepEqual({ line: e.loc?.line, column: e.loc?.column }, { line: 5, column: 17 });
e = await failure("bad-expression.ts");
assert.match(e.message.split("\n")[0], /^look\(2\): unexpected "mode" in "dark mode"/);

e = await failure("bad-scope.ts");
assert.match(
  e.message.split("\n")[0],
  /^cssints: look\(5\)\.scope: selector: unexpected end in "article >"/,
);
assert.equal(e.loc?.line, 5);

// check.contrast sees looks: a viewer look with poor contrast on the app look's background fails the build
e = await failure("contrast-fail.ts");
assert.equal(
  e.message,
  'cssints: contrast 1.18 is below 4.5: cly.fg #222222 on cly.bg #111111, in theme :where([data-mode="dark"], [data-mode~="dark/cly"])',
);
await code("contrast-pass.ts");

await server.close();
console.log("mise-en-mode: ok");
process.exit(0);
