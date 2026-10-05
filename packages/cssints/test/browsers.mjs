// cssints/frame and cssints/surface in real browsers: three built apps (fixtures/frame-app.ts, surface-app.ts, both-app.ts)
// read with getComputedStyle, in Chrome, Firefox and WebKit (playwright-core from node_modules/.bun; Chrome is the
// installed channel, the others Playwright's builds).
//   node browsers.mjs              all three     BROWSERS=chrome,webkit APPS=surface node browsers.mjs   some
// Three builds of each app, one expected table:
//   style queries  targets with style queries: the kernel only, no runtime in the bundle
//   probe          targets without them: kernel, fallback CSS and the runtime ship; the browser has the feature, so the probe
//                  must leave the script off (the kernel still gives the radii and colours)
//   runtime        the same build with the @container rules cut out of its CSS and the probe made to fail: only the
//                  fallback CSS and the script can give them (the runtime path of a browser without style queries)
// A control loads the runtime build with the script blinded (no MutationObserver): each element keeps what it declares
// (a frame its own radius, a surface the colour it makes from `canvas`), so the table can fail.
// A colour is read as the lightness (OKLab) of the pixel the browser paints for it, so the engines' serialisations of
// `oklch()` do not matter. Not Safari: Playwright's WebKit is a trunk snapshot, not a Safari release
// (docs/research/plugins.md §3.6).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { build } from "vite";

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
// PW=<an older playwright-core's index.mjs> with PLAYWRIGHT_BROWSERS_PATH drives an older browser (plugins-proto/README.md,
// "Old browsers"; apps/sky/test/safari.mjs for the WebKit builds of Safari 17 and 18). A browser without style queries (found
// by the probe's own test, below) runs only the builds that ship the runtime, and the probe must switch it on by itself.
const { chromium, firefox, webkit } = await import(
  process.env.PW ?? pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
// style queries on a custom property: an unknown query function never matches either, so this is the probe's own test
const hasStyleQueries = async (browser) => {
  const page = await browser.newPage();
  await page.setContent(
    "<style>@container style(--q:1){i{--h:1}}</style><div style=--q:1><i></i></div>",
  );
  const yes = await page.evaluate(
    () => getComputedStyle(document.querySelector("i")).getPropertyValue("--h") === "1",
  );
  await page.close();
  return yes;
};
const launchers = {
  chrome: () => chromium.launch({ channel: "chrome" }),
  firefox: () => firefox.launch(),
  webkit: () => webkit.launch(),
};

// The targets of a build are read once per process (css-grammar's support.ts), so each build is a child of this script:
// `node browsers.mjs --build frame-app.ts` prints the bundle for $BROWSERSLIST as JSON.
if (process.argv[2] === "--build") {
  const { default: cssints, cssTarget, targets } = await import("../src/plugin.ts");
  const out = await build({
    root: join(here, "fixtures"),
    configFile: false,
    logLevel: "silent",
    plugins: cssints(),
    // as the demo's vite.config: LightningCSS for the targets, so `0px` in an `initial-value` comes out as `0`
    css: { transformer: "lightningcss", lightningcss: { targets } },
    build: {
      write: false,
      minify: false,
      cssMinify: "lightningcss",
      cssTarget,
      rollupOptions: { input: join(here, "fixtures", process.argv[3]) },
    },
  });
  const files = [out].flat().flatMap((o) => o.output);
  const text = (ext) =>
    files
      .filter((f) => f.fileName.endsWith(ext))
      .map((f) => String(f.code ?? f.source))
      .join("\n");
  // a line of its own: Vite may print to stdout too (a busy HMR port)
  process.stdout.write(`\nBUNDLE ${JSON.stringify({ js: text(".js"), css: text(".css") })}\n`);
  process.exit(0);
}
const bundle = (browserslist, entry) =>
  JSON.parse(
    execFileSync(process.execPath, [import.meta.filename, "--build", entry], {
      env: { ...process.env, BROWSERSLIST: browserslist },
      encoding: "utf8",
      maxBuffer: 1 << 26,
    })
      .split("\n")
      .find((l) => l.startsWith("BUNDLE "))
      .slice(7),
  );
// the @container blocks (one level of nested braces), cut out
const noContainer = (css) => {
  let out = css;
  for (let i = out.indexOf("@container"); i >= 0; i = out.indexOf("@container")) {
    let depth = 0;
    let j = out.indexOf("{", i);
    do depth += out[j] === "{" ? 1 : out[j] === "}" ? -1 : 0;
    while (depth && ++j < out.length);
    out = out.slice(0, i) + out.slice(j + 1);
  }
  return out;
};

// the page: the built CSS, the probe made to fail where asked (`i` is the element the probe looks at), the built script;
// every MutationObserver the page makes is counted, or blinded
const serve = async (browser, { css, js }, ready, { probeFails = false, blind = false } = {}) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.addInitScript((blind) => {
    const Real = globalThis.MutationObserver;
    globalThis.observers = 0;
    globalThis.MutationObserver = blind
      ? class {
          constructor() {
            globalThis.observers++;
          }
          observe() {}
          takeRecords() {
            return [];
          }
        }
      : class extends Real {
          constructor(cb) {
            super(cb);
            globalThis.observers++;
          }
        };
  }, blind);
  await page.route("http://app.test/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const body =
      path === "/app.js"
        ? js
        : path === "/app.css"
          ? css + (probeFails ? "i{--_h:initial !important}" : "")
          : `<!doctype html><link rel=stylesheet href=/app.css><body><script type=module src=/app.js></script>`;
    return route.fulfill({
      body,
      contentType:
        path === "/app.js" ? "text/javascript" : path === "/app.css" ? "text/css" : "text/html",
    });
  });
  await page.goto("http://app.test/");
  await page.locator(ready).waitFor({ state: "attached" });
  return page;
};
const settle = (page) =>
  page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a frame or two, in the page
      new Promise((resolve) =>
        setTimeout(
          () => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 20))),
          0,
        ),
      ),
  );
// per id: the radius, the lightness of the background and the text colour as painted (black, white or the sum of its bytes)
const read = (page, ids) =>
  page.evaluate((ids) => {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const paint = (c) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#f0f";
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const light = (c) => {
      const [r, g, b, a] = paint(c);
      if (!a) return null;
      const [lr, lg, lb] = [r, g, b].map((v) =>
        v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4,
      );
      const [l, m, s] = [
        0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
        0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
        0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
      ].map(Math.cbrt);
      return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    };
    return Object.fromEntries(
      ids.map((id) => {
        const cs = getComputedStyle(document.getElementById(id));
        const [r, g, b] = paint(cs.color);
        const sum = r + g + b;
        return [
          id,
          {
            r: cs.borderTopLeftRadius,
            l: light(cs.backgroundColor),
            ink: sum === 0 ? "black" : sum === 765 ? "white" : sum,
          },
        ];
      }),
    );
  }, ids);
// the expected value of a step against what the page painted: a radius in px, a lightness within a byte's error, an ink
const differs = (got, want) =>
  Object.entries(want).flatMap(([id, w]) =>
    Object.entries(w).flatMap(([k, v]) => {
      const g = got[id]?.[k];
      const same =
        k === "l"
          ? typeof g === "number" && Math.abs(g - v) < 0.01
          : g === (k === "r" ? `${String(v)}px` : v);
      return same
        ? []
        : [`${id}.${k} ${typeof g === "number" ? g.toFixed(4) : String(g)}, wanted ${String(v)}`];
    }),
  );
// a new element of the app's `added` style, under a plain div, as the first child of `id`
const addTo = (id) => (p) =>
  p.evaluate(
    (id) =>
      document
        .getElementById(id)
        .insertAdjacentHTML(
          "afterbegin",
          `<div><div id=n1 class="${globalThis.cls.added}"></div></div>`,
        ),
    id,
  );
const narrow = (p) => p.setViewportSize({ width: 400, height: 800 });
const wide = (p) => p.setViewportSize({ width: 1000, height: 800 });
const away = (p) => p.mouse.move(900, 790);

/**
 * @typedef {{ name: string, entry: string, ready: string, steps: [string, (page: any) => unknown, Record<string, Record<string, number | string>>][],
 *   control: Record<string, Record<string, number | string>>, observers?: number, extra?: (page: any, mode: string) => Promise<string[]> }} App
 */
/** @type {App[]} */
const apps = [
  // f1 (radius 24, padding 8, border 2) > f2 (padding 6, border 1, margin 3) > div > f3 (padding 4, a radius of 40 that
  // is ignored) > f4; a lone frame; em1 (padding 1em of 20px) > em2 (10px): the radius is 24 - 20, not 24 - 10; rp (radius
  // 30, padding 4) > rem1 (padding 1rem, font-size 20px) > rem2: the radius is 26 - 16, not 26 - 20
  {
    name: "frame",
    entry: "frame-app.ts",
    ready: "#f4",
    steps: [
      [
        "initial",
        async () => {},
        r({ f1: 24, f2: 11, f3: 4, f4: 0, iso: 24, em1: 24, em2: 4, rp: 30, rem1: 26, rem2: 10 }),
      ],
      ["a frame inside f2, under a plain div", addTo("f2"), r({ f2: 11, n1: 4 })],
      ["viewport < 500px: f1 padding 16px", narrow, r({ f1: 24, f2: 3, f3: 0, n1: 0 })],
      ["viewport back", wide, r({ f2: 11, f3: 4, n1: 4 })],
      [
        "f2 gets a margin of 5px",
        (p) =>
          p.evaluate(() => (document.getElementById("f2").className = globalThis.cls.f2Margin)),
        r({ f2: 9, f3: 2, n1: 2 }),
      ],
    ],
    control: r({ f1: 24, f2: 0, f3: 40, iso: 24 }),
    extra: async (page, mode) =>
      mode === "runtime" &&
      (await page.evaluate(() => getComputedStyle(document.getElementById("f1")).paddingTop)) !==
        "8px"
        ? ["padding is not the runtime's"]
        : [],
  },
  // s0 (base #2b3a67) > s1 (lighten) > div > s2 (lighten, ink) > s3 (darken) > s4 (contrast); t0 (light base) > t1 (contrast,
  // ink) > t2 (contrast); r0 without a base is made from `canvas`; tk takes a token as its base; h1 > h2: h1 lightens on hover
  {
    name: "surface",
    entry: "surface-app.ts",
    ready: "#h2",
    steps: [
      [
        "initial",
        async () => {},
        l(
          {
            s0: 0.3592,
            s1: 0.4192,
            s2: 0.4792,
            s3: 0.3792,
            s4: 0.5292,
            t0: 0.9226,
            t1: 0.7726,
            t2: 0.6226,
            r0: 0.9,
            tk: 0.4192,
            h1: 0.3792,
            h2: 0.4392,
          },
          { s2: "white", t1: "black" },
        ),
      ],
      ["a surface inside s2, under a plain div", addTo("s2"), l({ s2: 0.4792, n1: 0.3792 })],
      [
        "viewport < 500px: s1 lightens by 0.2 and s2's ink flips",
        narrow,
        l(
          { s0: 0.3592, s1: 0.5592, s2: 0.6192, s3: 0.5192, s4: 0.6692, n1: 0.5192 },
          { s2: "black" },
        ),
      ],
      [
        "viewport back",
        wide,
        l({ s1: 0.4192, s2: 0.4792, s3: 0.3792, s4: 0.5292, n1: 0.3792 }, { s2: "white" }),
      ],
      ["hover on h1: its step is 0.1", (p) => p.hover("#h1"), l({ h1: 0.4592, h2: 0.5192 })],
      ["pointer away", away, l({ h1: 0.3792, h2: 0.4392 })],
    ],
    control: l({ s0: 0.3592, s1: 1, s3: 0.9, r0: 0.9 }),
  },
  // c1 > c2 > div > fo (frame only) > so (surface only) > c3; c1, c2 and c3 are a frame and a surface on one element. Both
  // runtimes, one observer; a media query changes the frame and the surface of c1 with one event
  {
    name: "both",
    entry: "both-app.ts",
    ready: "#c3",
    observers: 1,
    steps: [
      [
        "initial",
        async () => {},
        rl(
          { c1: 40, c2: 27, fo: 20, c3: 16, e2: 26 },
          { c1: 0.3592, c2: 0.4192, so: 0.3192, c3: 0.3792, e2: 0.4192 },
        ),
      ],
      [
        "viewport < 500px: c1 padding 16px and a step of 0.1",
        narrow,
        rl({ c1: 40, c2: 19, fo: 12, c3: 8 }, { c1: 0.4592, c2: 0.5192, so: 0.4192, c3: 0.4792 }),
      ],
      [
        "viewport back",
        wide,
        rl({ c2: 27, fo: 20, c3: 16 }, { c1: 0.3592, c2: 0.4192, so: 0.3192, c3: 0.3792 }),
      ],
      [
        "hover on c1: only its surface changes (it is a frame too)",
        (p) => p.hover("#c1", { position: { x: 500, y: 4 } }),
        rl({ c1: 40, c2: 27, fo: 20, c3: 16 }, { c1: 0.4592, c2: 0.5192, so: 0.4192, c3: 0.4792 }),
      ],
      [
        "pointer away",
        away,
        rl({ c2: 27, fo: 20, c3: 16 }, { c1: 0.3592, c2: 0.4192, so: 0.3192, c3: 0.3792 }),
      ],
      [
        "hover on e1: only its frame changes (it is a surface too)",
        (p) => p.hover("#e1", { position: { x: 500, y: 3 } }),
        rl({ e2: 20 }, { e2: 0.4192 }),
      ],
      ["pointer away", away, rl({ e2: 26 }, { e2: 0.4192 })],
    ],
    control: rl({ c1: 40, c2: 0 }, { c1: 0.3592, c2: 1 }),
  },
];
// expected tables: radii, lightnesses (with the inks)
function r(o) {
  return Object.fromEntries(Object.entries(o).map(([id, v]) => [id, { r: v }]));
}
// radii and lightnesses of the same elements: one entry per id
function rl(radii, lights) {
  const out = r(radii);
  for (const [id, v] of Object.entries(lights)) out[id] = { ...out[id], l: v };
  return out;
}
function l(o, ink = {}) {
  const out = Object.fromEntries(Object.entries(o).map(([id, v]) => [id, { l: v }]));
  for (const [id, v] of Object.entries(ink)) out[id] = { ...out[id], ink: v };
  return out;
}

const names = (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",");
const only = process.env.APPS?.split(",");
let failed = 0;
const builds = new Map();
for (const app of apps.filter((a) => !only || only.includes(a.name))) {
  const b = {
    "style queries": bundle("chrome 122", app.entry),
    probe: bundle("chrome 122, firefox 128", app.entry),
  };
  b.runtime = { js: b.probe.js, css: noContainer(b.probe.css) };
  assert.ok(
    !b["style queries"].js.includes("data-cssints-poly"),
    `${app.name}: no runtime in the bundle`,
  );
  assert.ok(!b["style queries"].css.includes("data-cssints-poly"), "no fallback CSS either");
  assert.ok(b.probe.js.includes("data-cssints-poly"), "the runtime is in the bundle");
  assert.ok(b.probe.css.includes(":root[data-cssints-poly]"), "...with its fallback CSS");
  assert.ok(b.probe.css.includes("@container"), "...and the kernel");
  assert.ok(!b.runtime.css.includes("@container"), "the runtime build has no style query left");
  builds.set(app, b);
}

for (const name of names) {
  const browser = await launchers[name]();
  const old = !(await hasStyleQueries(browser));
  console.log(`${name} ${browser.version()}${old ? ", no style queries" : ""}`);
  for (const [app, b] of builds) {
    console.log(` ${app.name}`);
    for (const [mode, bundle, opts] of [
      ...(old ? [] : [["style queries", b["style queries"], {}]]),
      ["probe", b.probe, {}],
      ["runtime", b.runtime, { probeFails: true }],
    ]) {
      const page = await serve(browser, bundle, app.ready, opts);
      await settle(page);
      const poly = await page.evaluate(() =>
        document.documentElement.hasAttribute("data-cssints-poly"),
      );
      const row = [];
      for (const [step, act, want] of app.steps) {
        await act(page);
        await settle(page);
        const bad = differs(await read(page, Object.keys(want)), want);
        if (bad.length) failed++;
        row.push(bad.length ? `FAIL ${step}: ${bad.join("; ")}` : `ok ${step}`);
      }
      for (const m of (await app.extra?.(page, mode)) ?? []) {
        failed++;
        row.push(`FAIL ${m}`);
      }
      const wantPoly = mode === "runtime" || old;
      if (poly !== wantPoly) {
        failed++;
        row.push(`FAIL data-cssints-poly is ${poly}, wanted ${wantPoly}`);
      }
      // the shared engine: one observer for every plugin on the page, none where the runtime is off
      const observers = await page.evaluate(() => globalThis.observers);
      const wantObservers = wantPoly ? (app.observers ?? 1) : 0;
      if (observers !== wantObservers) {
        failed++;
        row.push(`FAIL ${observers} observers, wanted ${wantObservers}`);
      }
      console.log(
        `  ${mode.padEnd(13)} ${row.every((x) => x.startsWith("ok")) ? `${row.length} steps ok, runtime ${poly ? "on" : "off"}, ${observers} observer${observers === 1 ? "" : "s"}` : `\n    ${row.join("\n    ")}`}`,
      );
      await page.close();
    }
    // the control: the script cannot see the elements, so each keeps what it declares
    const bare = await serve(browser, b.runtime, app.ready, { probeFails: true, blind: true });
    await settle(bare);
    const bad = differs(await read(bare, Object.keys(app.control)), app.control);
    if (bad.length) failed++;
    console.log(
      `  ${bad.length ? "FAIL" : "ok"} control, blind script: ${bad.length ? bad.join("; ") : JSON.stringify(app.control)}`,
    );
    await bare.close();
  }
  await browser.close();
}
console.log(failed ? `${failed} failed` : "browsers: ok");
process.exit(failed ? 1 : 0);
