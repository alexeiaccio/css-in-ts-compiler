// @cssints/devtools/vitals in Chrome: the report over a real page and a real CSSOM. The node test (test/vitals.mjs) holds
// the charts and the sheet reader on happy-dom; this one holds what only a browser has — layers, @property, keyframes in
// use, long tasks and long animation frames, the paint entries and the frame timeline — and the console group itself.
//
//   node test/vitals-browser.mjs         (run `vp build` first: it serves dist/vitals.js)
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { once } from "node:events";
import { createServer } from "node:http";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const PAGE = `<!doctype html>
<meta charset="utf-8">
<title>vitals</title>
<link rel="stylesheet" href="/slow.css">
<style>
  @layer test {
    .used { color: #2563eb; font-family: Inter, sans-serif }
    .dead { color: red !important }
  }
  :root { --used-color: oklch(0.7 0.1 200); --orphan: 1px }
  @property --registered { syntax: "<length>"; inherits: false; initial-value: 1px }
  .spin { animation: spin 1s linear infinite; color: var(--used-color) }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes idle { to { opacity: 0 } }
</style>
<div class="used spin">hello</div>
<button id="go">go</button>
<canvas width="10" height="10"></canvas>
<script type="module">
  import { observe, report, vitals } from "/vitals.js";
  window.__vitals = { observe, report, vitals };
  window.__ready = true;
  // an interaction whose handler blocks: INP, and its target and phases
  document.getElementById("go").addEventListener("click", () => {
    const until = performance.now() + 60;
    while (performance.now() < until);
  });
</script>`;

const server = createServer((request, response) => {
  const file = request.url?.slice(1) ?? "";
  if (file === "slow.css") {
    // a stylesheet that takes a moment: the load row's render-blocking window
    setTimeout(() => {
      response.writeHead(200, { "content-type": "text/css" });
      response.end(".slow { color: rgb(9 9 9) }");
    }, 60);
    return;
  }
  if (file.endsWith(".js")) {
    // dist/ holds vitals.js and the selector chunk it shares with the overlay
    response.writeHead(200, { "content-type": "text/javascript" });
    response.end(readFileSync(join(here, "../dist", file.replace(/^.*\//, ""))));
  } else {
    response.writeHead(200, { "content-type": "text/html" });
    response.end(PAGE);
  }
});
server.listen(0);
await once(server, "listening");
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  const lines = [];
  page.on("console", (message) => lines.push(message.text()));
  await page.goto(url);
  await page.waitForFunction("window.__ready === true");
  // long tasks and long animation frames are not buffered: the page observes before the work, as an app's entry does
  await page.evaluate(() => window.__vitals.observe());

  // one long task after the load, in a task of the page's own (a loop inside page.evaluate is not attributed to the page)
  await page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- one task of the page's own, off the test's call stack
      new Promise((resolve) => {
        setTimeout(() => {
          const until = performance.now() + 90;
          while (performance.now() < until);
          resolve();
        }, 0);
      }),
  );
  // frames: the report samples a rAF loop, so let a few pass (and the long task's observer deliver) before reading it
  await page.click("#go");
  await page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a task boundary, in the page: the observers deliver on one
      new Promise((resolve) => setTimeout(resolve, 150)),
  );
  await page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a frame or two, in the page
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const report = await page.evaluate(() => window.__vitals.report());

  assert.equal(report.css.sheets, 2, "the inline sheet and the linked one");
  assert.deepEqual(report.css.layers, ["test"], "a named layer");
  assert.equal(report.css.important, 1, "one !important");
  assert.ok(report.css.bytes > 0);
  assert.ok(report.css.rules >= 5, String(report.css.rules));
  assert.deepEqual(report.css.unused, ["dead", "slow"], "classes nobody carries");
  assert.ok(report.css.classes.includes("used") && report.css.classes.includes("spin"));
  assert.ok(report.css.colours.includes("rgb(37, 99, 235)"), report.css.colours.join());
  assert.ok(report.css.colours.includes("oklch(0.7 0.1 200)"), report.css.colours.join());
  assert.deepEqual(report.css.fonts, ["inter, sans-serif"]);
  assert.deepEqual(report.css.specificity, [0, 1, 0]);
  assert.deepEqual(report.css.custom.declared, ["--orphan", "--registered", "--used-color"]);
  assert.deepEqual(report.css.custom.used, ["--used-color"]);
  assert.deepEqual(report.css.custom.orphaned, ["--orphan", "--registered"]);
  assert.deepEqual(report.css.keyframes.declared, ["idle", "spin"]);
  assert.deepEqual(report.css.keyframes.used, ["spin"]);
  assert.deepEqual(report.css.keyframes.unused, ["idle"]);
  assert.deepEqual(
    report.css.layerBytes.map((x) => x.layer).sort(),
    ["test", "unlayered"],
    "style rules under the layer and outside it",
  );

  assert.ok(report.fcp > 0, `FCP ${report.fcp}`);
  assert.ok(report.ttfb > 0, `TTFB ${report.ttfb}`);
  assert.ok(report.loaf.count >= 1, "the busy loop is a long animation frame");
  assert.ok(report.loaf.total > 0 && report.loaf.max > 0);
  assert.equal(report.ratings.cls, "good", "web-vitals' own rating");
  assert.ok(report.lcp > 0, `LCP ${report.lcp}`);
  assert.ok(report.lcpTarget, "the LCP element is named");
  assert.ok(report.inp >= 50, `INP ${report.inp}`);
  assert.match(report.inpTarget ?? "", /#go$/, "the interaction's target, as web-vitals names it");
  assert.ok(
    report.inpPhases && report.inpPhases.processing >= 50,
    JSON.stringify(report.inpPhases),
  );
  assert.ok(report.frames.history.length > 0, "the frame loop sampled");
  assert.ok(report.frames.max > 0);
  assert.equal(report.errors, 0);
  assert.ok(report.loads.length >= 1, "the stylesheet is in the timeline");
  assert.equal(report.loads[0].blocking, true, "a linked stylesheet of the head blocks render");
  assert.equal(report.loads[0].name, "slow.css");
  assert.ok(report.loads[0].end >= 50, `the slow sheet took ${report.loads[0].end} ms`);
  assert.ok(report.inpFrames && report.inpFrames.frames >= 1, JSON.stringify(report.inpFrames));
  assert.ok(
    report.loaf.invokers.length + report.loaf.scripts.length >= 1,
    JSON.stringify(report.loaf),
  );
  assert.equal(report.history.length, 1, "the first report records the load");
  assert.equal(report.history[0].path, "/", "keyed by path");
  assert.ok(report.nodes >= 3, `nodes ${report.nodes}`);

  await page.evaluate(() => window.__vitals.vitals());
  const printed = lines.join("\n");
  for (const needle of [
    "cssints vitals",
    "vitals   FCP",
    "INP ",
    "frames   p50",
    "CSS      ",
    "coverage ",
  ])
    assert.ok(printed.includes(needle), `the console has no "${needle}":\n${printed}`);
  assert.equal(await page.evaluate(() => typeof window.vitals), "function", "the console's way in");

  // a reload is a second load of the same path: the history keeps both and the report reads a delta
  await page.reload();
  await page.waitForFunction(() => typeof window.__vitals === "object");
  await page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a task boundary for the observers, in the page
      new Promise((resolve) => setTimeout(resolve, 300)),
  );
  const second = await page.evaluate(() => window.__vitals.report());
  assert.equal(second.history.length, 2, "the reload is the second load");
  assert.equal(second.history.at(-1).path, "/", "keyed by path");
  assert.equal(second.history.at(-2).path, "/");

  console.log(
    `vitals browsers ok: ${Math.round(report.elapsed)} ms, LCP ${Math.round(report.lcp)} ms on ${report.lcpTarget}, ` +
      `INP ${Math.round(report.inp)} ms on ${report.inpTarget}, ${report.css.rules} rules, ` +
      `${report.loaf.count} long frame(s), ${report.loads.length} stylesheet(s), ${report.css.unused.length} unused class`,
  );
} finally {
  await browser.close();
  server.close();
}
