// @cssints/reactive in real browsers through playwright-core (Chrome is the installed channel, Firefox and WebKit
// Playwright's builds): fixtures/app.js, built once (the runtime ships for every target, so a target set decides nothing),
// with the cases on one page — two independent disclosures, an owner whose state starts true, tabs on a string state,
// a nested owner, the flush of one click, a <select> setting a state from value(), a checkbox from checked(), two
// programs on one element and the same program twice (the owner's attribute and the bound aria-expanded agree at once),
// and persistence: storage cleared first, a persisted disclosure across a reload, a stored value winning over the
// declared one, and a state without persist() writing nothing.
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
assert.match(css, /@property --reactive-persist\{syntax:"\*";inherits:false\}/, css);
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
      sTab: attr("s", "data-reactive-tab"),
      sCurrent: attr("s-field", "data-current"),
      s1: display("s1"),
      s2: display("s2"),
      fOpen: attr("f", "data-reactive-open"),
      fExpanded: attr("f-field", "aria-expanded"),
      fPanel: display("f-panel"),
      mOpen: attr("m", "data-reactive-open"),
      mTab: attr("m", "data-reactive-tab"),
      mExpanded: attr("m-field", "aria-expanded"),
      mCurrent: attr("m-field", "data-current"),
      mProgram: getComputedStyle(document.getElementById("m-field"))
        .getPropertyValue("--reactive-on")
        .trim(),
      mOpenPanel: display("m-open"),
      mTwoPanel: display("m-two"),
      dOpen: attr("d", "data-reactive-open"),
      dPanel: display("d-panel"),
      pOpen: attr("pr", "data-reactive-open"),
      pExpanded: attr("pr-btn", "aria-expanded"),
      pPanel: display("pr-panel"),
      vTab: attr("sv", "data-reactive-tab"),
      vPanel: display("sv-panel"),
      nOpen: attr("np", "data-reactive-open"),
      nPanel: display("np-panel"),
      st: attr("st", "data-reactive-tab"),
      stTabs: ["st1", "st2", "st3"].map((id) => [
        attr(id, "aria-selected"),
        attr(id, "aria-controls"),
        attr(id, "tabindex"),
      ]),
      stPressed: attr("stp", "aria-pressed"),
    };
  });

const run = async (page) => {
  const out = [];
  const check = (ok, what, s) => out.push(ok ? null : `${what}: ${JSON.stringify(s)}`);
  // storage starts empty in every browser, so no case leaks into another (or into a later run)
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#a-btn").waitFor({ state: "attached" });
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
  check(
    s.sTab === "one" && s.sCurrent === "one" && s.s1 === "block" && s.s2 === "none",
    "select: the first option on load",
    s,
  );
  check(
    s.fOpen === "false" && s.fExpanded === "false" && s.fPanel === "none",
    "checkbox: closed on load",
    s,
  );
  check(
    s.mProgram === "click toggle open,keydown set tab two",
    "multi: two on()s are one joined program",
    s,
  );
  check(s.dOpen === "false" && s.dPanel === "none", "dup: closed on load", s);
  check(
    s.st === "one" &&
      JSON.stringify(s.stTabs) ===
        JSON.stringify([
          ["true", "strip-panel-one", "0"],
          ["false", "strip-panel-two", "-1"],
          ["false", "strip-panel-three", "-1"],
        ]) &&
      s.stPressed === "false",
    "computed: the four kinds on load",
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

  // a select: change reads target.value (@value), and both panels follow the string state
  await page.locator("#s-field").selectOption("two");
  await frames(page);
  s = await read(page);
  check(
    s.sTab === "two" && s.sCurrent === "two" && s.s1 === "none" && s.s2 === "block",
    "select: the second panel",
    s,
  );
  await page.locator("#s-field").selectOption("one");
  await frames(page);
  s = await read(page);
  check(s.sTab === "one" && s.s2 === "none", "select: back to the first", s);

  // a checkbox: change reads target.checked (@checked), and the disclosure follows the boolean state
  await page.locator("#f-field").check();
  await frames(page);
  s = await read(page);
  check(s.fOpen === "true" && s.fExpanded === "true" && s.fPanel === "block", "checkbox: open", s);
  await page.locator("#f-field").uncheck();
  await frames(page);
  s = await read(page);
  check(s.fOpen === "false" && s.fPanel === "none", "checkbox: closed again", s);

  // two programs on one element: click and keydown both run, one flush each
  await page.locator("#m-field").click();
  await frames(page);
  s = await read(page);
  check(
    s.mOpen === "true" && s.mExpanded === "true" && s.mOpenPanel === "block",
    "multi: click opens",
    s,
  );
  await page.locator("#m-field").focus();
  await page.keyboard.press("t");
  await frames(page);
  s = await read(page);
  check(
    s.mTab === "two" && s.mCurrent === "two" && s.mTwoPanel === "block",
    "multi: keydown sets the tab",
    s,
  );

  // the same program twice on one element: one segment, so a click is one toggle
  await page.locator("#d-btn").click();
  await frames(page);
  s = await read(page);
  check(s.dOpen === "true" && s.dPanel === "block", "dup: one toggle per click", s);

  // computed attributes: a comparison (aria-selected), a literal (aria-controls) and a choice (roving tabindex) on each tab,
  // written from the nearest owner in the same flush: read with no frame waited. Nothing here persists, so the storage list
  // is the same and a reload shows the declared tab again.
  const storageBefore = await page.evaluate(() => Object.keys(localStorage).sort());
  await page.locator("#st2").click();
  s = await read(page);
  check(
    s.st === "two" &&
      JSON.stringify(s.stTabs) ===
        JSON.stringify([
          ["false", "strip-panel-one", "-1"],
          ["true", "strip-panel-two", "0"],
          ["false", "strip-panel-three", "-1"],
        ]),
    "computed: one click rewrites all three tabs",
    s,
  );
  await page.locator("#stp").click();
  s = await read(page);
  check(s.stPressed === "true", "computed: aria-pressed from a boolean comparison", s);
  const storageAfter = await page.evaluate(() => Object.keys(localStorage).sort());
  check(
    JSON.stringify(storageAfter) === JSON.stringify(storageBefore),
    "computed: a comparison is not stored",
    { storageBefore, storageAfter },
  );
  await page.reload();
  s = await read(page);
  check(
    s.st === "one" &&
      s.stTabs[0][0] === "true" &&
      s.stTabs[1][0] === "false" &&
      s.stTabs[2][0] === "false" &&
      s.stTabs[0][2] === "0" &&
      s.stTabs[1][2] === "-1" &&
      s.stPressed === "false",
    "computed: a reload keeps nothing",
    s,
  );

  // persistence: closed with no storage; a click stores "true"; a reload restores it at initialisation, read right after
  // load with no frame waited, so the panel is open before the harness gets to look
  s = await read(page);
  check(s.pOpen === "false" && s.pPanel === "none", "persist: closed with no storage", s);
  await page.locator("#pr-btn").click();
  await frames(page);
  s = await read(page);
  check(
    s.pOpen === "true" && s.pExpanded === "true" && s.pPanel === "block",
    "persist: open after the click",
    s,
  );
  check(
    (await page.evaluate(() => localStorage.getItem("reactive:test-open"))) === "true",
    "persist: the click stored the value",
    s,
  );
  await page.reload();
  s = await read(page);
  check(
    s.pOpen === "true" && s.pExpanded === "true" && s.pPanel === "block",
    "persist: open right after the reload",
    s,
  );

  // a stored value wins over the one the build declared (the page declared "one", the slot holds "two")
  s = await read(page);
  check(
    s.vTab === "one" && s.vPanel === "none",
    "persist: the declared value with no stored one",
    s,
  );
  await page.evaluate(() => localStorage.setItem("reactive:test-tab", "two"));
  await page.reload();
  s = await read(page);
  check(
    s.vTab === "two" && s.vPanel === "block",
    "persist: the stored value wins over the declared one",
    s,
  );

  // a state without persist() is not written: the slot list is the same after a click, and a reload forgets the state
  const before = await page.evaluate(() => Object.keys(localStorage).sort());
  await page.locator("#np-btn").click();
  await frames(page);
  s = await read(page);
  check(s.nOpen === "true" && s.nPanel === "block", "persist: the plain state opens", s);
  const after = await page.evaluate(() => Object.keys(localStorage).sort());
  check(
    JSON.stringify(after) === JSON.stringify(before),
    "persist: a state without persist() writes nothing",
    { before, after },
  );
  await page.reload();
  s = await read(page);
  check(s.nOpen === "false" && s.nPanel === "none", "persist: a plain state is not restored", s);
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
