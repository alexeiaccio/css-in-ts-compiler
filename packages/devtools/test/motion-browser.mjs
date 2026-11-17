// The motion controls in Chrome: the panel lists what the page is running (a CSS animation and a CSS transition), the slow
// motion toggle puts every running animation at 0.25 and back to 1, and the reduced motion preview finishes them — what a
// reader with `prefers-reduced-motion: reduce` sees. Needs dist/overlay.js (`bun run build`).
//   node test/motion-browser.mjs                  the checks
//   SHOT=/tmp/panel.png node test/motion-browser.mjs   the same, and a screenshot of the panel
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import cssints from "cssints/vite";
import { createServer } from "vite";

const here = import.meta.dirname;
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const until = async (what, check, ms = 8000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const last = await check();
    if (last) return last;
    await sleep(100);
  }
  throw new Error(`timed out: ${what}`);
};

const server = await createServer({
  root: join(here, "fixtures/motion"),
  configFile: false,
  logLevel: "error",
  server: { port: 5298, strictPort: false },
  plugins: [cssints({ devtools: true })],
});
await server.listen();
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(server.resolvedUrls.local[0]);

await page.locator("[data-devtools=toggle]").click();
await page.locator("[data-devtools=panel]").waitFor();
await until("the table", () => page.locator("text=hover an element").count());

// pick the element the panel inspects, so the shot has the panel in its ordinary state with the motion list under it: an
// opened panel is already picking
await page.locator("#p").click();
await until("the inspection", () => page.locator("[data-devtools=classes]").count());

// a CSS transition beside the page's CSS animation: the panel must list both, transitions included
await page.evaluate(() => {
  const pulse = document.getElementById("pulse");
  if (pulse) pulse.style.opacity = "0.2";
});

const row = (name) => page.locator(`[data-devtools=motion] [data-motion="${name}"]`);
await until("the CSS animation in the list", () => row("pulse").count());
await until("the CSS transition in the list", () => row("opacity").count());

const pulse = await row("pulse").innerText();
// the animated property names, the duration and easing, the name it comes from CSS with, and its play state: a list
assert.match(pulse, /transform/, pulse);
assert.match(pulse, /3000ms ease-in-out/, pulse);
assert.match(pulse, /pulse · running/, pulse);
const opacity = await row("opacity").innerText();
assert.match(opacity, /opacity/, opacity);
assert.match(opacity, /1000ms linear/, opacity);
assert.match(opacity, /opacity · running/, opacity);

const rates = () => page.evaluate(() => document.getAnimations().map((a) => a.playbackRate));
const slow = page.locator("[data-devtools=motion-slow]");
assert.equal(await slow.getAttribute("data-on"), "no");

await slow.click();
assert.equal(await slow.getAttribute("aria-pressed"), "true");
// the toggle sets the rate now; the panel's 600 ms read keeps it on whatever starts later
await until("every animation at a quarter speed", async () => {
  const seen = await rates();
  return seen.length > 0 && seen.every((rate) => rate === 0.25);
});

await slow.click();
assert.equal(await slow.getAttribute("aria-pressed"), "false");
await until("every animation back at full speed", async () => {
  const seen = await rates();
  return seen.length > 0 && seen.every((rate) => rate === 1);
});

// the panel keeps its list on the readout's timer, so a screenshot taken now has the rows in it
await page.evaluate(() => {
  const pulse = document.getElementById("pulse");
  if (pulse) pulse.style.opacity = "1";
});
await until("the transition back", () => row("opacity").count());
if (process.env.SHOT) {
  await page.locator("[data-devtools=body]").evaluate((body) => {
    body.scrollTop = body.scrollHeight;
  });
  await page.locator("[data-devtools=panel]").screenshot({ path: process.env.SHOT });
}

await page.locator("[data-devtools=motion-reduced]").click();
// finished animations leave the page's set: what is left is nothing, and the readout says so on its next read
await until("no animation running", async () => (await rates()).length === 0);
await until("the readout emptied", () =>
  page.locator("[data-devtools=motion] [data-motion=none]").count(),
);
// a CSS animation keeps no fill, so finished is the box on its own style — no half-way frame left painted
assert.equal(
  await page.evaluate(() => getComputedStyle(document.getElementById("pulse")).transform),
  "none",
);

assert.deepEqual(errors, []);
await browser.close();
await server.close();
console.log("motion: ok");
