// The kit's combinations in Chromium, on the dev server (the plugin evaluates sites there; vitest's browser mode cannot — see
// docs/wayfinder.md, "vitest browser mode and the evaluation"): a card hands its radius to a card inside it, a card follows
// the mode it sits in, a container sizes the buttons it holds, `render` replaces a part and keeps its props and state live,
// a field gives its control the ids and the ARIA state, and the site's pages render what the registry says they ship.
//   node test/combos.mjs
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.setDefaultTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}testing.html`);

  const styles = (target, names) =>
    target.evaluate((element, properties) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(properties.map((name) => [name, style.getPropertyValue(name)]));
    }, names);
  const attr = (target, name) => target.getAttribute(name);
  const button = (name) => page.getByRole("button", { name, exact: true });

  // frame(): the inner radius is the outer's inner radius (16 - padding 12 - border 1) less its own margin (none), through
  // the wrapper element between them.
  const cards = await page
    .locator('[data-case="nesting"] [data-part="card"]')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return [style.borderRadius, style.padding];
      }),
    );
  assert.deepEqual(cards[0], ["16px", "12px"]);
  assert.deepEqual(cards[1], ["3px", "12px"]);

  // surface() + the mode: the same card in a data-mode="dark" scope is another colour and another text colour, no prop.
  const light = await styles(page.locator('[data-case="mode"] > [data-part="card"]'), [
    "background-color",
    "color",
  ]);
  const dark = await styles(
    page.locator('[data-case="mode"] [data-mode="dark"] [data-part="card"]'),
    ["background-color", "color"],
  );
  assert.notEqual(light["background-color"], dark["background-color"]);
  assert.notEqual(light["color"], dark["color"]);

  // The container is the context: data-size="sm" shrinks what it holds; a variant still picks the tone.
  const plain = await styles(button("Default"), [
    "padding-top",
    "padding-left",
    "font-size",
    "background-color",
  ]);
  const compact = await styles(button("Compact"), ["padding-top", "padding-left", "font-size"]);
  const accent = await styles(button("Accent"), ["background-color"]);
  assert.equal(plain["padding-top"], "8px");
  assert.equal(plain["padding-left"], "16px");
  assert.equal(plain["font-size"], "14px");
  assert.deepEqual(compact, { "padding-top": "4px", "padding-left": "8px", "font-size": "12px" });
  assert.notEqual(accent["background-color"], plain["background-color"]);

  // render: the props the part owns reach a tag it did not write, and the state accessor stays live across a click.
  // the button's own props carry `role="button"`, so the anchor is a button to ARIA: the caller replaces the element, not the
  // semantics the widget owns
  const link = page.locator('[data-case="renders"] a');
  assert.equal(await attr(link, "aria-pressed"), "true");
  assert.equal(await attr(link, "data-part"), "button");
  const live = page.locator("[data-live]");
  assert.equal(await attr(live, "data-live"), "pressed");
  await live.click();
  assert.equal(await attr(live, "aria-pressed"), "false");
  assert.equal(await attr(live, "data-live"), "idle");
  assert.equal(
    await attr(page.locator('[data-case="renders"] header'), "data-part"),
    "card-header",
  );

  // The field owns its control's id, described-by ids and invalid state; the invalid border is the theme's, not the resting one.
  const email = page.locator('[id="email-control"]');
  assert.equal(await attr(email, "aria-invalid"), "true");
  assert.equal(await attr(email, "aria-describedby"), "email-hint email-error");
  assert.equal(
    await attr(page.locator('label[data-part="label"][for="email-control"]'), "id"),
    "email-label",
  );
  assert.equal(
    await page.locator('[data-case="fields"] [data-part="hint"]').innerText(),
    "We never share it",
  );
  assert.equal(
    await attr(page.locator('[data-case="fields"] [data-part="error"]'), "role"),
    "alert",
  );
  const invalid = await styles(email, ["border-top-color"]);
  const resting = await styles(page.locator('[id="plain-control"]'), ["border-top-color"]);
  assert.notEqual(invalid["border-top-color"], resting["border-top-color"]);

  // A control that is not an Input: the field hands its ids and ARIA to the caller's element.
  const pick = page.locator('[id="pick-control"]');
  assert.equal(await attr(pick, "data-part"), "textarea");
  assert.equal(await attr(pick, "aria-invalid"), "true");

  // The site's pages for the styled components, from the registry build: a page renders the demo and lists the source a copy gets.
  for (const [name, title] of [
    ["button", "Button"],
    ["card", "Card"],
    ["field", "Field"],
    ["input", "Input"],
  ]) {
    await page.goto(`${base}#${name}`);
    assert.equal(await page.locator("h1").innerText(), title);
    assert.ok((await page.locator("[data-part]").count()) > 0, `${name}: the demo renders a part`);
    assert.ok(
      (await page.locator("body").innerText()).includes(`${name}.tsx`),
      `${name}: the page lists ${name}.tsx among the files`,
    );
  }

  assert.deepEqual(errors, []);
  console.log(
    `ui combos ok: radius ${cards[0][0]}/${cards[1][0]}, compact ${compact["padding-left"]}, invalid ${invalid["border-top-color"]}`,
  );
} finally {
  await browser.close();
  await server.close();
}
process.exit(0);
