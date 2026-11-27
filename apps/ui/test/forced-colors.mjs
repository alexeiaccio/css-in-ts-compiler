// The kit under the platform's forced colours (playwright-core, the installed Chrome; not in `test`): a button, a tabs strip
// and a field, read in the mode Windows high contrast uses. The theme maps every token to a system colour
// (`forcedColorsTheme`), and the UA then throws away what it cannot map: a background, a box-shadow and a background-image
// all collapse to one system colour. What a colour can no longer carry has to survive another way, and that is what this
// test holds: a control keeps a boundary, and a selected tab keeps a thicker underline than an unselected one.
//   node test/forced-colors.mjs
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
const browser = await chromium
  .launch({ channel: "chrome" })
  .catch(() => chromium.launch({ channel: undefined }));

/**
 * The paint of one element, as the browser resolved it.
 *
 * @param {import("playwright-core").Page} page the page
 * @param {string} selector the element
 * @returns {Promise<object | undefined>} the colours, the borders and the shadow
 */
const paint = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el === null) return undefined;
    const style = getComputedStyle(el);
    return {
      color: style.color,
      background: style.backgroundColor,
      borderTop: `${style.borderTopWidth} ${style.borderTopStyle}`,
      borderBottomWidth: Number.parseFloat(style.borderBottomWidth),
      borderBottomStyle: style.borderBottomStyle,
      image: style.backgroundImage,
      shadow: style.boxShadow,
    };
  }, selector);

/**
 * Every tabs strip on the page, as the selected tab versus the rest. The story renders more than one.
 *
 * @param {import("playwright-core").Page} page the page
 * @returns {Promise<Array<object>>} one entry per strip
 */
const tabs = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[role="tablist"]')].map((list) => {
      const read = (tab) => {
        const style = getComputedStyle(tab);
        return {
          selected: tab.getAttribute("aria-selected") === "true",
          color: style.color,
          background: style.backgroundColor,
          underlineWidth: Number.parseFloat(style.borderBottomWidth),
          underlineStyle: style.borderBottomStyle,
          weight: style.fontWeight,
        };
      };
      const all = [...list.querySelectorAll('[role="tab"]')].map(read);
      return {
        all: all.length,
        selected: all.filter((tab) => tab.selected),
        rest: all.filter((tab) => !tab.selected),
      };
    }),
  );

try {
  const page = await browser.newPage({ viewport: { width: 1300, height: 1000 } });
  page.setDefaultTimeout(300_000);
  page.setDefaultNavigationTimeout(300_000);

  const open = async (hash, selector) => {
    await page.goto(`${base}${hash}`);
    await page.waitForFunction((sel) => document.querySelector(sel) !== null, selector);
  };

  // the same reads, before the emulation: what a colour change is proved against
  await open("#button", '[data-part="button"]');
  const lightButton = await paint(page, '[data-part="button"]');

  await page.emulateMedia({ forcedColors: "active" });
  assert.equal(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    true,
    "the emulation is on for the page",
  );

  // a button: its fill is gone, and the boundary it keeps is the only thing that separates it from the page
  await open("#button", '[data-part="button"]');
  const button = await paint(page, '[data-part="button"]');
  assert.notEqual(
    button?.color,
    lightButton?.color,
    "the theme's text colour is replaced by a system colour",
  );
  assert.equal(button?.shadow, "none", "a box-shadow does not survive forced colours");
  assert.notEqual(button?.borderTop, "0px none", `the button has a boundary: ${button?.borderTop}`);
  assert.equal(
    button?.borderTop.split(" ")[1],
    "solid",
    `the boundary is a real border, not a paint that the mode removes: ${button?.borderTop}`,
  );

  // tabs: every colour is the same, so the selected tab must still read as one
  await open("#tabs", '[role="tab"]');
  const strips = await tabs(page);
  assert.ok(strips.length > 0, "the page has a tab strip");
  for (const [index, strip] of strips.entries()) {
    assert.equal(strip.selected.length, 1, `strip ${index}: one tab is selected`);
    const selectedUnderline = strip.selected[0]?.underlineWidth ?? 0;
    const restUnderline = Math.max(...strip.rest.map((tab) => tab.underlineWidth), 0);
    assert.equal(
      strip.selected[0]?.color,
      strip.rest[0]?.color,
      `strip ${index}: the mode takes the selected tab's colour with the rest`,
    );
    assert.ok(
      selectedUnderline > restUnderline,
      `strip ${index}: the selected tab keeps a thicker underline: ${selectedUnderline} vs ${restUnderline}`,
    );
    assert.ok(
      restUnderline >= 1,
      `strip ${index}: an unselected tab shows the rule: ${restUnderline}`,
    );
  }

  // a field: the control is still a control — a boundary, a system background and a system text
  await open("#field", "input, textarea, select");
  const field = await paint(page, "input, textarea, select");
  assert.notEqual(field?.borderTop, "0px none", `the input has a boundary: ${field?.borderTop}`);
  assert.equal(field?.borderTop.split(" ")[1], "solid", "the input's boundary is a border");
  assert.notEqual(field?.background, "rgba(0, 0, 0, 0)", "the input paints its own surface");
  assert.equal(field?.shadow, "none", "no shadow survives");

  console.log(
    "forced colours ok: a button and a field keep a solid boundary, and the selected tab keeps the thicker underline",
  );
} finally {
  await browser.close();
  await server.close();
}
