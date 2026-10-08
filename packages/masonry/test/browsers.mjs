// masonry() in Chrome, Firefox and WebKit (playwright-core from node_modules/.bun; Chrome is the installed channel, the
// others Playwright's builds). The fixture app is built for the default targets, which lack grid lanes, so its CSS has
// the kernel and the columns fallback. Items of different heights must pack with no gap between an item and the one
// above it in its lane:
//   native   the built CSS, in a browser that has `display: grid-lanes` (skipped where it does not)
//   columns  the built CSS with `grid-lanes` renamed, which no browser knows: the path of a browser without grid lanes
//   control  the same items in a plain grid with the same columns: rows leave gaps, so the check can fail
// Run: node test/browsers.mjs    BROWSERS=chrome,webkit node test/browsers.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import cssints, { cssTarget, targets } from "cssints/vite";
import { build } from "vite";

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium, firefox, webkit } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const launchers = {
  chrome: () => chromium.launch({ channel: "chrome" }),
  firefox: () => firefox.launch(),
  webkit: () => webkit.launch(),
};

const out = await build({
  root: join(here, "fixtures"),
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: {
    write: false,
    cssMinify: "lightningcss",
    cssTarget,
    rollupOptions: { input: join(here, "fixtures/main.js") },
  },
});
const files = [out].flat().flatMap((o) => o.output);
const css = String(files.find((f) => f.fileName.endsWith(".css")).source);
assert.match(css, /display:grid-lanes/, css);
assert.match(css, /@supports not \(display:grid-lanes\)/, css);
// the classes of `wall` in app.ts: 12rem columns, a gap of 1rem
const wall = /(_masonry-lanes(?: _\w+){2})/.exec(
  String(files.find((f) => f.fileName.endsWith(".js")).code),
)?.[1];
assert.ok(wall, "the classes of wall");

const heights = [80, 140, 60, 200, 100, 50, 170, 90, 120, 70, 150, 110];
const page = (style, cls) =>
  `<style>${style} body{margin:0} #m{width:640px;padding:0} #m>div{background:#ccc}</style>` +
  `<div id="m" class="${cls}">${heights.map((h) => `<div style="height:${h}px"></div>`).join("")}</div>`;

// The rects of the items; for each lane (items with the same left), the space between an item and the one above it.
const measure = (p) =>
  p.evaluate(() => {
    const m = document.querySelector("#m").getBoundingClientRect();
    const lanes = new Map();
    for (const el of document.querySelectorAll("#m > div")) {
      const r = el.getBoundingClientRect();
      const left = Math.round(r.left);
      lanes.set(left, [...(lanes.get(left) ?? []), r]);
    }
    const spaces = [];
    for (const rects of lanes.values()) {
      rects.sort((a, b) => a.top - b.top);
      spaces.push(Math.round(rects[0].top - m.top));
      for (let i = 1; i < rects.length; i++)
        spaces.push(Math.round(rects[i].top - rects[i - 1].bottom));
    }
    return { lanes: lanes.size, spaces };
  });
// 640px wide, columns of at least 12rem (192px) with a 16px gap: three lanes; every item sits 16px under the one above
const packed = ({ lanes, spaces }) =>
  lanes === 3 &&
  spaces.every((s) => s === 0 || s === 16) &&
  spaces.filter((s) => s === 0).length === 3;

const results = [];
for (const name of (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",")) {
  const browser = await launchers[name]();
  const p = await browser.newPage();
  const native = await p.evaluate(() => CSS.supports("display", "grid-lanes"));
  const run = async (style, cls = wall) => {
    await p.setContent(page(style, cls));
    return measure(p);
  };
  if (native) {
    const m = await run(css);
    assert.ok(packed(m), `${name} native: ${JSON.stringify(m)}`);
  }
  const columns = await run(css.replaceAll("grid-lanes", "grid-lanes-unknown"));
  assert.ok(packed(columns), `${name} columns: ${JSON.stringify(columns)}`);
  const control = await run(
    "#m{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:1rem}",
    "",
  );
  assert.ok(!packed(control), `${name} control packs: ${JSON.stringify(control)}`);
  results.push(
    `${name} ${browser.version()}: ${native ? "native and columns" : "columns (no grid lanes)"}`,
  );
  await browser.close();
}
console.log(results.join("\n"));
console.log("masonry browsers: ok");
process.exit(0);
