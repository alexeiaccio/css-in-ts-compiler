// cssints/frame in real browsers: a built app (fixtures/frame-app.ts) read with getComputedStyle, in Chrome, Firefox and
// WebKit (playwright-core from node_modules/.bun; Chrome is the installed channel, the others Playwright's builds).
//   node frame-browsers.mjs              all three     BROWSERS=chrome,webkit node frame-browsers.mjs   some
// Three builds of the same app, one expected table:
//   style queries  targets with style queries: the kernel only, no runtime in the bundle
//   probe          targets without them: kernel, fallback CSS and the runtime ship; the browser has the feature, so the probe
//                  must leave the script off (the kernel still gives the radii)
//   runtime        the same build with the @container rules cut out of its CSS and the probe made to fail: only the
//                  fallback CSS and the script can give the radii (the runtime path of a browser without style queries)
// A control loads the runtime build with the script blinded (no MutationObserver): each frame keeps its own declared
// radius (f2 0, f3 40), so the table can fail.
// Not Safari: Playwright's WebKit is a trunk snapshot, not a Safari release (docs/research/plugins.md §3.6).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

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

// The targets of a build are read once per process (css-grammar's support.ts), so each build is a child of this script:
// `node frame-browsers.mjs --build` prints the bundle for $BROWSERSLIST as JSON.
if (process.argv[2] === "--build") {
  const { default: cssints } = await import("../src/plugin.ts");
  const out = await build({
    root: join(here, "fixtures"),
    configFile: false,
    logLevel: "silent",
    plugins: cssints(),
    build: {
      write: false,
      minify: false,
      lib: { entry: "frame-app.ts", formats: ["es"], fileName: "app" },
    },
  });
  const files = [out].flat().flatMap((o) => o.output);
  const text = (ext) =>
    files
      .filter((f) => f.fileName.endsWith(ext))
      .map((f) => String(f.code ?? f.source))
      .join("\n");
  process.stdout.write(JSON.stringify({ js: text(".js"), css: text(".css") }));
  process.exit(0);
}
const bundle = (browserslist) =>
  JSON.parse(
    execFileSync(process.execPath, [import.meta.filename, "--build"], {
      env: { ...process.env, BROWSERSLIST: browserslist },
      encoding: "utf8",
      maxBuffer: 1 << 26,
    }),
  );
const builds = {
  "style queries": bundle("chrome 120"),
  probe: bundle("chrome 120, firefox 128"),
};
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
builds.runtime = { js: builds.probe.js, css: noContainer(builds.probe.css) };
assert.ok(!builds["style queries"].js.includes("data-cssints-poly"), "no runtime in the bundle");
assert.ok(!builds["style queries"].css.includes("data-cssints-poly"), "no fallback CSS either");
assert.ok(builds.probe.js.includes("data-cssints-poly"), "the runtime is in the bundle");
assert.ok(builds.probe.css.includes(":root[data-cssints-poly] ._f"), "...with its fallback CSS");
assert.ok(builds.probe.css.includes("@container"), "...and the kernel");
assert.ok(!builds.runtime.css.includes("@container"), "the runtime build has no style query left");

// the page: the built CSS, the probe made to fail where asked (`i` is the element the probe looks at), the built script
const serve = async (browser, { css, js }, { probeFails = false, blind = false } = {}) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  if (blind)
    await page.addInitScript(() => {
      globalThis.MutationObserver = class {
        observe() {}
        takeRecords() {
          return [];
        }
      };
    });
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
  await page.waitForSelector("#f4", { state: "attached" });
  return page;
};
const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((r) =>
        setTimeout(
          () => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 20))),
          0,
        ),
      ),
  );
const radii = (page, ids) =>
  page.evaluate(
    (ids) =>
      Object.fromEntries(
        ids.map((id) => [
          id,
          document.getElementById(id) &&
            getComputedStyle(document.getElementById(id)).borderTopLeftRadius,
        ]),
      ),
    ids,
  );

// f1 (radius 24, padding 8, border 2) > f2 (padding 6, border 1, margin 3) > div > f3 (padding 4, a radius of 40 that
// is ignored) > f4; a lone frame; em1 (padding 1em of 20px) > em2 (10px): the radius is 24 - 20, not 24 - 10
const steps = [
  ["initial", async () => {}, { f1: 24, f2: 11, f3: 4, f4: 0, iso: 24, em1: 24, em2: 4 }],
  [
    "a frame inside f2, under a plain div",
    (p) =>
      p.evaluate(() =>
        document
          .getElementById("f2")
          .insertAdjacentHTML(
            "afterbegin",
            `<div><div id=n1 class="${globalThis.cls.added}"></div></div>`,
          ),
      ),
    { f2: 11, n1: 4 },
  ],
  [
    "viewport < 500px: f1 padding 16px",
    (p) => p.setViewportSize({ width: 400, height: 800 }),
    { f1: 24, f2: 3, f3: 0, n1: 0 },
  ],
  [
    "viewport back",
    (p) => p.setViewportSize({ width: 1000, height: 800 }),
    { f2: 11, f3: 4, n1: 4 },
  ],
  [
    "f2 gets a margin of 5px",
    (p) => p.evaluate(() => (document.getElementById("f2").className = globalThis.cls.f2Margin)),
    { f2: 9, f3: 2, n1: 2 },
  ],
];
const padding = (page, id) =>
  page.evaluate((id) => getComputedStyle(document.getElementById(id)).paddingTop, id);

const names = (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",");
let failed = 0;
for (const name of names) {
  const browser = await launchers[name]();
  console.log(`${name} ${browser.version()}`);
  for (const [mode, b, opts] of [
    ["style queries", builds["style queries"], {}],
    ["probe", builds.probe, {}],
    ["runtime", builds.runtime, { probeFails: true }],
  ]) {
    const page = await serve(browser, b, opts);
    await settle(page);
    const poly = await page.evaluate(() =>
      document.documentElement.hasAttribute("data-cssints-poly"),
    );
    const row = [];
    for (const [step, act, want] of steps) {
      await act(page);
      await settle(page);
      const got = await radii(page, Object.keys(want));
      const expected = Object.fromEntries(Object.entries(want).map(([k, v]) => [k, `${v}px`]));
      try {
        assert.deepEqual(got, expected, step);
        row.push(`ok ${step}`);
      } catch (e) {
        failed++;
        row.push(`FAIL ${step}: ${JSON.stringify(got)} wanted ${JSON.stringify(expected)}`);
      }
    }
    if (mode === "runtime")
      assert.equal(await padding(page, "f1"), "8px", "padding is not the runtime's");
    const wantPoly = mode === "runtime";
    if (poly !== wantPoly) {
      failed++;
      row.push(`FAIL data-cssints-poly is ${poly}, wanted ${wantPoly}`);
    }
    console.log(
      `  ${mode.padEnd(13)} ${row.every((r) => r.startsWith("ok")) ? `${row.length} steps ok, runtime ${poly ? "on" : "off"}` : `\n    ${row.join("\n    ")}`}`,
    );
    await page.close();
  }
  // the control: the script cannot see the frames, so each keeps its declared radius
  const bare = await serve(browser, builds.runtime, { probeFails: true, blind: true });
  await settle(bare);
  const own = await radii(bare, ["f1", "f2", "f3", "iso"]);
  const dead = own.f1 === "24px" && own.f2 === "0px" && own.f3 === "40px" && own.iso === "24px";
  if (!dead) failed++;
  console.log(`  ${dead ? "ok" : "FAIL"} control, blind script: ${JSON.stringify(own)}`);
  await browser.close();
}
console.log(failed ? `${failed} failed` : "frame-browsers: ok");
process.exit(failed ? 1 : 0);
