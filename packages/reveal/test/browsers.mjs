// reveal() in real browsers through playwright-core (Chrome is the installed channel, Firefox and WebKit Playwright's
// builds): fixtures/app.js, built for two sets of targets, with a box below the fold that enters between scrollY 400
// and 500. Where the browser has scroll-driven animations the native build is scrubbed by the scroll (opacity 0 before,
// about 0.5 halfway, 1 in, on a ViewTimeline); the fallback build plays once when the box enters. Every browser also
// runs the fallback forced: CSS.supports made to say no, the view timeline cut out of the CSS and `@supports not` made
// true, so Chrome and WebKit run the IntersectionObserver path as Firefox does.
//   node test/browsers.mjs        BROWSERS=chrome,webkit node test/browsers.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import cssints from "cssints/vite";
import { build } from "vite";

const here = import.meta.dirname;

// The targets are read once per process: each build is a child, `node browsers.mjs --build` prints the bundle as JSON.
if (process.argv[2] === "--build") {
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
  process.stdout.write(`\nBUNDLE ${JSON.stringify({ js: text(".js"), css: text(".css") })}\n`);
  process.exit(0);
}
const bundle = (browserslist) =>
  JSON.parse(
    execFileSync(process.execPath, [import.meta.filename, "--build"], {
      env: { ...process.env, BROWSERSLIST: browserslist, NODE_ENV: "development" },
      encoding: "utf8",
      maxBuffer: 1 << 26,
    })
      .split("\n")
      .find((l) => l.startsWith("BUNDLE "))
      .slice(7),
  );

const native = bundle("chrome 120, safari 26");
const withFallback = bundle("chrome 120, firefox 128");
assert.ok(!native.css.includes("data-reveal"), "native targets: no fallback CSS");
assert.ok(withFallback.css.includes("data-reveal-in"), "Firefox in the targets: the fallback CSS");
// the script comes with the runtime module, once, and only when a target lacks the timeline
assert.equal(withFallback.js.split("new IntersectionObserver").length, 2, "the script, once");
assert.ok(!native.js.includes("IntersectionObserver"), "native targets: no script");
// forced: no view timeline left, and the fallback rules apply whatever the browser has
const forced = {
  js: withFallback.js,
  css: withFallback.css
    .replace(/@supports not \(animation-timeline:\s*view\(\)\)/g, "@supports (display: block)")
    .replace(/animation-timeline:\s*view\(\);?/g, ""),
};
assert.ok(!forced.css.includes("view()") && forced.css.includes("@supports (display: block)"));

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

const serve = async (browser, { css, js }, { noSupport = false } = {}) => {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  if (noSupport)
    await page.addInitScript(() => {
      CSS.supports = () => false;
    });
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
  await page.locator("#box").waitFor({ state: "attached" });
  return page;
};
const frames = (page, ms = 0) =>
  page.evaluate(
    (ms) =>
      // oxlint-disable-next-line promise/avoid-new -- a wait in the page
      new Promise((resolve) =>
        setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(resolve)), ms),
      ),
    ms,
  );
const scroll = async (page, y, ms) => {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await frames(page, ms);
};
const state = (page) =>
  page.evaluate(() => {
    const box = document.getElementById("box");
    return {
      opacity: Number(getComputedStyle(box).opacity),
      timeline: document.getAnimations()[0]?.timeline?.constructor.name,
      poly: document.documentElement.hasAttribute("data-reveal"),
      in: box.hasAttribute("data-reveal-in"),
    };
  });

const scrubbed = async (page) => {
  const out = [];
  const check = (ok, what, s) => out.push(ok ? null : `${what}: ${JSON.stringify(s)}`);
  // WebKit may read the first frame before the view timeline has a time
  await frames(page);
  let s = await state(page);
  check(s.opacity === 0 && s.timeline === "ViewTimeline" && !s.poly, "below the fold", s);
  await scroll(page, 450);
  s = await state(page);
  check(s.opacity > 0.3 && s.opacity < 0.7, "halfway in", s);
  await scroll(page, 600);
  s = await state(page);
  check(s.opacity === 1, "in", s);
  await scroll(page, 0);
  s = await state(page);
  check(s.opacity === 0, "scrolled back: the scroll drives it", s);
  return out.filter(Boolean);
};
const played = async (page) => {
  const out = [];
  const check = (ok, what, s) => out.push(ok ? null : `${what}: ${JSON.stringify(s)}`);
  // longer than the 200ms animation: held, not played on load
  await frames(page, 400);
  let s = await state(page);
  check(s.opacity === 0 && s.poly && !s.in, "below the fold, held", s);
  await scroll(page, 450, 400);
  s = await state(page);
  check(s.opacity === 1 && s.in, "entered: played to the end", s);
  await scroll(page, 0, 100);
  s = await state(page);
  check(s.opacity === 1, "scrolled back: played once", s);
  return out.filter(Boolean);
};

let failed = 0;
for (const name of (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",")) {
  const browser = await launchers[name]();
  const probe = await browser.newPage();
  const has = await probe.evaluate(() => CSS.supports("animation-timeline:view()"));
  await probe.close();
  console.log(`${name} ${browser.version()}${has ? "" : ", no scroll-driven animations"}`);
  const runs = has
    ? [
        ["native build", native, {}, scrubbed],
        ["fallback build", withFallback, {}, scrubbed],
        ["forced fallback", forced, { noSupport: true }, played],
      ]
    : [
        ["fallback build", withFallback, {}, played],
        ["forced fallback", forced, { noSupport: true }, played],
      ];
  for (const [label, b, opts, run] of runs) {
    const page = await serve(browser, b, opts);
    const bad = await run(page);
    failed += bad.length;
    console.log(`  ${label.padEnd(16)} ${bad.length ? `FAIL\n    ${bad.join("\n    ")}` : "ok"}`);
    await page.close();
  }
  // the control: without the fallback CSS the animation plays on load, so the check of the fallback must fail
  const page = await serve(
    browser,
    { js: native.js, css: native.css.replace(/animation-timeline:\s*view\(\);?/g, "") },
    { noSupport: true },
  );
  const caught = (await played(page)).length > 0;
  if (!caught) failed++;
  console.log(`  ${"control".padEnd(16)} ${caught ? "ok, played on load" : "FAIL, held"}`);
  await page.close();
  await browser.close();
}
console.log(failed ? `${failed} failed` : "browsers: ok");
process.exit(failed ? 1 : 0);
