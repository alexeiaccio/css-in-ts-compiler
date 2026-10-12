// The readable class of cssints({ devtools: true }) in Chrome (cssints-12tp): the dev server adds `cs-Landing-logo` to the
// class string of the cn() inside `function Landing()`, and the panel shows it first in the picked element's bar, and in
// the tag of the highlight, with the element's own label after it; the hashed classes are still listed by call.
// Needs dist/overlay.js (`bun run build`).
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
  root: join(here, "fixtures/names"),
  configFile: false,
  logLevel: "error",
  server: { port: 5297, strictPort: false },
  plugins: [cssints({ devtools: true })],
});
await server.listen();
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1000, height: 500 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(server.resolvedUrls.local[0]);

const classes = (await page.locator("#p").getAttribute("class")).split(" ");
assert.equal(classes.length, 3, classes.join(" "));
assert.deepEqual(
  classes.filter((c) => c.startsWith("cs-")),
  ["cs-Landing-logo"],
);

await page.locator("[data-devtools=toggle]").click();
await page.locator("[data-devtools=panel]").waitFor();
await until("the table", () => page.locator("text=hover an element").count());
await page.hover("#p");
await until("the tag", () => page.locator("[data-devtools=tag]").count());
assert.equal(await page.locator("[data-devtools=tag]").innerText(), "cs-Landing-logo p#p");
await page.click("#p");
await until("the inspection", () => page.locator("[data-devtools=classes]").count());

// first in the bar, the element's label after it
const bar = await page.locator("[data-devtools=bar]").innerText();
assert.match(bar, /^cs-Landing-logo\s+p#p/);
assert.equal(await page.locator("[data-devtools=name]").innerText(), "cs-Landing-logo");
assert.equal(await page.locator("[data-devtools=element]").innerText(), "p#p");
const [name, label] = await Promise.all(
  ["name", "element"].map((n) => page.locator(`[data-devtools=${n}]`).boundingBox()),
);
assert.ok(name.x < label.x, "the name is before the label");

// the hashed classes are listed by their call, the readable one is not a "not cssints" row
const rows = await page
  .locator("[data-devtools=classes] [data-class]")
  .evaluateAll((els) => els.map((e) => e.getAttribute("data-class")));
assert.equal(rows.length, 2, rows.join(" "));
assert.ok(rows.every((c) => c.startsWith("_")));
assert.ok(!(await page.locator("[data-devtools=classes]").innerText()).includes("not cssints"));

assert.deepEqual(errors, []);
await browser.close();
await server.close();
console.log(
  "devtools names: the readable class is first in the bar and the tag, the hashed ones by call",
);
process.exit(0);
