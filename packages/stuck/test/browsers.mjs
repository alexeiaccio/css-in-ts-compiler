// @cssints/stuck in real browsers (playwright-core from node_modules/.bun; Chrome is the installed channel, Firefox and
// WebKit Playwright's builds): fixtures/app.ts, built for the default targets, with a sticky header in the document and
// one in a scroll container. Each is scrolled until it sticks (its title turns red), then back (the red is gone).
//   native    Chrome: `@container scroll-state(stuck: top)`, the observer stays off (no data-stuck)
//   observer  Firefox and WebKit (no scroll-state queries), and Chrome with the @container rules cut out and
//             CSS.supports made to say no: the observer's data-stuck and the fallback rules
// A control loads the observer build with IntersectionObserver blinded: the title must stay blue.
//   node test/browsers.mjs     BROWSERS=chrome node test/browsers.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import cssints from "cssints/vite";
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

// the evaluation server resolves the workspace packages to src/ by their "development" condition (dist/ is built at
// release); a production build would ask for dist/
process.env.NODE_ENV = "development";
const out = await build({
  root: join(here, "fixtures"),
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  build: { write: false, minify: false, rollupOptions: { input: join(here, "fixtures/app.ts") } },
});
const files = [out].flat().flatMap((o) => o.output);
const text = (ext) =>
  files
    .filter((f) => f.fileName.endsWith(ext))
    .map((f) => String(f.code ?? f.source))
    .join("\n");
const js = text(".js");
// the observer comes with the runtime module of sticky(), once (the default targets lack the queries)
assert.equal(js.split("new IntersectionObserver").length, 2, "the observer, once");
const css = text(".css");
assert.match(css, /@container scroll-state\(stuck: top\)/);
assert.match(css, /\[data-stuck~="top"\]/);
// the @container blocks (one level of nested braces), cut out
const noContainer = (s) => {
  let o = s;
  for (let i = o.indexOf("@container"); i >= 0; i = o.indexOf("@container")) {
    let depth = 0;
    let j = o.indexOf("{", i);
    do depth += o[j] === "{" ? 1 : o[j] === "}" ? -1 : 0;
    while (depth && ++j < o.length);
    o = o.slice(0, i) + o.slice(j + 1);
  }
  return o;
};

const RED = "rgb(255, 0, 0)";
const BLUE = "rgb(0, 0, 255)";
const run = async (browser, { cut = false, blind = false } = {}) => {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  // before the bundle: the probe made to fail (cut), IntersectionObserver blinded (blind)
  const stub =
    (cut ? 'Object.defineProperty(CSS,"supports",{value:()=>false});' : "") +
    (blind ? "IntersectionObserver=class{observe(){}disconnect(){}};" : "");
  await page.setContent(
    `<!doctype html><style>body{margin:0}</style><style>${cut ? noContainer(css) : css}</style><body></body><script>${stub}</script><script type="module">${js}</script>`,
  );
  await page.locator("#box header b").waitFor({ state: "attached" });
  const color = (id) =>
    page.evaluate((id) => getComputedStyle(document.querySelector(`#${id} b`)).color, id);
  const stuckAttr = (id) =>
    page.evaluate((id) => document.getElementById(id).getAttribute("data-stuck"), id);
  // the colour once it is `want`, or after 2 s (the observer's callback is asynchronous)
  const until = async (id, want) => {
    await page
      .waitForFunction(
        ([id, want]) => getComputedStyle(document.querySelector(`#${id} b`)).color === want,
        [id, want],
        { timeout: 2000 },
      )
      .catch(() => {});
    return color(id);
  };
  const scroll = (id, y) =>
    page.evaluate(
      ([id, y]) => (id === "page" ? window : document.getElementById("box")).scrollTo(0, y),
      [id, y],
    );
  const seen = {};
  for (const id of ["page", "inner"]) {
    assert.equal(await color(id), BLUE, `${id}: not stuck at first`);
    await scroll(id, 400);
    seen[id] = { stuck: await until(id, RED), attr: await stuckAttr(id) };
    await scroll(id, 0);
    seen[id].back = await until(id, BLUE);
    seen[id].attrBack = await stuckAttr(id);
  }
  await page.close();
  return seen;
};

const names = (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",");
for (const name of names) {
  const browser = await launchers[name]();
  const native = name === "chrome";
  for (const label of native ? ["native", "observer"] : ["observer"]) {
    const seen = await run(browser, { cut: native && label === "observer" });
    for (const [id, s] of Object.entries(seen)) {
      assert.equal(s.stuck, RED, `${name} ${label} ${id}: red while stuck ${JSON.stringify(s)}`);
      assert.equal(s.back, BLUE, `${name} ${label} ${id}: blue again`);
      assert.equal(s.attr, label === "native" ? null : "top", `${name} ${label} ${id}: data-stuck`);
      assert.equal(s.attrBack, null, `${name} ${label} ${id}: data-stuck removed`);
    }
    console.log(`${name} ${label}: ok`);
  }
  // control: without the observer, the fallback cannot turn on
  const control = await run(browser, { cut: native, blind: true });
  for (const [id, s] of Object.entries(control))
    assert.equal(s.stuck, BLUE, `${name} control ${id}: blue without the observer`);
  console.log(`${name} control: ok`);
  await browser.close();
}
console.log("stuck browsers ok");
process.exit(0);
