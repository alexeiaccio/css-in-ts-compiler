// meshGradient() in Chrome (the installed one, channel "chrome": it has no mesh-gradient()), through playwright-core from
// node_modules/.bun. The page is test/fixtures/page: a 3 x 3 mesh on a 1000 x 600 box, and a 2 x 2 mesh with a token colour.
// Steps:
//   first paint  the runtime's observers blinded: the background is the average colour (the kernel's fallback)
//   drawn        the runtime draws: the background is a blob URL; its pixels at 20 points equal the maths (grid.ts, on the
//                data the element carries), and a token resolved through a probe reads as the colour of --accent
//   resize       the box shrinks: a new blob at a quarter of the new size; the time is printed
//   added later  an element with the mesh class, added after the load, is drawn too
// Run: node test/browser.mjs (not in `test`: it needs Chrome)
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// no browser has mesh-gradient() yet, so the build ships the runtime
process.env.BROWSERSLIST = "chrome 110";
const { default: cssints } = await import("cssints/vite");
const { createServer } = await import("vite");
const { fromSpace, sample, toSpace } = await import("../src/grid.ts");

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const server = await createServer({
  root: join(here, "fixtures/page"),
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  server: { port: 0 },
});
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

// first paint: the runtime's observers blinded, so only the kernel's fallback shows
{
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  await page.addInitScript(() => {
    globalThis.ResizeObserver = class {
      observe() {}
    };
  });
  await page.goto(url);
  await page.waitForFunction(() =>
    document.getElementById("hero")?.className.includes("_gradient2d-core"),
  );
  const first = await page.evaluate(
    () => getComputedStyle(document.getElementById("hero")).backgroundImage,
  );
  assert.match(first, /^linear-gradient\(/, first);
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
await page.goto(url);

const bgOf = (id) =>
  page.evaluate((sel) => getComputedStyle(document.getElementById(sel)).backgroundImage, id);
const blobOf = (s) => /url\("(blob:[^"]+)"\)/.exec(s)?.[1];
const waitBlob = (id) =>
  page.waitForFunction(
    (sel) => getComputedStyle(document.getElementById(sel)).backgroundImage.includes("blob:"),
    id,
  );
// the image of a blob, its size and its pixels at the points, read back through a canvas
const readPixels = (u, pts) =>
  page.evaluate(
    async ({ u, pts }) => {
      const img = new Image();
      img.src = u;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return {
        w: img.naturalWidth,
        h: img.naturalHeight,
        px: pts.map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data]),
      };
    },
    { u, pts },
  );
// the data the element carries, read as the runtime reads it (JSON in a CSS string)
const dataOf = (id) =>
  page.evaluate((sel) => {
    const raw = getComputedStyle(document.getElementById(sel)).getPropertyValue(
      "--gradient2d-data",
    );
    return JSON.parse(JSON.parse(raw));
  }, id);

await waitBlob("hero");
await waitBlob("token");

// 20 points: the corners and 18 spread over the image
const points = (w, h) => [
  [0, 0],
  [w - 1, h - 1],
  ...Array.from({ length: 18 }, (_, i) => [(i * 397 + 13) % w, (i * 211 + 7) % h]),
];
// the blob of an element against the maths; `resolved` gives the colour of a token the browser resolves
const check = async (id, resolved = {}) => {
  const { space, rows } = await dataOf(id);
  const grid = rows.map((row) =>
    row.map((s) => toSpace(space, typeof s === "string" ? resolved[s] : s)),
  );
  const u = blobOf(await bgOf(id));
  const { w, h } = await readPixels(u, []);
  const pts = points(w, h);
  const { px } = await readPixels(u, pts);
  let worst = { d: 0, at: "" };
  pts.forEach(([x, y], i) => {
    // out of the gamut the canvas clamps to 0 or 255, as the runtime's bytes do
    const want = fromSpace(space, sample(grid, (x + 0.5) / w, (y + 0.5) / h)).map((c) =>
      Math.min(255, Math.max(0, c * 255)),
    );
    for (let k = 0; k < 4; k++) {
      const d = Math.abs(px[i][k] - want[k]);
      if (d > worst.d)
        worst = { d, at: `(${x}, ${y}) got ${px[i].join(" ")}, want ${want.map(Math.round).join(" ")}` };
    }
  });
  assert.ok(worst.d <= 3, `${id}: a pixel differs by ${worst.d.toFixed(1)}: ${worst.at}`);
  return { w, h, worst: worst.d };
};

const hero = await check("hero");
console.log(`hero: a ${hero.w} x ${hero.h} blob, worst channel difference ${hero.worst} of 255`);
const token = await check("token", { "var(--accent)": [0, 1, 0, 1] });
console.log(`token: var(--accent) read as #00ff00, worst difference ${token.worst} of 255`);

// resize: the box shrinks, and the runtime draws again at a quarter of the new size; toggled five times, the median
// the time is read in Node: from the width change to the new background, polled every frame by the page
const was = await bgOf("hero");
const toggles = [];
for (const width of ["800px", "1000px", "800px", "1000px", "800px", "1000px"]) {
  const before = await bgOf("hero");
  const t0 = performance.now();
  await page.evaluate((w) => {
    document.getElementById("hero").style.width = w;
  }, width);
  await page.waitForFunction(
    (b) => getComputedStyle(document.getElementById("hero")).backgroundImage !== b,
    before,
  );
  toggles.push(performance.now() - t0);
}
const { w, h } = await readPixels(blobOf(await bgOf("hero")), []);
assert.notEqual(blobOf(await bgOf("hero")), blobOf(was));
assert.equal(w, 250);
assert.equal(h, 150);
const median = [...toggles].sort((a, b) => a - b)[Math.floor(toggles.length / 2)];
console.log(
  `resize 800 <-> 1000 px (a ${w} x ${h} blob): median ${median.toFixed(1)} ms over ${toggles.length}`,
);

// an element added after the load, with the mesh class, is drawn too
await page.evaluate(() => {
  const el = document.createElement("div");
  el.id = "late";
  el.style.cssText = "width: 400px; height: 200px";
  el.className = document.getElementById("token").className;
  document.body.append(el);
});
await waitBlob("late");
console.log("an element added later: drawn");

await browser.close();
await server.close();
console.log("gradient-2d browser ok");
process.exit(0);
