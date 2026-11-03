// The site in Chrome (playwright-core from node_modules/.bun, the installed Chrome; not in `test`): the stories a registry
// item ships, the story ids that make a link a link, the controls a story declares, and the chrome — which is the kit itself.
//   - an item page draws its CSF story: the tablist is one tab per story, in the file's order, and `#button--accent` is the
//     same page reached by a link
//   - a control writes an arg and the story remounts: the disabled switch disables the preview's button
//   - a story that takes a count (tabs, accordion) still receives it after the change
//   - the theme switch is a data-mode scope, and the tint group moves every token of the page
//   node test/site.mjs
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
  // the dev server compiles the page (34 registry items, their sheets) on the first request: on a loaded machine that is
  // longer than Playwright's 30 s
  page.setDefaultTimeout(300_000);
  page.setDefaultNavigationTimeout(300_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) {
      errors.push(message.text());
    }
  });

  const preview = page.locator(".docs__preview");
  const nav = page.locator(".docs__nav");
  const slug = () => page.locator(".docs__story code").innerText();
  const hash = () => new URL(page.url()).hash;

  // An item page draws its first story (the namespace's alphabetical order, as Storybook lists them), and the tablist
  // lists every story of the file in that order.
  await page.goto(`${base}#button`);
  assert.equal(await page.getByRole("heading", { level: 1 }).innerText(), "Button");
  assert.equal(await slug(), "button--accent");
  assert.deepEqual(await page.getByRole("tab").allInnerTexts(), [
    "Accent",
    "As a link",
    "Default",
    "Disabled",
    "Quiet",
    "Sizes",
    "Toggle",
    "Tones",
  ]);
  assert.equal(await preview.getByRole("button", { name: "Publish" }).count(), 1);

  // A link with the story id is the same page: the tab, the canvas and the id agree.
  await page.goto(`${base}#button--accent`);
  assert.equal(await slug(), "button--accent");
  assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Accent");
  assert.equal(await preview.getByRole("button", { name: "Publish" }).count(), 1);

  // A select control writes an arg and the story remounts: the accent button loses its fill.
  const filled = await preview
    .getByRole("button", { name: "Publish" })
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const tone = page
    .locator(".docs__section", { hasText: "Controls" })
    .getByRole("combobox", { name: "tone" });
  await tone.click();
  await page.getByRole("option", { name: "quiet" }).click();
  assert.notEqual(
    await preview
      .getByRole("button", { name: "Publish" })
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    filled,
  );

  // A switch control: the panel's switch is the kit's own, the button in the canvas is the story's.
  const disabled = page
    .locator(".docs__section", { hasText: "Controls" })
    .getByRole("switch", { name: "disabled" });
  assert.equal(await disabled.getAttribute("aria-checked"), "false");
  await disabled.click();
  assert.equal(await disabled.getAttribute("aria-checked"), "true");
  assert.equal(
    await preview.getByRole("button", { name: "Publish" }).getAttribute("aria-disabled"),
    "true",
  );

  // Picking a tab writes the id into the hash, so the address bar is always a link to what is drawn.
  await page.getByRole("tab", { name: "Quiet" }).click();
  assert.equal(await slug(), "button--quiet");
  assert.equal(hash(), "#button--quiet");
  assert.equal(await preview.getByRole("button", { name: "Cancel" }).count(), 1);

  // A story whose arg the component reads once (a count) still gets it: the canvas is remounted, not patched.
  await page.goto(`${base}#tabs--three`);
  assert.equal(await slug(), "tabs--three");
  // the story switcher is a tablist of its own, so the example's tabs are named, not counted
  assert.equal(await preview.getByRole("tab", { name: "Members" }).count(), 0);
  const count = page
    .locator(".docs__section", { hasText: "Controls" })
    .getByRole("slider", { name: "count" });
  await count.focus();
  for (let press = 0; press < 2; press += 1) {
    await page.keyboard.press("ArrowRight");
  }
  assert.equal(await preview.getByRole("tab", { name: "Members" }).count(), 1);

  // The rest of the registry reads its own story files too: a composed one, the two the primitive drives, and one whose
  // props are a set.
  await page.goto(`${base}#card`);
  assert.equal(await preview.getByText("Monthly report").count(), 1);
  // a story's id, not the item's: `#treeview` is the first story alphabetically, `Collapsed`
  await page.goto(`${base}#treeview--files`);
  assert.equal(await preview.getByRole("treeitem").count(), 6);
  await page.goto(`${base}#select`);
  await preview.getByRole("combobox", { name: "Fruit" }).click();
  assert.equal(await page.getByRole("option").count(), 4);
  await page.keyboard.press("Escape");
  await page.goto(`${base}#checkbox-group`);
  assert.equal(await preview.getByRole("checkbox").count(), 4); // the parent box and the three channels
  await page.goto(`${base}#disclosure`);
  assert.equal(
    await preview
      .getByRole("button", { name: "Shipping, returns and refunds" })
      .getAttribute("aria-expanded"),
    "false",
  );

  // The data starters: a table of six rows under its header, and a list of ten thousand that keeps a window of them.
  await page.goto(`${base}#table--issues`);
  assert.equal(await preview.getByRole("row").count(), 7);
  await page.goto(`${base}#virtual-list--ten-thousand`);
  const windowed = await preview.locator("[data-part=virtual-list-item]").count();
  assert.ok(windowed > 0 && windowed < 40, `a window of rows, got ${windowed}`);

  // The chrome is the kit: the theme switch is a `data-mode` scope on the document, so every token moves with it.
  const mode = nav.getByRole("switch", { name: "dark" });
  const pageBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const before = await pageBg();
  await mode.click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.mode), "dark");
  assert.notEqual(await pageBg(), before);

  // ...and the tint group is a radio group, moving the two properties every scale token is computed from.
  await nav.getByRole("radio", { name: "red" }).click();
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--hue-tint").trim(),
    ),
    "27.0726",
  );

  assert.deepEqual(errors, []);
  console.log("site: stories, ids, controls, the theme switch and the tint group ok");
} finally {
  await browser.close();
  await server.close();
}
process.exit(0);
