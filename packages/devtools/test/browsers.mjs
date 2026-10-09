// The overlay on apps/demo's dev server (cssints({ devtools: true })) in Chrome, Firefox and WebKit, through playwright-core:
// open it, pick elements, and check that the panel's winner is what the browser computes, on the hard cases of
// docs/research/devtools.md (the demo's Showcase and components/Inspect.tsx). Needs dist/overlay.js (`bun run build`).
//   node test/browsers.mjs            all three        BROWSERS=chrome node test/browsers.mjs   some
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

const here = import.meta.dirname;
const demo = join(here, "../../../apps/demo");
const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium, firefox, webkit } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const launchers = {
  chrome: () => chromium.launch({ channel: "chrome" }),
  firefox: () => firefox.launch(),
  webkit: () => webkit.launch(),
};
const names = (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",");

// the demo reads @iconify-json/mdi from the working directory
process.chdir(demo);
const server = await createServer({
  root: demo,
  configFile: join(demo, "vite.config.ts"),
  logLevel: "error",
  server: { port: 5291, strictPort: false },
});
await server.listen();
const url = server.resolvedUrls.local[0];

const until = async (what, check, ms = 8000) => {
  const end = Date.now() + ms;
  let last;
  while (Date.now() < end) {
    last = await check();
    if (last) return last;
    await sleep(100);
  }
  throw new Error(`timed out: ${what}`);
};

const run = async (name) => {
  const browser = await launchers[name]();
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.locator("[data-devtools=toggle]").click();
  await page.locator("[data-devtools=panel]").waitFor();
  await until("the table", () => page.locator("text=hover an element").count());

  const pick = async (selector) => {
    if ((await page.locator("[data-devtools=pick]").getAttribute("data-on")) === "no")
      await page.locator("[data-devtools=pick]").click();
    await page.locator(selector).scrollIntoViewIfNeeded();
    // the middle of the top edge, so that the element is the target and not a child of it (or its parent, at a round corner)
    const box = await page.locator(selector).boundingBox();
    const position = { x: box.width / 2, y: 2 };
    await page.hover(selector, { position });
    await page.click(selector, { position });
  };
  const read = (prop) =>
    page.locator(`[data-devtools=properties] [data-prop="${prop}"]`).evaluate((el) => ({
      status: el.dataset.status,
      value: el.querySelector("[data-value]")?.dataset.value,
      winner: el.querySelector("[data-winner]")?.dataset.winner,
      computed: el.querySelector("[data-computed]")?.dataset.computed,
      text: el.innerText,
    }));
  const computed = (selector, prop) =>
    page.locator(selector).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
  // the row of `prop` once its winner is `winner` (the panel re-inspects every 600 ms)
  const settle = (prop, test) =>
    until(`${name}: ${prop}`, async () => {
      const r = (await page.locator(`[data-prop="${prop}"]`).count())
        ? await read(prop)
        : undefined;
      return r && test(r) ? r : undefined;
    });

  // hover and a media query in one layer, hovered at 1300 px: the hover wins by specificity, as the browser paints it
  const hm = '[data-case="hover-md"]';
  await pick(hm);
  let r = await settle("color", (x) => x.winner?.endsWith(":hover"));
  assert.equal(r.status, "ok", `${name} hover-md: ${r.text}`);
  assert.equal(r.computed, await computed(hm, "color"));
  assert.equal(await computed(hm, "color"), "rgb(220, 38, 38)");
  const sites = await page
    .locator("[data-site]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-site")));
  assert.match(sites.join(), /^src\/components\/Inspect\.tsx:\d+$/);
  // the pointer leaves: the query wins, the hover is listed as not applying now
  await page.mouse.move(1200, 880);
  r = await settle("color", (x) => x.winner && !x.winner.endsWith(":hover"));
  assert.equal(r.status, "ok", r.text);
  assert.equal(r.computed, "rgb(37, 99, 235)");
  assert.match(r.text, /color: #dc2626 .*:hover/s);

  // the Showcase's action button: hover in _.b, hover inside lg in _.c
  const action = '[data-demo="pseudo"] button >> nth=0';
  await pick(action);
  r = await settle(
    "background-color",
    (x) => x.winner?.endsWith(":hover") && x.text.includes("60rem"),
  );
  assert.equal(r.status, "ok", r.text);
  assert.equal(r.computed, await computed(action, "background-color"));

  // @container: the same class in a narrow and a wide box
  await pick('[data-box="narrow"] p');
  r = await settle("background-color", (x) => x.value === "#fee2e2");
  assert.equal(r.status, "ok", r.text);
  await pick('[data-box="wide"] p');
  r = await settle("background-color", (x) => x.value === "#dbeafe");
  assert.equal(r.status, "ok", r.text);
  assert.match(r.text, /#fee2e2.*@container card \(width < 24rem\)/s, "listed, not applying");

  // @supports
  await pick('[data-demo="supports"]');
  r = await settle("font-weight", (x) => x.value === "700");
  assert.equal(r.status, "ok", r.text);

  // a kernel in _.k: frame()'s padding reads the custom property its member class sets in _.a
  await pick('[data-demo="frame"]');
  r = await settle("padding", (x) => x.winner === "._frame-core");
  assert.equal(r.status, "ok", r.text);
  assert.match(r.text, /_\.k/);
  r = await settle("--frame-p", (x) => !!x.winner);
  assert.equal(r.value, "1rem");
  assert.ok(await page.locator("text=marker of kernel frame.core").count());

  // within(): the row is hovered while the pointer is on the span
  const w = '[data-case="within"]';
  await pick(w);
  r = await settle("text-decoration", (x) => x.winner?.startsWith(":where(._g:hover)"));
  assert.equal(r.status, "ok", r.text);
  assert.match(await computed(w, "text-decoration-line"), /underline/);

  // the arrow keys walk the tree: up is the group
  await page.keyboard.press("ArrowUp");
  await until("ArrowUp", async () =>
    (await page.locator("[data-devtools=element]").textContent()).includes('data-case="group"'),
  );

  // an unlayered rule of the user beats the class: a mismatch, with the reason
  const u = '[data-case="unlayered"]';
  await pick(u);
  r = await settle("color", (x) => x.status === "mismatch");
  assert.match(
    r.text,
    /\.mine \{ color: rgb\(22,? 163,? 74\) \} in src\/components\/inspect\.css .*outside every layer/s,
  );
  assert.equal(r.computed, "rgb(22, 163, 74)");

  // a look in @scope: the token's source is the scoped rule in layer author
  const sc = '[data-case="scoped"]';
  await pick(sc);
  r = await settle("background-color", (x) => !!x.winner);
  assert.equal(r.status, "ok", r.text);
  const token = await page.locator('[data-token="--color-surface"]').innerText();
  const scoped = (await computed(sc, "--color-surface")).trim() === "rgb(254, 243, 199)";
  if (name === "chrome") assert.ok(scoped, "Chrome has @scope");
  assert.equal(/@scope/.test(token) && /author/.test(token), scoped, token);

  // a surface in a surface: the unregistered custom properties (`--surface-d`, `--surface-k` with odd whitespace) are
  // judged against the page's sheet, which LightningCSS reprinted (`0.04` is `.04` there), not the server's
  for (const [c, d] of [
    ["surface-outer", "0.04"],
    ["surface-inner", "calc(0.03 * clamp(-1, (0.5636 - l) * 1e6, 1))"],
  ]) {
    await pick(`[data-case="${c}"]`);
    r = await settle("--surface-d", (x) => x.value === d);
    assert.equal(r.status, "ok", `${name} ${c}: ${r.text}`);
    assert.notEqual(r.computed, d, "the page's sheet is reprinted");
    const bad = await page
      .locator('[data-devtools=properties] [data-prop^="--"]')
      .evaluateAll((els) =>
        els.flatMap((e) => (e.dataset.status === "mismatch" ? [e.innerText] : [])),
      );
    assert.deepEqual(bad, [], `${name} ${c}`);
  }
  await pick('[data-case="surface-outer"]');
  // the base colour, written with odd whitespace, is a hex colour and a lab() under @supports in the page
  r = await settle("--surface-k", (x) => x.value === "oklch( 0.9   0.02 90 )");
  assert.equal(r.status, "ok", r.text);
  assert.notEqual(r.computed, r.value);

  // Esc closes
  await page.keyboard.press("Escape");
  await until("closed", async () => (await page.locator("[data-devtools=panel]").count()) === 0);
  assert.deepEqual(errors, [], `${name}: page errors`);
  await browser.close();
  console.log(`${name}: ok`);
};

let failed = false;
for (const name of names)
  await run(name).catch((e) => {
    failed = true;
    console.error(`${name}: ${e.stack}`);
  });
await server.close();
process.exit(failed ? 1 : 0);
