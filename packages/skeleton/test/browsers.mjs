// skeleton() in real browsers: the shimmer of skeletons mounted at different times is in phase, in Chrome, Firefox and
// WebKit (playwright-core from node_modules/.bun; Chrome is the installed channel, the others Playwright's builds).
// fixtures/app.ts is built once; this script mounts the boxes on an 800px-wide page:
//   A  600px wide, at load
//   B  300px wide, 700ms later, under A
//   C  the control, mounted with B: the same box with an animation of the clock on itself, so it starts when it mounts
//      (what every skeleton would do with an animation of its own); it must be out of phase, so the table can fail
// The animations are paused and moved by one delta, so the band is on the page and their relative phase is kept, then a
// row of each box is read from a screenshot: A and B match at every viewport x (one sweep across the page, `fixed`), C
// does not. With `prefers-reduced-motion: reduce` there is no animation and every box is the base colour.
//   node test/browsers.mjs          BROWSERS=firefox node test/browsers.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import cssints, { cssTarget, targets } from "cssints/vite";
import { build } from "vite";

const here = import.meta.dirname;
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
    rollupOptions: { input: join(here, "fixtures/app.ts") },
  },
});
const files = [out].flat().flatMap((o) => o.output);
const text = (ext) =>
  files
    .filter((f) => f.fileName.endsWith(ext))
    .map((f) => String(f.code ?? f.source))
    .join("\n");
const css = text(".css");
const js = text(".js");
assert.ok(css.includes(":root:has(._skeleton-clock)"), css);

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

const W = 300; // the columns read: the width of B
const rows = { a: 20, b: 80, c: 140 }; // the middle of each 40px box (tops at 0, 60, 120)

const read = async (browser, reducedMotion) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 200 },
    reducedMotion,
  });
  const page = await context.newPage();
  await page.setContent(
    `<!doctype html><style>body{margin:0;background:#fff}div{margin-bottom:20px}${css}</style><script type=module>${js}</script>`,
  );
  await page.waitForFunction(() => globalThis.skeletonClass);
  // A at load, B and the control 700ms later
  const mount = (boxes) =>
    page.evaluate((boxes) => {
      for (const [id, width, own] of boxes) {
        const d = document.createElement("div");
        d.id = id;
        d.className = globalThis.skeletonClass;
        d.style.width = `${width}px`;
        if (own) d.style.animation = "_skeleton-clock 1.5s ease-in-out infinite";
        document.body.append(d);
      }
    }, boxes);
  await mount([["a", 600]]);
  await sleep(700);
  await mount([
    ["b", 300],
    ["c", 300, true],
  ]);
  const state = await page.evaluate(() => {
    const all = document.getAnimations();
    for (const a of all) a.pause();
    const clock = all.find((a) => a.effect?.target === document.documentElement);
    // the band in the middle of the page: the clock at 0.75s, every animation moved by the same delta
    if (clock) {
      const delta = 750 - (Number(clock.currentTime) % 1500);
      for (const a of all) a.currentTime = Number(a.currentTime) + delta;
    }
    const p = (id) =>
      getComputedStyle(document.getElementById(id)).getPropertyValue("--skeleton-p");
    return {
      animations: all.map((a) =>
        a.effect?.target === document.documentElement ? "root" : a.effect?.target?.id,
      ),
      p: { a: p("a"), b: p("b"), c: p("c") },
    };
  });
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 800, height: 200 } });
  const px = await page.evaluate(
    async ([src, rows, w]) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const row = (y) => [...ctx.getImageData(0, y, w, 1).data].filter((_, i) => i % 4 === 0);
      return Object.fromEntries(Object.entries(rows).map(([k, y]) => [k, row(y)]));
    },
    [`data:image/png;base64,${png.toString("base64")}`, rows, W],
  );
  await context.close();
  return { ...state, px };
};

// how many of the columns differ by more than a rounding
const off = (x, y) => x.filter((v, i) => Math.abs(v - y[i]) > 8).length;
const failures = [];
for (const name of (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",")) {
  const browser = await launchers[name]();
  const moving = await read(browser, "no-preference");
  const { px } = moving;
  const band = Math.max(...px.a) - Math.min(...px.a);
  const ab = off(px.a, px.b);
  const ac = off(px.a, px.c);
  const line = `${name}: animations ${moving.animations.join(", ")}; --skeleton-p a ${moving.p.a}, b ${moving.p.b}, c ${moving.p.c}; band ${band}; A/B differ at ${ab} of ${W} columns, the control at ${ac}`;
  console.log(line);
  // one clock for A and B (the control's own animation besides), the band on the page, A and B one picture
  if (moving.animations.filter((a) => a === "root").length !== 1)
    failures.push(`${line}: not one clock`);
  if (moving.animations.some((a) => a === "a" || a === "b"))
    failures.push(`${line}: a box runs its own animation`);
  if (moving.p.a !== moving.p.b) failures.push(`${line}: A and B read different values`);
  if (band < 128) failures.push(`${line}: no band on the page`);
  if (ab > 2) failures.push(`${line}: A and B out of phase`);
  if (ac < 20) failures.push(`${line}: the control is in phase, the test cannot fail`);

  const still = await read(browser, "reduce");
  const flat = Object.entries(still.px).filter(([k, row]) => k !== "c" && row.some((v) => v > 8));
  const line2 = `${name} reduced motion: animations ${still.animations.join(", ") || "none"}; ${flat.length ? `not the base colour in ${flat.map(([k]) => k).join(", ")}` : "A and B the base colour"}`;
  console.log(line2);
  if (still.animations.some((a) => a !== "c") || flat.length) failures.push(line2);
  await browser.close();
}
assert.deepEqual(failures, []);
console.log("skeleton browsers ok");
process.exit(0);
