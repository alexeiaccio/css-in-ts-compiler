// The token fallbacks in a browser that cannot parse oklch() or relative colour (cssints-33pa; not in `test`, needs an old
// browser). The app is built with its default targets (BROWSERSLIST unset: chrome 109 is among them), then
//   - an old browser (default: Chromium 109 of Playwright 1.29) shows the default theme in real colours: the page
//     background, the text, the four accent steps and the brand mark are rgb() colours, not transparent or initial, in a
//     light and in a dark scheme, and the hue slider moves nothing (it sets --hue-accent, which no value of that
//     browser reads)
//   - Chrome (the installed channel, 154) still gets the live colours: the steps are oklch() at the hue of the
//     slider, and the slider moves them
// An old browser comes from the playwright-core of its own release, installed outside the repo (nothing goes in package.json):
//   S=$PWD/node_modules/.old-browsers; mkdir -p $S/browsers $S/pw-1.29.2 && cd $S/pw-1.29.2 && npm init -y && npm i playwright-core@1.29.2
//   PLAYWRIGHT_BROWSERS_PATH=$S/browsers node node_modules/playwright-core/cli.js install chromium   # 109.0.5414.46, build 1041
//   (the mirror playwright-akamai.azureedge.net serves it when azureedge.net answers 400)
//   node test/old-browser.mjs                       # Chromium 109
//   OLD_PW=$S/pw-1.46.1/node_modules/playwright-core/index.mjs BROWSER=firefox node test/old-browser.mjs   # Firefox 128, installed the same way
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { build, preview } from "vite";

import { hueOf } from "../src/settings.ts";

const root = join(import.meta.dirname, "..");
process.chdir(root);
delete process.env.BROWSERSLIST;
const scratch = join(root, "../../node_modules/.old-browsers");
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(scratch, "browsers");
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const load = (file) => import(pathToFileURL(file).href);
const kind = process.env.BROWSER ?? "chromium";
const old = await load(
  process.env.OLD_PW ?? join(scratch, "pw-1.29.2/node_modules/playwright-core/index.mjs"),
);
const { chromium } = await load(join(modules, pw, "node_modules/playwright-core/index.mjs"));

const outDir = "node_modules/.sky-old-browser";
const config = { root, logLevel: "warn", build: { outDir, emptyOutDir: true } };
await build(config);
const server = await preview({ ...config, preview: { port: 0 } });
const base = server.resolvedUrls.local[0];

const NAMES = ["accent", "hover", "strong", "soft"];
const read = async (browser, scheme) => {
  const page = await (
    await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme })
  ).newPage();
  await page.goto(`${base}settings`);
  const steps = () =>
    Promise.all(
      NAMES.map((n) =>
        page.getByTestId(`swatch-${n}`).evaluate((el) => getComputedStyle(el).backgroundColor),
      ),
    );
  const colours = async () => ({
    bg: await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
    text: await page.evaluate(() => getComputedStyle(document.body).color),
    steps: await steps(),
    brand: await page
      .locator("a:visible", { hasText: /^sky$/ })
      .evaluate((el) => getComputedStyle(el).color),
  });
  const before = await colours();
  await page.locator('input[aria-label="Accent hue"]').fill("90"); // getByLabel ignores aria-label before Playwright 1.30
  return { before, after: await colours(), page };
};

const real = (c) => /^rgba?\(\d+, \d+, \d+(, (0?\.\d+|1))?\)$/.test(c) && c !== "rgba(0, 0, 0, 0)";

const results = [];
const oldBrowser = await old[kind].launch();
try {
  const version = oldBrowser.version();
  for (const [scheme, bg, text] of [
    ["light", "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
    ["dark", "rgb(0, 0, 0)", "rgb(255, 255, 255)"],
  ]) {
    const { before, after, page } = await read(oldBrowser, scheme);
    const label = `${kind} ${version}, ${scheme}`;
    assert.equal(
      await page.evaluate(() => CSS.supports("color", "oklch(0.6 0.2 345)")),
      false,
      `${label} must lack oklch(): it is not an old browser`,
    );
    assert.equal(before.bg, bg, label);
    assert.equal(before.text, text, label);
    for (const c of [...before.steps, before.brand]) assert.ok(real(c), `${label}: ${c}`);
    assert.equal(before.steps[0], "rgb(219, 74, 167)", `${label}: the accent is Mu pink`);
    assert.deepEqual(after, before, `${label}: the hue slider moved something`);
    results.push(`${label}: bg ${before.bg}, text ${before.text}, steps ${before.steps.join(" ")}`);
  }
} finally {
  await oldBrowser.close();
}

const chrome = await chromium.launch({ channel: "chrome" });
try {
  const hueOfColour = (c) => Number(/oklch\([\d.]+ [\d.]+ ([\d.]+)/.exec(c)?.[1]);
  const { before, after } = await read(chrome, "light");
  const version = chrome.version();
  for (const c of before.steps) assert.equal(hueOfColour(c), 345, `chrome ${version}: ${c}`);
  for (const c of after.steps) assert.equal(hueOfColour(c), hueOf(90), `chrome ${version}: ${c}`);
  results.push(`chrome ${version}: steps ${before.steps[0]} -> ${after.steps[0]} with the slider`);
} finally {
  await chrome.close();
  await server.close();
}
console.log(results.join("\n"));
console.log("sky old browser: default theme in real colours, no slider; Chrome stays live");
