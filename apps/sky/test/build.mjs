// The build check, as the demo's in packages/cssints/test/sheet.mjs: one CSS file with the layer order first, the
// classes Solid compiled into its template, and none of the engine in the JavaScript.
// The working directory is the project, as in a user's build: icons() reads @iconify-json/* from it.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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

// the post card (src/post): the card's own width through container(), concentric radii through frame(), tonal steps through
// surface(); the only radius written for the card is its own, the quote and the media inside get theirs from the kernel
assert.match(sheet, /@container post \(width ?>= ?28rem\)\{[^@]*grid-column:2/); // avatar beside the text when wide
assert.match(sheet, /@container post \(width ?>= ?28rem\)\{[^@]*grid-template-columns:repeat\(3/); // media columns
assert.match(sheet, /@container post \(width ?>= ?28rem\)\{[^@]*--fr-p:\.75rem/); // a wide card pads more, the quote follows
assert.match(sheet, /\._\w+\{--fr-r:var\(--radius-xl\)\}/); // the card's radius
assert.match(sheet, /@container style\(--fr-c: ?e\)/); // the frame kernel
assert.match(sheet, /\._\w+\{--sf-d:\.04\}/); // surface().lighten(0.04): the card above the feed
assert.match(sheet, /\._\w+\{--sf-d:calc\(\.03 \* clamp\(/); // surface().contrast(0.03): the quote away from the card
assert.match(sheet, /@container style\(--sf-p: ?e\)/); // the surface kernel
const embeds = readFileSync("src/post/Embed.tsx", "utf8");
assert.ok(
  !embeds.includes(".radius("),
  "no frame of the quote or the media has a radius of its own",
);
assert.equal(embeds.match(/borderRadius\(/g).length, 1, "only the play mark's disc");

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
const all = files
  .filter((f) => f.fileName.endsWith(".js"))
  .map((f) => f.code)
  .join("");
assert.match(all, /class="_f _s _\w+( _\w+)*"/, "the card's classes are in Solid's template");
assert.ok(!all.includes("quoteDetached"), "the dev page and its recorded posts are not in a build");
console.log(
  `sky build: ${css[0].fileName} ${sheet.length} bytes, ${js.fileName} ${js.code.length} bytes`,
);
process.exit(0);
