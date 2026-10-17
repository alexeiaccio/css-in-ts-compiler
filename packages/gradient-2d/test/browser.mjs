// meshGradient() and freeformGradient() in Chrome (the installed one, channel "chrome": it has neither function), through
// playwright-core from node_modules/.bun. The page is test/fixtures/page: a 3 x 3 mesh, a 2 x 2 mesh with a token colour,
// and a 3-point freeform gradient, each on a 1000 x 600 box (the token one 300 x 200). Steps:
//   first paint  the runtime's observers blinded: the mesh is the average colour, the freeform the kernel's radial stack
//   drawn        the runtime draws: the background is a blob URL; the pixels at 20 points equal the maths (grid.ts and
//                points.ts, on the data the element carries), and a token resolved through a probe reads as --accent
//   resize       the box shrinks: a new blob at a quarter of the new size; the time is printed
//   added later  an element with a class, added after the load, is drawn too
// Run: node test/browser.mjs (not in `test`: it needs Chrome)
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// no browser has either function yet, so the build ships the runtime
process.env.BROWSERSLIST = "chrome 110";
const { default: cssints } = await import("cssints/vite");
const { createServer } = await import("vite");
const { fromSpace, sample, toSpace } = await import("../src/grid.ts");
const { freeform } = await import("../src/points.ts");

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
  // freeform without JS: the stack of the kernel, one radial layer per point, in the source order
  const ffFirst = await page.evaluate(
    () => getComputedStyle(document.getElementById("ff")).backgroundImage,
  );
  assert.match(ffFirst, /^radial-gradient\(circle at 0% 0%/, ffFirst);
  assert.equal((ffFirst.match(/radial-gradient\(/g) ?? []).length, 3, ffFirst);
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
const dataOf = (id, property) =>
  page.evaluate(
    ({ sel, p }) =>
      JSON.parse(JSON.parse(getComputedStyle(document.getElementById(sel)).getPropertyValue(p))),
    { sel: id, p: property },
  );

await waitBlob("hero");
await waitBlob("token");
await waitBlob("ff");

// 20 points: the corners and 18 spread over the image
const points = (w, h) => [
  [0, 0],
  [w - 1, h - 1],
  ...Array.from({ length: 18 }, (_, i) => [(i * 397 + 13) % w, (i * 211 + 7) % h]),
];
// the blob of an element against the maths; `want(u, v, w, h)` is the sRGB colour the maths says
const compare = async (id, want) => {
  const u = blobOf(await bgOf(id));
  const { w, h } = await readPixels(u, []);
  const pts = points(w, h);
  const { px } = await readPixels(u, pts);
  let worst = { d: 0, at: "" };
  pts.forEach(([x, y], i) => {
    // out of the gamut the canvas clamps to 0 or 255, as the runtime's bytes do
    const q = want((x + 0.5) / w, (y + 0.5) / h, w, h).map((c) =>
      Math.min(255, Math.max(0, c * 255)),
    );
    for (let k = 0; k < 4; k++) {
      const d = Math.abs(px[i][k] - q[k]);
      if (d > worst.d)
        worst = {
          d,
          at: `(${x}, ${y}) got ${px[i].join(" ")}, want ${q.map(Math.round).join(" ")}`,
        };
    }
  });
  assert.ok(worst.d <= 3, `${id}: a pixel differs by ${worst.d.toFixed(1)}: ${worst.at}`);
  return { w, h, worst: worst.d };
};
// the mesh: the grid of the data, `resolved` gives the colour of a token the browser resolves
const check = async (id, resolved = {}) => {
  const { space, rows } = await dataOf(id, "--gradient2d-data");
  const grid = rows.map((row) =>
    row.map((s) => toSpace(space, typeof s === "string" ? resolved[s] : s)),
  );
  return compare(id, (u, v) => fromSpace(space, sample(grid, u, v)));
};
// the freeform: inverse-distance weighting at the box's aspect, as runtime.ts calls it
const checkFF = async (id) => {
  const { space, points: list } = await dataOf(id, "--gradient2d-ff-data");
  const ps = list.map(([u, v, spread, c]) => ({ u, v, spread, q: toSpace(space, c) }));
  return compare(id, (u, v, w, h) => fromSpace(space, freeform(ps, u, v, h / w)));
};

const hero = await check("hero");
console.log(`hero: a ${hero.w} x ${hero.h} blob, worst channel difference ${hero.worst} of 255`);
const token = await check("token", { "var(--accent)": [0, 1, 0, 1] });
console.log(`token: var(--accent) read as #00ff00, worst difference ${token.worst} of 255`);
const ff = await checkFF("ff");
console.log(`freeform: a ${ff.w} x ${ff.h} blob, worst channel difference ${ff.worst} of 255`);

// resize: the box shrinks, and the runtime draws again at a quarter of the new size; toggled six times, the median time
// is read in Node: from the width change to the new background, polled every frame by the page
const toggle = async (id) => {
  const was = await bgOf(id);
  const times = { "800px": [], "1000px": [] };
  for (const width of ["800px", "1000px", "800px", "1000px", "800px", "1000px"]) {
    const before = await bgOf(id);
    const t0 = performance.now();
    await page.evaluate(
      ({ sel, w }) => {
        document.getElementById(sel).style.width = w;
      },
      { sel: id, w: width },
    );
    await page.waitForFunction(
      ({ sel, b }) => getComputedStyle(document.getElementById(sel)).backgroundImage !== b,
      { sel: id, b: before },
    );
    times[width].push(performance.now() - t0);
  }
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  assert.notEqual(blobOf(await bgOf(id)), blobOf(was));
  const { w, h } = await readPixels(blobOf(await bgOf(id)), []);
  return {
    w,
    h,
    all: median(times["1000px"].concat(times["800px"])),
    redraw: median(times["1000px"]),
  };
};
for (const id of ["hero", "ff"]) {
  const r = await toggle(id);
  assert.equal(r.w, 250);
  assert.equal(r.h, 150);
  console.log(
    `${id} resize 800 <-> 1000 px (a ${r.w} x ${r.h} blob): median ${r.all.toFixed(1)} ms over six, ` +
      `${r.redraw.toFixed(1)} ms of the three at 1000 x 600`,
  );
}

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
