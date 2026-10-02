// The build check, as the demo's in packages/cssints/test/sheet.mjs: one CSS file with the layer order first, the
// classes Solid compiled into its template, and none of the engine in the JavaScript.
// The working directory is the project, as in a user's build: icons() reads @iconify-json/* from it.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { build } from "vite";

process.chdir(`${import.meta.dirname}/..`);
const out = await build({ root: process.cwd(), logLevel: "warn", build: { write: false } });
const files = [out].flat().flatMap((o) => o.output);
const css = files.filter((f) => f.fileName.endsWith(".css"));
assert.equal(css.length, 1);
const sheet = String(css[0].source);
assert.ok(sheet.startsWith("@layer "), sheet);
assert.match(
  sheet,
  /@container column \(width ?< ?500px\)\{\._\w+\{padding-inline:var\(--gutter-compact\)/,
); // container()
assert.match(
  sheet,
  /@media \(width ?>= ?1300px\)\{[^@]*grid-template-columns:var\(--layout-left-nav-width\)/,
); // media()
assert.match(sheet, /\._\w+\{--fr-r:var\(--radius-lg\)\}/); // frame()
assert.match(sheet, /\._\w+\{--_svg:url\(/); // the icon

// the themes: the system's dark is the media query, a class beats it; the accent steps keep the hue (a reference in an override)
assert.match(sheet, /@media \(prefers-color-scheme: ?dark\)\{:root\{--color-bg:#000/);
for (const mode of [".light", ".dim", ".dark"])
  assert.ok(sheet.includes(`${mode}{--color-bg:`), mode);
assert.match(sheet, /\.dim\{[^}]*--color-accent-hover:oklch\(\.697 \.177 var\(--hue-accent\)\)/);
assert.ok(!sheet.includes("accent-tone"), "no accentTone workaround");
assert.match(sheet, /@media \(width ?>= ?800px\)\{:root\{--gutter-compact:12px;--gutter-base:20px/);

// Inter, self-hosted, with its licence
assert.match(sheet, /font-family:"?Inter Variable"?/);
assert.ok(existsSync("public/fonts/inter/OFL.txt"));
assert.ok(existsSync("public/fonts/inter/inter-latin-wght-normal.woff2"));

const js = files.find((f) => f.fileName.endsWith(".js"));
assert.match(js.code, /<main class="_\w+( _\w+)+">/, "Solid kept the classes in its template");
assert.match(js.code, /_cv\(\{/, "the cv() config is class strings");
assert.ok(!/createTokens|css-grammar|toDecls/.test(js.code), "no engine code in the client");
console.log(
  `sky build: ${css[0].fileName} ${sheet.length} bytes, ${js.fileName} ${js.code.length} bytes`,
);
process.exit(0);
