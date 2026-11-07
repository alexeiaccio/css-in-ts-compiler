// The console report on the kit's own site (the "storybook" of the registry items), in Chrome: the dev server starts,
// main.tsx's DEV branch imports @cssints/devtools/vitals and calls observe(), a story is opened, the page is used, and
// window.vitals() prints the group. The check is the group's content and the report's shape; the group itself is printed,
// so the numbers a report gives on a real page are visible in the run.
//
//   node test/vitals.mjs            (needs the workspace installed; Chrome, like test/site.mjs)
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

const root = join(import.meta.dirname, "..");
process.chdir(root);
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const server = await createServer({ root, logLevel: "warn", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

try {
  const page = await browser.newPage({ viewport: { width: 1300, height: 1000 } });
  // the dev server compiles the page's 34 registry items on the first request: on a loaded machine longer than 30 s
  page.setDefaultTimeout(300_000);
  page.setDefaultNavigationTimeout(300_000);
  const lines = [];
  page.on("console", (message) => lines.push(message.text()));

  // a warm-up load: the dev server compiles the 34 items on the first request, and FCP/LCP count that compile
  await page.goto(base);
  await page.locator(".docs").waitFor();
  await page.goto(`${base}#button`);
  await page.locator(".docs__preview").waitFor();
  // use the page: the button story's own button, then a couple of frames and a task for the observers to deliver
  await page.locator(".docs__preview").getByRole("button", { name: "Publish" }).click();
  await page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a few frames and a task boundary, in the page
      new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 400))),
  );

  const report = await page.evaluate(() => window.vitals());
  // the heatmap's cells are `%c` background arguments, which Playwright's text concatenates: drop them for the log
  const all = lines
    .join("\n")
    .replace(/%c/g, "")
    .replace(/background:#[0-9a-f]+;border-radius:1px/g, "");
  // the page logs other things (Solid's own warnings): the report is the group, from its header to the end
  const printed = all.slice(Math.max(0, all.indexOf("cssints vitals")));

  assert.ok(printed.includes("cssints vitals"), printed);
  assert.match(printed, /vitals {3}FCP/, printed);
  assert.match(printed, /coverage \d+ \/ \d+ classes unused/, printed);
  assert.match(printed, /sheet {4}\d+(\.\d+)? kB · the first measurement/, printed);
  assert.ok(report.sheet.edits.length >= 1, "the dev server's first measurement");
  assert.match(printed, /^layer {4}/m, printed);
  assert.ok(report.css.sheets >= 1, `sheets ${report.css.sheets}`);
  assert.ok(report.css.bytes > 1000, `bytes ${report.css.bytes}`);
  assert.ok(report.css.classes.length > 50, `classes ${report.css.classes.length}`);
  assert.ok(report.css.layers.length >= 2, `layers ${report.css.layers.join()}`);
  assert.ok(report.fcp !== null && report.fcp > 0, `FCP ${report.fcp}`);
  assert.ok(report.lcp !== null && report.lcp > 0, `LCP ${report.lcp}`);
  assert.ok(report.cls >= 0, `CLS ${report.cls}`);
  assert.ok(report.nodes > 200, `nodes ${report.nodes}`);
  assert.ok(report.loaf.count >= 0);

  console.log(printed);
  console.log(
    `\nvitals site ok: ${report.css.sheets} sheets, ${report.css.bytes} bytes, ${report.css.classes.length} classes, ` +
      `${report.css.unused.length} unused, ${report.css.layers.length} layers, LCP ${Math.round(report.lcp)} ms, ` +
      `${report.frames.history.length} frames sampled`,
  );
} finally {
  await browser.close();
  await server.close();
}
