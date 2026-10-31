// @cssints/reactive in real browsers through playwright-core (Chrome is the installed channel, Firefox and WebKit
// Playwright's builds): fixtures/app.js, built once (the runtime ships for every target, so a target set decides nothing),
// with five cases on one page — two independent disclosures, an owner whose state starts true, tabs on a string state,
// a nested owner, and the flush of one click (the owner's attribute and the bound aria-expanded agree at once).
//   node test/browsers.mjs        BROWSERS=chrome,webkit node test/browsers.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import cssints from "cssints/vite";
import { build } from "vite";

const here = import.meta.dirname;

// a production build would ask for dist/; the workspace packages resolve to src/ by their "development" condition
process.env.NODE_ENV = "development";
const out = await build({
  root: join(here, "fixtures"),
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  build: {
    write: false,
    minify: false,
    cssMinify: "lightningcss",
    rollupOptions: { input: join(here, "fixtures/app.js") },
  },
});
const files = [out].flat().flatMap((o) => o.output);
const text = (ext) =>
  files
    .filter((f) => f.fileName.endsWith(ext))
    .map((f) => String(f.code ?? f.source))
    .join("\n");
const js = text(".js");
const css = text(".css");
// the runtime is the feature: it is in the bundle whatever the targets are, once (one module)
assert.equal(js.split("data-reactive-").length > 1, true, "the runtime is in the bundle");
assert.match(css, /@property --reactive-owner\{syntax:"\*";inherits:false\}/, css);
assert.match(css, /data-reactive-open/, css);

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

const serve = async (browser) => {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route("http://app.test/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const [body, contentType] =
      path === "/app.js"
        ? [js, "text/javascript"]
        : path === "/app.css"
          ? [css, "text/css"]
          : [
              "<!doctype html><link rel=stylesheet href=/app.css><body><script type=module src=/app.js></script>",
              "text/html",
            ];
    return route.fulfill({ body, contentType });
  });
  await page.goto("http://app.test/");
  await page.locator("#a-btn").waitFor({ state: "attached" });
  return { page, errors };
};

const frames = (page) =>
  page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a wait in the page
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
      ),
  );

// what the page says: the owners' conditions, the bound attributes and the panels' displays
const read = (page) =>
  page.evaluate(() => {
    const attr = (id, name) => document.getElementById(id)?.getAttribute(name) ?? null;
    const display = (id) => getComputedStyle(document.getElementById(id)).display;
    return {
      a: attr("a", "data-reactive-open"),
      aExpanded: attr("a-btn", "aria-expanded"),
      aPanel: display("a-panel"),
      aBg: getComputedStyle(document.getElementById("a")).backgroundColor,
      b: attr("b", "data-reactive-open"),
      bExpanded: attr("b-btn", "aria-expanded"),
      bPanel: display("b-panel"),
      c: attr("c", "data-reactive-open"),
      cExpanded: attr("c-btn", "aria-expanded"),
      cPanel: display("c-panel"),
      tab: attr("t", "data-reactive-tab"),
      t1: attr("t1", "data-current"),
      t2: attr("t2", "data-current"),
      p1: display("p1"),
      p2: display("p2"),
      outer: attr("outer", "data-reactive-open"),
      outerExpanded: attr("out-btn", "aria-expanded"),
      outerPanel: display("out-panel"),
      inner: attr("inner", "data-reactive-open"),
      innerExpanded: attr("in-btn", "aria-expanded"),
      innerPanel: display("in-panel"),
    };
  });

const run = async (page) => {
  const out = [];
  const check = (ok, what, s) => out.push(ok ? null : `${what}: ${JSON.stringify(s)}`);
  // on load: the runtime initialises every owner from the declared value, one frame after the nodes appear
  await frames(page);
  let s = await read(page);
  check(s.a === "false" && s.aExpanded === "false" && s.aPanel === "none", "a: closed on load", s);
  check(s.b === "false" && s.bExpanded === "false" && s.bPanel === "none", "b: closed on load", s);
  check(
    s.c === "true" && s.cExpanded === "true" && s.cPanel === "block",
    "c: the initial true state on load",
    s,
  );
  check(s.aBg === "rgba(0, 0, 0, 0)", "a: the element's own condition, off", s);
  check(
    s.tab === "two" && s.t1 === "two" && s.t2 === "two" && s.p1 === "none" && s.p2 === "block",
    "tabs: the second panel on load",
    s,
  );
  check(
    s.outer === "false" && s.inner === "false" && s.innerPanel === "none",
    "nested: both closed",
    s,
  );

  // one click, one flush: the attribute and the binding agree before a frame is painted
  await page.locator("#a-btn").click();
  s = await read(page);
  check(
    s.a === "true" && s.aExpanded === "true",
    "a: the attribute and aria-expanded agree at once",
    s,
  );
  await frames(page);
  s = await read(page);
  check(s.aPanel === "block", "a: open", s);
  check(s.aBg === "rgb(255, 224, 224)", "a: the element's own condition, on", s);
  check(s.b === "false" && s.bExpanded === "false" && s.bPanel === "none", "b: untouched", s);
  // and back
  await page.locator("#a-btn").click();
  await frames(page);
  s = await read(page);
  check(s.a === "false" && s.aExpanded === "false" && s.aPanel === "none", "a: closed again", s);

  // a string state: set() writes the value, both bindings follow it, the conditions show one panel
  await page.locator("#t1").click();
  await frames(page);
  s = await read(page);
  check(
    s.tab === "one" && s.t1 === "one" && s.t2 === "one" && s.p1 === "block" && s.p2 === "none",
    "tabs: the first panel",
    s,
  );
  await page.locator("#t2").click();
  await frames(page);
  s = await read(page);
  check(s.tab === "two" && s.p1 === "none" && s.p2 === "block", "tabs: the second panel again", s);

  // the nested owner: the inner toggle writes the inner owner only, in the same flush
  await page.locator("#in-btn").click();
  s = await read(page);
  check(
    s.inner === "true" && s.innerExpanded === "true" && s.outer === "false",
    "nested: inner open, outer closed (one flush)",
    s,
  );
  await frames(page);
  s = await read(page);
  check(s.innerPanel === "block" && s.outerPanel === "none", "nested: the inner panel only", s);
  await page.locator("#out-btn").click();
  await frames(page);
  s = await read(page);
  check(
    s.outer === "true" && s.inner === "true" && s.outerPanel === "block",
    "nested: outer open, inner untouched",
    s,
  );
  return out.filter(Boolean);
};

let failed = 0;
for (const name of (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",")) {
  const browser = await launchers[name]();
  console.log(`${name} ${browser.version()}`);
  const { page, errors } = await serve(browser);
  const bad = await run(page);
  if (errors.length) bad.push(`console: ${errors.join("; ")}`);
  failed += bad.length;
  console.log(`  ${bad.length ? `FAIL\n    ${bad.join("\n    ")}` : "ok"}`);
  await page.close();
  await browser.close();
}
console.log(failed ? `${failed} failed` : "browsers: ok");
process.exit(failed ? 1 : 0);
