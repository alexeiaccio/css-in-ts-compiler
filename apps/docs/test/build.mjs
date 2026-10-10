// The build check: one sheet with the site's layers in order, the themes and the plugin kernels in it, none of the engine in the
// JavaScript, a chunk of html for each page, a document for each URL that holds the page's text (readable without JS), every URL
// under the base path (DOCS_BASE, "/" by default), and a type hover on every ts block that docs.mjs checks.
// The working directory is the project, as in a user's build: icons() reads @iconify-json/* from it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { build } from "vite";

import { compile } from "../plugin/landing.ts";

import { CUBES, DEFAULT_HUE, HUES, IDS, palettes } from "../src/palettes.ts";

process.chdir(`${import.meta.dirname}/..`);
const out = await build({ root: process.cwd(), logLevel: "warn", build: { write: false } });
const files = [out].flat().flatMap((o) => o.output);
const allCss = files.filter((f) => f.fileName.endsWith(".css"));
// the site's one sheet; the other files are the CSS of Monaco, which only /playground loads
const css = allCss.filter((f) => String(f.source).includes("@layer _.k"));
assert.equal(css.length, 1);
assert.ok(
  allCss.filter((f) => f !== css[0]).every((f) => String(f.source).includes(".monaco-")),
  "no other CSS than Monaco's",
);
const sheet = String(css[0].source);

// the stylesheet of the hovers is a layer of its own, declared before the engine's, so the site's rules win over it
assert.match(sheet, /^@layer twoslash/);
assert.ok(sheet.indexOf("@layer twoslash") < sheet.indexOf("@layer _.k"), "twoslash comes first");
assert.match(sheet, /\.twoslash \.twoslash-popup-container/);

// the themes: the system's dark is the media query, a class beats it; each mode points the colours at its group of pal
assert.match(
  sheet,
  /@media \(prefers-color-scheme: ?dark\)\{:root\{--color-bg:var\(--pal-dark-bg\)/,
);
assert.match(sheet, /:root\{--color-bg:var\(--pal-light-bg\)/);
for (const mode of ["light", "dark"])
  assert.ok(sheet.includes(`.${mode}{--color-bg:var(--pal-${mode}-bg)`), mode);
// dim is a theme of its own after dark, on the neutrals of its own
assert.ok(sheet.indexOf(".dark{--color-bg:") < sheet.indexOf(".dim{--color-bg:"), "dim after dark");
assert.match(
  sheet,
  /\.dim\{[^}]*--color-bg:var\(--pal-dim-bg\)[^}]*--color-accent:var\(--pal-dark-accent\)/,
);
// the palettes: the default is the values of pal (Itten's cube at its default hue), every palette is a theme of pal on a
// data attribute, a cube also has a theme per step of the wheel that sets its accents only, and no theme sets a mode's colour
const hex = (c) => c.replace(/^#(.)\1(.)\2(.)\3$/, "#$1$2$3");
const start = palettes.cssints(DEFAULT_HUE);
for (const [mode, k] of [
  ["light", "bg"],
  ["light", "accent"],
  ["dark", "bg"],
  ["dim", "bg"],
])
  assert.ok(
    sheet.includes(
      `@property --pal-${mode}-${k}{syntax:"<color>";inherits:true;initial-value:${hex(start[mode][k])}`,
    ),
    `${mode} ${k}`,
  );
for (const id of IDS) {
  const p = palettes[id](DEFAULT_HUE);
  // the minifier drops the quotes of an identifier, not of a number
  const theme = (palette, hue) => {
    const sel = `:where([data-palette=${palette}]${hue === undefined ? "" : `[data-hue="${hue}"]`}){`;
    const at = sheet.indexOf(sel);
    return at < 0 ? undefined : sheet.slice(at, sheet.indexOf("}", at));
  };
  const body = theme(id);
  assert.ok(body?.includes(`--pal-dim-bg:${hex(p.dim.bg)}`), `${id}: the palette's own theme`);
  assert.ok(body.includes(`--pal-dark-link:${hex(p.dark.link)}`), `${id}: dark link`);
  assert.equal(
    theme(id, 0) !== undefined,
    CUBES.includes(id),
    `${id}: a theme per hue only for a cube`,
  );
  if (CUBES.includes(id))
    for (let hue = 0; hue < HUES; hue++) {
      const h = theme(id, hue);
      const q = palettes[id](hue);
      assert.ok(h?.includes(`--pal-light-accent:${hex(q.light.accent)}`), `${id} ${hue} light`);
      assert.ok(h.includes(`--pal-dark-accent:${hex(q.dark.accent)}`), `${id} ${hue} dark`);
      assert.ok(!h.includes("-bg"), `${id} ${hue}: the accents only`);
    }
}
// text size, density and corners: a theme per value that is not normal, each setting one scale that fontSize, space and radius read
for (const [attr, value, scale, n] of [
  ["text", "small", "font", ".875"],
  ["text", "large", "font", "1.125"],
  ["density", "compact", "space", ".75"],
  ["density", "comfortable", "space", "1.25"],
  ["radius", "sharp", "radius", "0"],
  ["radius", "round", "radius", "2"],
])
  assert.match(sheet, new RegExp(`\\[data-${attr}=${value}\\]\\{--scale-${scale}:${n}[;}]`), value);
assert.match(sheet, /--font-size-md:calc\(16px \* var\(--scale-font\)\)/);
assert.match(sheet, /--space-lg:calc\(16px \* var\(--scale-space\)\)/);
assert.match(sheet, /--radius-md:calc\(10px \* var\(--scale-radius\)\)/);
// the font (no token type for a family): a global rule per stack
assert.match(sheet, /\[data-font=serif\] body\{font-family:Georgia/);
assert.match(sheet, /\[data-font=mono\] body\{font-family:"?SF Mono/);
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
// the search data names createTokens in prose (the tokens package page): look for the code, not the word
assert.ok(!/createTokens\(|css-grammar|toDecls/.test(entry.code), "no engine code in the client");
assert.ok(
  entry.code.length < 200_000,
  `the entry chunk holds no page (${entry.code.length} bytes)`,
);
assert.ok(!entry.code.includes("shiki-themes"), "the entry chunk holds no code block");

// the playground (src/playground/): the engine, the wasm, Monaco with its TypeScript worker and the page are lazy, the entry holds
// a route and a link
assert.ok(
  !/monaco|MonacoEnvironment|transformSync|binding-wasm32|lightningcss_node/.test(entry.code),
  "no playground code in the entry chunk",
);
// the TUI page (src/tui/): ghostty-web, @bomb.sh/tty, both their .wasm and sky's fixtures are lazy too
assert.ok(
  !/ghostty|createTerm|whats-hot|Ron Filipkowski/.test(entry.code),
  "no TUI code in the entry chunk",
);
const names = files.map((f) => f.fileName);
for (const part of [
  /^assets\/worker-.*\.js$/,
  /^assets\/ts\.worker-.*\.js$/,
  /^assets\/editor\.worker-.*\.js$/,
  /^assets\/Playground-.*\.js$/,
  /^assets\/parser\.wasm32-wasi-.*\.wasm$/,
  /^assets\/transform\.wasm32-wasi-.*\.wasm$/,
  /^assets\/lightningcss_node-.*\.wasm$/,
  /^assets\/Tui-.*\.js$/,
  /^assets\/ghostty-vt-.*\.wasm$/,
  /^assets\/bomb-tty-.*\.wasm$/,
])
  assert.ok(
    names.some((n) => part.test(n)),
    `the build holds ${part}`,
  );

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
// the stored settings are applied by an inline script before the first paint, in every document (test/settings.mjs runs it)
for (const [file, doc] of html)
  assert.ok(
    doc.indexOf("cssints-docs.settings") > 0 &&
      doc.indexOf("cssints-docs.settings") < doc.indexOf('type="module"'),
    `${file}: the settings script runs first`,
  );
assert.ok(js.length > slugs.length, "a chunk per page");

// the prerender: the title, the description and the article are in the document, the app's root is hidden until it takes over
const base = process.env.DOCS_BASE || "/";
const meta = (doc) => /name="description"\s+content="([^"]*)"/.exec(doc)[1];
const written = (slug, h1, text) => {
  const doc = html.get(slug ? `${slug}/index.html` : "index.html");
  const shown = /<div id="prerender">([\s\S]*)<\/div><div id="root" hidden><\/div>/.exec(doc)?.[1];
  assert.ok(shown, `${slug}: no prerendered page`);
  assert.ok(shown.startsWith(`<h1>${h1}</h1><div class="prose">`), `${slug}: h1`);
  assert.ok(shown.includes(text), `${slug}: ${text}`);
  return meta(doc);
};
assert.match(
  written("tokens", "Tokens", "A token is a Typed OM value whose"),
  /^A token is a Typed OM value/,
);
assert.match(written("install", "Install", "cssints needs Vite 8"), /^cssints needs Vite 8/);
assert.match(
  written("overview", "CSS-in-TS", "cssints is compile-time CSS-in-TypeScript"),
  /^cssints is compile-time/,
);
written(
  "frame-concentric-radius",
  "<code>frame()</code>: concentric radius",
  "twoslash-popup-container",
);
// the landing page (plugin/landing.ts): the document of "/" holds it, and its showcase is what the engine makes of
// src/landing/button.ts, compiled again here: the three panels read back from the html are the source, the module and the sheet
const homeDoc = html.get("index.html");
const landing = /<div id="prerender">(<div class="landing">[\s\S]*?)<nav aria-label="Pages">/.exec(
  homeDoc,
)?.[1];
assert.ok(landing?.includes("<h1>CSS in TypeScript"), "the landing page is in the document of /");
assert.ok(
  !entry.code.includes("What you write, what you get"),
  "the landing page is a chunk, not the entry",
);
const decode = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const panels = Object.fromEntries(
  [
    ...landing.matchAll(/<figure><figcaption>(.*?)<\/figcaption>(<pre[\s\S]*?<\/pre>)<\/figure>/g),
  ].map((m) => [m[1], decode(m[2])]),
);
const made = await compile();
assert.equal(panels["button.ts"], made.source.trim(), "the source panel is the file");
assert.equal(panels["The stylesheet"], made.css.trim(), "the sheet panel is the engine's output");
assert.equal(
  panels["The module in the bundle"],
  made.code.trim(),
  "the module panel is the engine's output",
);
assert.ok(made.css.includes("@layer _.a") && made.css.includes(":hover{"), "the sheet has rules");
for (const cls of panels["The module in the bundle"].match(/_[a-z0-9]{5,8}\b/g))
  assert.ok(panels["The stylesheet"].includes(`.${cls}`), `${cls} is in the sheet`);
assert.match(landing, /<pre class="error"><code>color: unexpected "rebeccapurpel"/, "a real error");
for (const href of ["install/", "playground/", "overview/"])
  assert.ok(landing.includes(`href="${base}${href}"`), `the landing page links to ${href}`);
// /playground is not a page of the docs: its document is the shell, whose root is not hidden, and a note for those without JS
const shell = html.get("playground/index.html");
assert.ok(
  shell.includes('<div id="root"></div>') && shell.includes("<noscript>"),
  "the playground document",
);
for (const app of ["playground", "tui"])
  assert.match(
    html.get(`${app}/index.html`),
    /<div id="root"><\/div><noscript>/,
    `the ${app} document`,
  );
for (const slug of slugs.filter((s) => s !== "playground" && s !== "tui")) {
  const doc = html.get(`${slug}/index.html`);
  assert.ok(
    doc.includes('<div id="prerender"><h1>') && doc.includes('<div id="root" hidden>'),
    slug,
  );
  assert.ok(doc.includes(`<a href="${base}${slug}/">`), `${slug}: the list of pages`);
}
assert.ok(!html.get("404.html").includes("prerender"), "the not-found document has no page");
// every URL in a document, the prerendered links included, is under the base path
for (const [file, doc] of html)
  for (const [, url] of doc.matchAll(/\b(?:href|src)="(\/[^"]*)"/g))
    assert.ok(url.startsWith(base), `${file}: ${url} is outside ${base}`);
assert.ok(html.get("index.html").includes(`src="${base}assets/index-`), "the entry script");

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
// the devtools (cssints({ devtools: "build" })): the entry holds the loader, the overlay is a chunk the page does not preload, the
// table is a JSON asset of the calls with paths relative to the project
const overlay = js.find((f) => f.isDynamicEntry && f.code.includes("data-cssints-probe"));
const table = files.find((f) => /^assets\/cssints-devtools-.*\.json$/.test(f.fileName));
assert.ok(overlay && table, "the overlay chunk and the table");
assert.ok(!entry.code.includes("data-cssints-probe") && entry.code.includes(table.fileName));
assert.ok(
  !String(html.get("index.html")).includes(overlay.fileName),
  "the overlay is not preloaded",
);
const calls = JSON.parse(String(table.source));
assert.equal(calls.root, "");
assert.ok(!String(table.source).includes(root), "no path of this machine in the table");
assert.ok(
  calls.sites.some((s) => /^src\/.+\.tsx?$/.test(s.file)),
  "files of the project",
);
assert.ok(
  calls.sites.every((s) => s.line > 0 && s.text.length),
  "a line and the call's text",
);
const popups = count(/twoslash-popup-container/g);
assert.ok(popups > 100, `${popups} popups`);

console.log(
  `docs build: devtools table ${table.source.length} bytes, overlay ${overlay.code.length} bytes (lazy); ${css[0].fileName} ${sheet.length} bytes, entry ${entry.code.length} bytes, ${slugs.length + 1} pages, ${checked} blocks with ${popups} hovers (${marked} errors shown), ${skipped} plain`,
);
process.exit(0);
