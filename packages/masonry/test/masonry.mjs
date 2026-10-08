// @cssints/masonry through the engine: the kernel and its method classes, the columns fallback for targets that lack grid
// lanes (and none for targets that have them), conflicts, the grammar of the methods, the grammar gap that makes the
// kernel raw CSS, and a build (LightningCSS keeps `display: grid-lanes`). Run: node test/masonry.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import cssints from "cssints/vite";
import { build, createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const mode = process.argv[2];
const warnings = [];
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);
const failure = async (f) => {
  try {
    await code(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

const transformed = await code("use.ts");
const css = sheet("use.ts").replace(/\s+/g, " ");
const kernel =
  "._masonry-lanes{--masonry-min:16rem;--masonry-gap:1rem;display:grid-lanes;grid-template-columns:repeat(auto-fill,minmax(min(var(--masonry-min),100%),1fr));gap:var(--masonry-gap)}";
const fallback =
  "@supports not (display:grid-lanes){._masonry-lanes{columns:var(--masonry-min)}._masonry-lanes>*{display:inline-block;inline-size:100%;vertical-align:top;break-inside:avoid;margin-block-end:var(--masonry-gap)}}";
// the fallback is a runtime of CSS only: it covers the kernel's requires for every target, so no warning
assert.ok(!warnings.some((w) => w.includes("grid-lanes")), warnings.join("\n"));
assert.ok(css.includes(kernel), css);

if (mode) {
  // native: every target has grid lanes, so the columns are not in the sheet
  assert.ok(!css.includes("@supports"), css);
  await server.close();
  console.log("masonry (native targets) ok");
  process.exit(0);
}
// the default targets (Chrome, Firefox) lack grid lanes
assert.ok(css.includes(fallback), css);

const classes = (name) => transformed.match(new RegExp(`const ${name} = "([^"]*)"`))[1].split(" ");
const rule = (cls) => css.match(new RegExp(`\\.${cls}\\{([^}]*)\\}`))?.[1];
assert.deepEqual(classes("plain"), ["_masonry-lanes"]);
const [, min, gap, padding] = classes("wall");
assert.deepEqual(
  [rule(min), rule(gap), rule(padding)],
  ["--masonry-min:12rem", "--masonry-gap:1rem", "padding:0.5rem"],
);
assert.equal(rule(classes("tokens")[1]), "--masonry-gap:var(--space-md)");
assert.match(css, /@layer _\.b \{ @media \(width >= 40rem\) \{ \._\w+\{--masonry-min:20rem\}/);

// conflicts: display, the grid columns, the gap and its longhands, the multi-column properties
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: masonry: masonry() sets display, the columns and the gap: use its methods (this style also sets display)",
);
assert.deepEqual({ line: e.loc?.line, column: e.loc?.column }, { line: 4, column: 17 });
e = await failure("conflict-gap.ts");
assert.match(e.message, /\(this style also sets row-gap\)$/);

// the grammar of the methods, and a method used once
e = await failure("bad-columns.ts");
assert.match(e.message, /^masonry\.columns: unexpected "50%" in "50%", expected <length>/);
e = await failure("twice.ts");
assert.equal(e.message, "cssints: masonry().gap() is used twice");

// engine gap: the grammar has no `display: grid-lanes`, which is why the kernel is raw CSS. When this passes, write the
// kernel as styles and drop the conflicts entry.
e = await failure("gap-display.ts");
assert.match(e.message, /^display: unexpected "grid-lanes" in "grid-lanes"/);
await server.close();

// a build: LightningCSS keeps the value it does not know
const out = await build({
  root,
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  build: { write: false, rollupOptions: { input: `${root}/main.js` } },
});
const built = String(
  [out]
    .flat()
    .flatMap((o) => o.output)
    .find((f) => f.fileName.endsWith(".css")).source,
);
assert.match(built, /display:grid-lanes/, built);
assert.match(built, /@supports not \(display:grid-lanes\)/, built);

// targets that all have grid lanes: another process, the targets are read once
console.log(
  execFileSync(process.execPath, [import.meta.filename, "native"], {
    env: { ...process.env, BROWSERSLIST: "safari 26.4, ios_saf 26.4" },
    encoding: "utf8",
  }).trim(),
);
console.log("masonry: ok");
process.exit(0);
