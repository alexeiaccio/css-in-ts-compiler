// @cssints/data in Chromium (playwright-core from node_modules/.bun; Chrome is the installed channel). One build of
// fixtures/main.mjs gives the sheet; a page mounts the three figures of the README, each with the values 12, 40 and 30.
// Steps:
//   max    the auto grid column is 40px, and the counter prints 40
//   sum    the hug-width flex row is 82px, and the counter prints 82
//   count  the row of 1px items is 3px, and the counter prints 3
//   unknown  no counter at all: nothing is printed
//   change one --value: 12 -> 100, so max prints 100, sum prints 170, count stays 3
// Chromium does not expose generated content (`::after { content: counter(out) }`) as text to script, so the page
// registers `--data-result` as an <integer>, which a host may do too: the test then reads the very integer that
// `counter-reset: out var(--data-result)` prints. The readers' widths show what layout computed.
// Run: node test/browsers.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// the exports' `development` condition: the plugin is src (dist is not built in the workspace)
process.env.NODE_ENV = "development";
const { default: cssints } = await import("cssints/vite");
const { build } = await import("vite");

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const out = await build({
  root: join(here, "fixtures"),
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  build: { write: false, minify: false, rollupOptions: { input: join(here, "fixtures/main.mjs") } },
});
const files = [out].flat().flatMap((o) => o.output);
const text = (ext) =>
  files
    .filter((f) => f.fileName.endsWith(ext))
    .map((f) => String(f.code ?? f.source))
    .join("\n");
const css = text(".css");

// the rig is the stylesheet, and the counter matches the three names only
assert.match(css, /\[data-data\] \{ display: inline-grid;/, css);
assert.match(
  css,
  /\[data-data="max"\] \[data-read\] output::after, \[data-data="sum"\] \[data-read\] output::after, \[data-data="count"\] \[data-read\] output::after \{ counter-reset: out var\(--data-result\); content: counter\(out\) \}/,
  css,
);
assert.ok(!/^ {2}\[data-read\] output::after/m.test(css), "no bare reader prints: " + css);

// `@property` is the host's, not the member's: without it `--data-result` computes to its token stream
const PROPERTY =
  '@property --data-result { syntax: "<integer>"; inherits: true; initial-value: 0 }';
const figure = (kind) => `
<figure data-data="${kind}">
  <ul aria-hidden="true">
    <li style="--value: 12"></li><li style="--value: 40"></li><li style="--value: 30"></li>
  </ul>
  <b data-read><output></output></b>
</figure>`;
const html =
  `<!doctype html><style>${PROPERTY}</style><link rel=stylesheet href=/app.css><body>` +
  figure("max") +
  figure("sum") +
  figure("count") +
  figure("median");

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.route("http://app.test/**", (route) => {
  const path = new URL(route.request().url()).pathname;
  const [body, contentType] = path === "/app.css" ? [css, "text/css"] : [html, "text/html"];
  return route.fulfill({ body, contentType });
});
await page.goto("http://app.test/");
const settle = () =>
  page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a frame or two, in the page
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
await settle();

// the integer the counter prints (registered, so computed) and the width layout gave the reader
const read = (kind) =>
  page.evaluate((kind) => {
    const figure = document.querySelector(`[data-data="${kind}"]`);
    const output = figure.querySelector("output");
    const reader = figure.querySelector("[data-read]");
    return {
      counter: getComputedStyle(output).getPropertyValue("--data-result").trim(),
      printed: Math.round(output.getBoundingClientRect().width),
      after: getComputedStyle(output, "::after").content,
      width: Math.round(reader.getBoundingClientRect().width),
    };
  }, kind);

const check = async (kind, expected) => {
  const got = await read(kind);
  assert.equal(got.counter, String(expected), `${kind}: the counter prints ${expected}`);
  assert.equal(got.width, expected, `${kind}: the reader is ${expected}px`);
  assert.ok(got.printed > 0, `${kind}: the counter is painted`);
  return got;
};

const max = await check("max", 40);
const sum = await check("sum", 82);
const count = await check("count", 3);
const unknown = await read("median");
assert.equal(unknown.after, "none", "an unknown data-data prints no counter");
assert.equal(unknown.printed, 0, "an unknown data-data prints nothing");

// one value per figure changes the answers: 12 -> 100
await page.evaluate(() => {
  for (const kind of ["max", "sum"])
    document.querySelector(`[data-data="${kind}"] li`).style.setProperty("--value", "100");
});
await settle();
await check("max", 100);
await check("sum", 170);
await check("count", 3);

await browser.close();
console.log(`max ${max.width}px, sum ${sum.width}px, count ${count.width}px, then ${100}/${170}/3`);
console.log("data browsers ok");
process.exit(0);
