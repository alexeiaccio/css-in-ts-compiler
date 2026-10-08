// balance() in Chrome, Firefox and WebKit (playwright-core from node_modules/.bun; Chrome is the installed channel, the
// others Playwright's builds). One build of fixtures/main.ts for targets without `text-wrap: balance`, so the fallback CSS
// and the runtime ship; a heading whose last line holds one word, balanced and not, at 420px. Steps:
//   native   the browser balances it by `text-wrap: balance` (the fallback flag stays off: `@supports not`)
//   runtime  the native feature switched off and the flag forced on: only the script can balance it; again after a resize
//   control  the same, with the script's observers blinded: the heading keeps its short last line, so the test can fail
// Balanced: the last line is at least 70% of the longest (the plain heading's is under 50%).
// Run: node test/browsers.mjs (BROWSERS=chrome,webkit for some)
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

process.env.BROWSERSLIST = "chrome 110, safari 17.3, firefox 120";
// the exports' `development` condition: the runtime is src/runtime.ts (dist is not built in the workspace)
process.env.NODE_ENV = "development";
const { default: cssints } = await import("cssints/vite");
const { build } = await import("vite");

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
  build: { write: false, minify: false, rollupOptions: { input: join(here, "fixtures/main.ts") } },
});
const files = [out].flat().flatMap((o) => o.output);
const text = (ext) =>
  files
    .filter((f) => f.fileName.endsWith(ext))
    .map((f) => String(f.code ?? f.source))
    .join("\n");
const js = text(".js");
const css = text(".css");
assert.match(css, /@supports not \(text-wrap:\s*balance\)/, css);
assert.equal(js.split('"--balance-js"').length, 2, "the runtime is in the bundle, once");

const FORCE = "._balance-core{text-wrap-style:auto !important;--balance-js:1 !important}";
const serve = async (browser, { force = false, blind = false } = {}) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  if (blind)
    await page.addInitScript(() => {
      const Off = class {
        observe() {}
      };
      globalThis.ResizeObserver = Off;
      globalThis.MutationObserver = Off;
    });
  await page.route("http://app.test/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const [body, contentType] =
      path === "/app.js"
        ? [js, "text/javascript"]
        : path === "/app.css"
          ? [css + (force ? FORCE : ""), "text/css"]
          : [
              "<!doctype html><style>body{margin:0;width:420px;font:32px/1.2 sans-serif}h1{margin:0;font:inherit}</style>" +
                "<link rel=stylesheet href=/app.css><body><script type=module src=/app.js></script>",
              "text/html",
            ];
    return route.fulfill({ body, contentType });
  });
  await page.goto("http://app.test/");
  await page.locator("#plain").waitFor({ state: "attached" });
  await settle(page);
  return page;
};
const settle = (page) =>
  page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a frame or two, in the page
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
// the widths of the lines of a heading (its text's client rects, one row per top), and whether the flag is on
const lines = (page, id) =>
  page.evaluate((id) => {
    const el = document.getElementById(id);
    const r = document.createRange();
    r.selectNodeContents(el);
    const rows = new Map();
    for (const rect of r.getClientRects()) {
      const top = Math.round(rect.top);
      rows.set(top, (rows.get(top) ?? 0) + rect.width);
    }
    return {
      widths: [...rows.values()].map(Math.round),
      flag: getComputedStyle(el).getPropertyValue("--balance-js").trim(),
      maxWidth: el.style.maxWidth,
    };
  }, id);
const ratio = ({ widths }) => widths.at(-1) / Math.max(...widths);

const names = (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",");
for (const name of names) {
  const browser = await launchers[name]();
  const results = [];
  const check = (label, got, balanced) => {
    results.push(`${label} ${got.widths.join("/")}`);
    assert.ok(got.widths.length > 1, `${name} ${label}: ${got.widths}`);
    assert.equal(ratio(got) >= 0.7, balanced, `${name} ${label}: ${got.widths}`);
  };

  // native: the browser balances, the flag stays off, the script leaves the heading alone
  let page = await serve(browser);
  const plain = await lines(page, "plain");
  check("plain", plain, false);
  assert.ok(ratio(plain) < 0.5, `${name}: the plain heading's last line is short: ${plain.widths}`);
  const native = await lines(page, "b");
  assert.equal(native.flag, "", name);
  assert.equal(native.maxWidth, "", name);
  check("native", native, true);
  await page.close();

  // runtime: native balance off, flag forced
  page = await serve(browser, { force: true });
  const forced = await lines(page, "b");
  assert.equal(forced.flag, "1", name);
  assert.equal(forced.widths.length, plain.widths.length, `${name}: the line count is kept`);
  check("runtime", forced, true);
  await page.evaluate(() => (document.body.style.width = "300px"));
  await settle(page);
  check("runtime@300px", await lines(page, "b"), true);
  await page.close();

  // control: no observers, so the script never runs
  page = await serve(browser, { force: true, blind: true });
  check("control", await lines(page, "b"), false);
  await page.close();

  await browser.close();
  console.log(`${name}: ${results.join(", ")}`);
}
console.log("balance browsers ok");
process.exit(0);
