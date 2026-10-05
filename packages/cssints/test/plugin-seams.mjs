// The seams a plugin stands on besides kernels (seams.mjs): global rules by content and forgotten with their files,
// declared top-level layers, the `layer` and `scope` of a theme, a member that emits themes, and a contrast check over
// layered themes. Run: node plugin-seams.mjs
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

// Modern targets: this test is about structure, not support warnings.
process.env.BROWSERSLIST = "chrome 130, firefox 130, safari 18";
const { createLogger, createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("error"),
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const sheet = (...files) => plugins[0].api.sheet(files.map((f) => `${root}/fixtures/${f}`));
const load = (f) => client.transformRequest(`/fixtures/${f}`);
const failure = async (f) => {
  try {
    await load(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};
const flat = (css) => css.replace(/\s+/g, " ");

// Globals: by content, in the sheet of the modules that carry them, forgotten with them (HMR).
const tmp = mkdtempSync(join(root, ".tmp-seams-"));
const file = join(tmp, "look.ts");
const SHEET = "\0virtual:cssints.css";
const served = async () =>
  JSON.parse((await client.transformRequest(SHEET)).code.match(/const __vite__css = (".*")/)[1]);
const write = (text) =>
  writeFileSync(
    file,
    `import { look } from "cssints/mise-en-mode" with { type: "cssints" };\n${text}\n`,
  );
const edit = async (text) => {
  write(text);
  server.watcher.emit("change", file);
  await sleep(300);
  await client.transformRequest(`/${tmp.split("/").pop()}/look.ts`);
  return served();
};
let css;
try {
  css = await edit(`export const dark = look("dark", "app", { "--color-bg": "#000" });`);
  assert.match(css, /--color-bg: #000 /);
  assert.ok(css.includes("@layer app, author, viewer;"), css);
  // before: a look was keyed without its values, so the first one stayed whatever the file said next
  css = await edit(`export const dark = look("dark", "app", { "--color-bg": "#111" });`);
  assert.match(css, /--color-bg: #111 /);
  assert.equal(css.match(/--color-bg:/g).length, 1, css);
  css = await edit(`export const y = 1;`);
  assert.ok(!css.includes("--color-bg") && !css.includes("data-mode"), css);
  assert.ok(!css.includes("@layer app"), "the layers of a file that has none left go with it");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// layers(): printed once, after the engine's, whoever declares them; a theme's layer and scope in the rule
await load("layers-theme.ts");
await load("layers-again.ts");
await load("seam-plain.ts");
css = sheet("layers-theme.ts", "layers-again.ts");
assert.ok(
  css.startsWith("@layer _.k, _.a, _.b, _.c, _.d, _.e;\n@layer app, author, viewer;\n"),
  css,
);
assert.equal(css.match(/@layer app, author, viewer;/g).length, 1, "once");
assert.ok(flat(css).includes('@layer viewer { [data-mode="dark"]{--lay-bg:#000000} }'), css);
assert.ok(
  flat(css).includes(
    '@layer author { @scope (article.post){[data-mode="hero"]{--lay-bg:#123456}} }',
  ),
  css,
);
// a sheet without them is what it was
assert.ok(!sheet("seam-plain.ts").includes("@layer app"));

// errors at the call: an undeclared layer, another order, a scope that is no selector or goes with a condition
const at = (e) => ({ line: e.loc.line, column: e.loc.column });
let e = await failure("layers-undeclared.ts");
assert.match(e.message, /the layer "nope" is not declared: call layers\("nope", \.\.\.\)/);
assert.deepEqual(at(e), { line: 4, column: 0 });
e = await failure("layers-order.ts");
assert.match(
  e.message,
  /layers\(second, first\) names layers in another order than layers\(first, second\)/,
);
assert.deepEqual(at(e), { line: 4, column: 0 });
e = await failure("theme-scope-bad.ts");
assert.match(e.message, /^cssints: createGlobalTheme\(\): scope: /);
assert.deepEqual(at(e), { line: 4, column: 0 });
e = await failure("theme-scope-condition.ts");
assert.match(e.message, /a scope goes with a selector, not a condition/);

// A member emits themes: the path of createGlobalTheme (the alias is declared again), in its layer, once per module
await load("member-theme-use.ts");
css = sheet("member-theme-use.ts");
assert.ok(css.includes("@layer app, viewer;"), css);
assert.ok(
  flat(css).includes(
    '@layer viewer { [data-mode="dark"]{--mem-bg:#000000;--mem-edge:color-mix(in oklab, var(--mem-bg), black 10%)} }',
  ),
  css,
);
assert.ok(css.includes('[data-mode="night"]{--mem-bg:#000000'), css);
e = await failure("member-theme-bad.ts");
assert.match(e.message, /^cssints: createGlobalTheme\(\): mem\.bg value "blu" is not a <color>$/);
assert.deepEqual(at(e), { line: 3, column: 17 });

// check.contrast reads the themes of one selector together, in layer order: the viewer's text colour alone is checked
// on the app's background
e = await failure("themes-contrast-layers-fail.ts");
assert.equal(
  e.message,
  "cssints: contrast 1.18 is below 4.5: cly.fg #222222 on cly.bg #111111, in theme .look",
);
await load("themes-contrast-layers-pass.ts");

await server.close();
console.log(
  "plugin seams: globals, layers, theme layer and scope, member themes, layered contrast ok",
);
process.exit(0);
