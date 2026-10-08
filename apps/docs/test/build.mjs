// The build check: one sheet with the site's layers in order, the themes and the plugin kernels in it, none of the engine in the
// JavaScript, a chunk of html for each page, a document for each URL, and a type hover on every ts block that docs.mjs checks.
// The working directory is the project, as in a user's build: icons() reads @iconify-json/* from it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { build } from "vite";

process.chdir(`${import.meta.dirname}/..`);
const out = await build({ root: process.cwd(), logLevel: "warn", build: { write: false } });
const files = [out].flat().flatMap((o) => o.output);
const css = files.filter((f) => f.fileName.endsWith(".css"));
assert.equal(css.length, 1);
const sheet = String(css[0].source);

// the stylesheet of the hovers is a layer of its own, declared before the engine's, so the site's rules win over it
assert.match(sheet, /^@layer twoslash/);
assert.ok(sheet.indexOf("@layer twoslash") < sheet.indexOf("@layer _.k"), "twoslash comes first");
assert.match(sheet, /\.twoslash \.twoslash-popup-container/);

// the themes: the system's dark is the media query, a class beats it
assert.match(sheet, /@media \(prefers-color-scheme: ?dark\)\{:root\{--color-bg:#0c0f15/);
for (const mode of [".light", ".dark"]) assert.ok(sheet.includes(`${mode}{--color-bg:`), mode);
// the variables of the hovers read the site's colours
assert.match(sheet, /--twoslash-popup-bg:var\(--color-bg-subtle\)/);
// breakpoints: the sidebar at 900, the outline at 1200
assert.match(
  sheet,
  /@media \(width ?>= ?900px\)\{[^@]*grid-template-columns:var\(--layout-sidebar-width\)/,
);
assert.match(
  sheet,
  /@media \(width ?>= ?1200px\)\{[^@]*grid-template-columns:var\(--layout-sidebar-width\) minmax\(0, ?1fr\) var\(--layout-outline-width\)/,
);
// frame() and surface(): the cards and the search panel
assert.match(sheet, /@container style\(--frame-c: ?e\)/);
assert.match(sheet, /@container style\(--surface-p: ?e\)/);
assert.match(sheet, /\._\w+\{--frame-r:var\(--radius-lg\)\}/);
assert.match(sheet, /:hover\{--surface-d:calc\(\.0\d? \* clamp\(/); // surface().contrast
// the markdown is styled by global rules under .prose, in layer _.k, below the classes
assert.match(sheet, /\.prose>pre\{/);
assert.match(sheet, /\.prose h2\{[^}]*border-bottom/);
assert.match(sheet, /:root\.dark \[style\*=--shiki-light\]\{color:var\(--shiki-dark\)\}/);
assert.ok(sheet.indexOf(".prose>pre{") < sheet.indexOf("@layer _.a{"), "globals come first");
// the drawer: a variant of the sidebar, a transition that stops for reduced motion
assert.match(sheet, /@media \(prefers-reduced-motion: ?reduce\)\{[^@]*transition:none/);
assert.match(sheet, /\[aria-current=page\]\{/);

const js = files.filter((f) => f.fileName.endsWith(".js"));
const entry = js.find((f) => f.isEntry);
assert.ok(!/createTokens|css-grammar|toDecls/.test(entry.code), "no engine code in the client");
assert.ok(
  entry.code.length < 200_000,
  `the entry chunk holds no page (${entry.code.length} bytes)`,
);
assert.ok(!entry.code.includes("shiki-themes"), "the entry chunk holds no code block");

// a chunk of html per page, and a document per URL with the page's own title
const html = new Map(
  files
    .filter((f) => f.type === "asset" && f.fileName.endsWith(".html"))
    .map((f) => [f.fileName, String(f.source)]),
);
assert.ok(html.has("index.html") && html.has("404.html"));
const slugs = [...html.keys()].flatMap((f) => f.match(/^([^/]+)\/index\.html$/)?.[1] ?? []);
assert.ok(slugs.length >= 20, `${slugs.length} page documents`);
for (const slug of slugs) {
  const title = /<title>(.*?)<\/title>/.exec(html.get(`${slug}/index.html`))[1];
  assert.ok(title.endsWith(" · cssints") && title.length > 12, `${slug}: ${title}`);
}
assert.ok(html.get("index.html").includes("<title>cssints</title>"));
assert.ok(js.length > slugs.length, "a chunk per page");

// every ts and tsx block that docs.mjs checks has hovers; the blocks fenced `skip` have none; the lines that end in `// error` show
// their message, and no other line does (so the hover setup type-checks as docs.mjs does)
const root = join(import.meta.dirname, "../../..");
let checked = 0;
let skipped = 0;
let marked = 0;
for (const doc of ["docs/API.md", "README.md"]) {
  const text = readFileSync(join(root, doc), "utf8");
  for (const m of text.matchAll(/^```(tsx?)([^\n]*)\n([\s\S]*?)^```$/gm)) {
    if (m[2].trim() === "skip") skipped++;
    else {
      checked++;
      marked += m[3].split("\n").filter((l) => /\/\/ error\b/.test(l)).length;
    }
  }
}
const all = js.map((f) => f.code).join("");
const count = (re) => all.match(re)?.length ?? 0;
assert.equal(
  count(/shiki-themes github-light github-dark twoslash lsp/g),
  checked,
  "a hover on every checked block",
);
assert.equal(count(/shiki-themes github-light github-dark"/g) >= skipped, true);
assert.equal(count(/twoslash-error-line/g), marked, "an error line for each `// error`");
assert.ok(!all.includes(root), "no path of this machine in the pages");
const popups = count(/twoslash-popup-container/g);
assert.ok(popups > 100, `${popups} popups`);

console.log(
  `docs build: ${css[0].fileName} ${sheet.length} bytes, entry ${entry.code.length} bytes, ${slugs.length + 1} pages, ${checked} blocks with ${popups} hovers (${marked} errors shown), ${skipped} plain`,
);
process.exit(0);
