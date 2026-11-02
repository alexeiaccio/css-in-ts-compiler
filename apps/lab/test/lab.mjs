// The lab in Chrome (playwright-core from node_modules/.bun, the installed Chrome; not in `test`): the lab holds the
// @cssints/reactive stories — the ones that are not a styled component of the registry — so this checks what a story of
// that package needs, in the dev server the lab is used in.
//   - one row per named export of every CSF file, by component; the meta's args and the story's are merged and reach the
//     story (which save form fails, which disclosure starts open)
//   - picking a row draws that story and writes the Storybook story id into the hash; a link with the id and the arrow keys
//     (roving tabindex, follows focus, no wrapping at the ends) move the selection
//   - the ARIA state the widgets announce is what the classes style: the selected row and the switch's track read tokens, in
//     light and in dark
//   - the reactive stories hold no JavaScript state and no handler: a click on the disclosure's button flips aria-expanded
//     and the panel's display, and the tabs' aria-selected is the tab's own binding
//   - the async boundary: a form's submit leaves CSS through emit(), the app's listen() does the fake save, and the sheet
//     paints pending, saved and failed from the data-pending / data-state attributes the app writes
//   - the overlay of @cssints/devtools picks the story's button and names the winner per property with the token it reads,
//     and the file the classes were written in — the reason a lab exists at all
//   node test/lab.mjs
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
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  // the dev server compiles the sheet on the first request: on a loaded machine that is longer than Playwright's 30 s
  page.setDefaultTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // the lab ships no favicon, so Chrome's own request for one is a 404 that is not the story's
  page.on(
    "console",
    (message) =>
      message.type() === "error" &&
      !message.location().url.endsWith("/favicon.ico") &&
      errors.push(message.text()),
  );
  await page.goto(base);

  const heading = () => page.getByRole("heading", { level: 1 }).innerText();
  const id = () => page.locator("header code").innerText();
  const options = page.getByRole("option");
  const row = (name) => options.filter({ hasText: name });
  const html = () => page.evaluate(() => document.documentElement.className);
  const htmlBg = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const rowBg = (name) => row(name).evaluate((el) => getComputedStyle(el).backgroundColor);
  const displayOf = (selector) =>
    page.locator(selector).evaluate((el) => getComputedStyle(el).display);
  const ariaSelected = (name) =>
    page.locator(`#reactive-tab-${name}`).getAttribute("aria-selected");
  const tabIndex = (name) => page.locator(`#reactive-tab-${name}`).getAttribute("tabindex");

  // One row per named export of every CSF file, by component; the exports of a module are alphabetical, as in Storybook.
  assert.deepEqual(await options.allInnerTexts(), [
    "CSS interactions/Disclosure · Closed",
    "CSS interactions/Disclosure · Open",
    "CSS interactions/Tabs · Computed",
    "CSS interactions/Save form · Failed",
    "CSS interactions/Save form · Saved",
  ]);
  // The first story is picked at boot, and the args of the meta and of the story reach the component.
  assert.equal(await heading(), "CSS interactions/Disclosure");
  assert.equal(await id(), "disclosure--closed");
  assert.equal(new URL(page.url()).hash, "");
  assert.equal(
    await row("CSS interactions/Disclosure · Closed").getAttribute("aria-selected"),
    "true",
  );
  // The style reads the attribute the listbox announced, not a second copy of the selection.
  assert.equal(await rowBg("CSS interactions/Disclosure · Closed"), "rgb(230, 235, 253)");

  // A link with a story id of another story of the same component: the widget settles the rest.
  await page.goto(`${base}#disclosure--open`);
  assert.equal(await id(), "disclosure--open");
  assert.equal(
    await row("CSS interactions/Disclosure · Open").getAttribute("aria-selected"),
    "true",
  );

  // The arrows are the listbox's, and the selection follows the focus (it stops at the ends: no wrapping).
  await page.goto(`${base}#disclosure--closed`);
  await row("CSS interactions/Disclosure · Closed").click();
  await page.keyboard.press("ArrowUp");
  assert.equal(await id(), "disclosure--closed");
  await page.keyboard.press("ArrowDown");
  assert.equal(await id(), "disclosure--open");
  await page.keyboard.press("ArrowDown");
  assert.equal(await id(), "reactive-tabs--computed");
  await page.keyboard.press("ArrowDown");
  assert.equal(await id(), "save-form--failed");
  await page.keyboard.press("ArrowDown");
  assert.equal(await id(), "save-form--saved");
  assert.equal(new URL(page.url()).hash, "#save-form--saved");
  await page.keyboard.press("ArrowDown");
  assert.equal(await id(), "save-form--saved");

  // @cssints/reactive: no JavaScript state and no handler in the story. The package's runtime writes the owner's
  // attribute and its bindings on load (a MutationObserver sees the nodes Solid mounts), so a binding can land a frame
  // after the render: wait for the binding, then read the condition it drives.
  await page.goto(`${base}#disclosure--closed`);
  assert.equal(await id(), "disclosure--closed");
  const disclosure = page.locator("#disclosure-closed-btn");
  await page.locator("#disclosure-closed-btn[aria-expanded=false]").waitFor();
  assert.equal(await displayOf("#disclosure-closed-panel"), "none");
  await disclosure.click();
  assert.equal(await disclosure.getAttribute("aria-expanded"), "true");
  assert.equal(await displayOf("#disclosure-closed-panel"), "block");
  await disclosure.click();
  assert.equal(await disclosure.getAttribute("aria-expanded"), "false");
  assert.equal(await displayOf("#disclosure-closed-panel"), "none");

  // an owner whose state starts true: the runtime writes it on load, with no click
  await page.goto(`${base}#disclosure--open`);
  await page.locator("#disclosure-open-btn[aria-expanded=true]").waitFor();
  assert.equal(await displayOf("#disclosure-open-panel"), "block");

  // the tabs: one string state, three comparisons; a click writes the state and the runtime derives aria-selected, the
  // literal aria-controls and the roving tabindex in one flush
  await page.goto(`${base}#reactive-tabs--computed`);
  assert.equal(await id(), "reactive-tabs--computed");
  await page.locator("#reactive-tab-one[aria-selected=true]").waitFor();
  assert.deepEqual(
    [await ariaSelected("one"), await ariaSelected("two"), await ariaSelected("three")],
    ["true", "false", "false"],
  );
  assert.deepEqual(
    [await tabIndex("one"), await tabIndex("two"), await tabIndex("three")],
    ["0", "-1", "-1"],
  );
  assert.equal(
    await page.locator("#reactive-tab-one").getAttribute("aria-controls"),
    "reactive-panel-one",
  );
  assert.deepEqual(
    [
      await displayOf("#reactive-panel-one"),
      await displayOf("#reactive-panel-two"),
      await displayOf("#reactive-panel-three"),
    ],
    ["block", "none", "none"],
  );
  await page.locator("#reactive-tab-two").click();
  assert.deepEqual(
    [await ariaSelected("one"), await ariaSelected("two"), await ariaSelected("three")],
    ["false", "true", "false"],
  );
  assert.deepEqual(
    [await tabIndex("one"), await tabIndex("two"), await tabIndex("three")],
    ["-1", "0", "-1"],
  );
  assert.deepEqual(
    [
      await displayOf("#reactive-panel-one"),
      await displayOf("#reactive-panel-two"),
      await displayOf("#reactive-panel-three"),
    ],
    ["none", "block", "none"],
  );

  // The async boundary: a submit leaves the CSS world through emit(), the app does the fake save and writes data-pending
  // and data-state, and the sheet paints pending, saved and failed from those attributes and nothing else. The hand-off is
  // counted in the page: exactly one reactive:save per submit.
  await page.goto(`${base}#save-form--saved`);
  assert.equal(await id(), "save-form--saved");
  await page.locator("#save-form[data-reactive-idle=true]").waitFor();
  const saveForm = page.locator("#save-form");
  const saveButton = page.locator("#save-submit");
  const handOffs = () => page.evaluate(() => window.saveEvents);
  await page.evaluate(() => {
    window.saveEvents = 0;
    document
      .getElementById("save-form")
      .addEventListener("reactive:save", () => (window.saveEvents += 1));
  });
  await saveButton.click();
  // pending is the app's, written before the await: the marker on the form, the button's own report, and the look
  assert.equal(await saveForm.getAttribute("data-pending"), "true");
  assert.equal(await saveButton.getAttribute("aria-busy"), "true");
  assert.notEqual(await displayOf("#save-spinner"), "none");
  assert.equal(
    await page.locator("#save-spinner").evaluate((el) => el.getAnimations().length > 0),
    true,
  );
  // the disabled look is the border token, read off the form's own border rather than written twice
  assert.equal(
    await saveButton.evaluate((el) => getComputedStyle(el).backgroundColor),
    await saveForm.evaluate((el) => getComputedStyle(el).borderTopColor),
  );
  assert.deepEqual(
    [await displayOf("#save-saved"), await displayOf("#save-failed")],
    ["none", "none"],
  );
  // after the fake save: pending cleared, the outcome in data-state, and the message painted from it
  await page.locator("#save-form[data-state=saved]").waitFor();
  assert.equal(await saveForm.getAttribute("data-pending"), null);
  assert.equal(await saveButton.getAttribute("aria-busy"), "false");
  assert.equal(await displayOf("#save-spinner"), "none");
  assert.deepEqual(
    [await displayOf("#save-saved"), await displayOf("#save-failed")],
    ["block", "none"],
  );
  assert.equal(await handOffs(), 1);

  // the failing variant: the same attributes, the other message, and the form submits again — one hand-off each
  await page.goto(`${base}#save-form--failed`);
  assert.equal(await id(), "save-form--failed");
  await page.locator("#save-form[data-reactive-idle=true]").waitFor();
  await page.evaluate(() => {
    window.saveEvents = 0;
    document
      .getElementById("save-form")
      .addEventListener("reactive:save", () => (window.saveEvents += 1));
  });
  await saveButton.click();
  assert.equal(await saveForm.getAttribute("data-pending"), "true");
  await page.locator("#save-form[data-state=failed]").waitFor();
  assert.equal(await saveForm.getAttribute("data-pending"), null);
  assert.deepEqual(
    [await displayOf("#save-saved"), await displayOf("#save-failed")],
    ["none", "block"],
  );
  assert.equal(await handOffs(), 1);
  await saveButton.click();
  assert.equal(await saveForm.getAttribute("data-pending"), "true");
  assert.equal(await saveForm.getAttribute("data-state"), null);
  await page.locator("#save-form[data-state=failed]").waitFor();
  assert.deepEqual(
    [await displayOf("#save-saved"), await displayOf("#save-failed")],
    ["none", "block"],
  );
  assert.equal(await handOffs(), 2);

  // The overlay picks the story's button: the properties table names the winner and the token it reads, and the classes by
  // the call that wrote them, in the story's file.
  await page.goto(`${base}#save-form--saved`);
  await page.locator("[data-devtools=toggle]").click();
  await page.locator("[data-devtools=panel]").waitFor();
  if ((await page.locator("[data-devtools=pick]").getAttribute("data-on")) === "no") {
    await page.locator("[data-devtools=pick]").click();
  }
  const box = await saveButton.boundingBox();
  // the middle of the top edge: the element itself, not a child of it
  await page.hover("#save-submit", { position: { x: box.width / 2, y: 2 } });
  await page.click("#save-submit", { position: { x: box.width / 2, y: 2 } });
  const property = (name) =>
    page.locator(`[data-devtools=properties] [data-prop="${name}"]`).evaluate((el) => ({
      status: el.dataset.status,
      winner: el.querySelector("[data-winner]")?.dataset.winner,
      computed: el.querySelector("[data-computed]")?.dataset.computed,
      text: el.innerText.replaceAll("\n", " | "),
    }));
  const paint = await property("background-color");
  assert.equal(paint.status, "ok", paint.text);
  assert.match(paint.text, /var\(--color-accent\)/); // the token, through the sheet
  assert.equal(
    paint.computed,
    await saveButton.evaluate((el) => getComputedStyle(el).backgroundColor),
  );
  assert.match((await property("padding")).text, /10px 16px/);
  assert.ok(paint.winner?.startsWith("._"));
  const sites = await page
    .locator("[data-site]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-site")));
  assert.ok(sites.length > 0, "the overlay names the file the classes were written in");
  // the site of the button's own cn() call: the story file, at a line
  assert.ok(
    sites.some((site) => site.startsWith("src/stories/save-form.stories.tsx:")),
    `a site in the story file: ${sites.join(", ")}`,
  );

  // The switch writes the mode class, and every token of the theme follows it.
  assert.equal(await page.getByRole("switch").getAttribute("aria-checked"), "false");
  assert.equal(await htmlBg(), "rgb(255, 255, 255)");
  await page.getByRole("switch").click();
  // the knob moves on a transform transition: wait for it, then read it settled
  await page
    .getByRole("switch")
    .locator("span")
    .evaluate(async (knob) => {
      await Promise.all(knob.getAnimations().map((animation) => animation.finished));
    });
  assert.equal(await page.getByRole("switch").getAttribute("aria-checked"), "true");
  assert.equal(await html(), "dark");
  assert.equal(await htmlBg(), "rgb(15, 17, 21)");
  assert.equal(await rowBg("CSS interactions/Save form · Saved"), "rgb(35, 42, 69)");

  assert.deepEqual(errors, []);
  console.log("lab: rail, canvas, story ids, overlay, arrow keys and the switch's theme ok");
} finally {
  await browser.close();
  await server.close();
}
process.exit(0);
