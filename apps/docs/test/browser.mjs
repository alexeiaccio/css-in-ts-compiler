// The site on the dev server in Chrome (playwright-core from node_modules/.bun; skipped when Chrome is not installed). Every page of the
// sidebar is opened: it must render its title and its text, and a page error, a console error, a failed request or Solid's
// SETTLED_CLEANUP_UNOWNED (the dev build reports what the production one drops) fails the run. Then the parts: the links between the
// pages and their anchors, the search, the colour mode (system and the toggle), the mobile menu, the type hovers. Screenshots go to
// test/out/ (ignored by git). Then the built site, as a static host serves it: each document holds its page (read with JavaScript off),
// the app takes over with no frame that shows both or neither, and the links work. DOCS_BASE (see vite.config.ts) runs all of it
// under that base path.
//   node test/browser.mjs
//   DOCS_BASE=/css-in-ts-compiler/ node test/browser.mjs
import assert from "node:assert/strict";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import { build, createServer, preview } from "vite";

const root = join(import.meta.dirname, "..");
const out = join(import.meta.dirname, "out");
mkdirSync(out, { recursive: true });
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const browser = await chromium.launch({ channel: "chrome" }).catch((e) => {
  console.log(`docs browser: skipped, Chrome did not start (${String(e).split("\n")[0]})`);
  process.exit(0);
});
const server = await createServer({ root, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const prefix = new URL(base).pathname; // the base path: "/" or "/css-in-ts-compiler/"
const slugOf = (href) => href.slice(prefix.length);
const problems = [];

const open = async (context, path = "") => {
  context.setDefaultTimeout(180_000); // the first request waits for the type-check of the ts blocks (~15 s, more on a busy machine)
  const page = await context.newPage();
  page.on("pageerror", (e) => problems.push(`${path}: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error" || /SETTLED_CLEANUP_UNOWNED/.test(m.text()))
      problems.push(`${path}: ${m.text()}`);
  });
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  await page.goto(base + path);
  await page.locator("main h1").waitFor({ state: "visible" });
  return page;
};
const ready = (page) =>
  page.waitForFunction(() => document.querySelector(".prose")?.childElementCount);
const bg = (page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const home = await open(desktop);
  await ready(home);
  const hrefs = await home.$$eval("#sidebar a", (as) => as.map((a) => a.getAttribute("href")));
  assert.ok(hrefs.length >= 20, `${hrefs.length} pages in the sidebar`);

  // every page, by its link in the sidebar; the anchors its links point at are checked once all are known
  const anchors = new Map();
  const links = [];
  for (const href of hrefs) {
    await home.goto(base + slugOf(href));
    await home.locator("main h1").waitFor({ state: "visible" });
    await ready(home).catch(() => {}); // License is one line
    await sleep(150); // the effects run after the page is on screen
    const info = await home.evaluate(() => ({
      title: document.title,
      h1: document.querySelector("h1").textContent,
      h1s: document.querySelectorAll("h1").length,
      text: document.querySelector(".prose")?.textContent.length ?? 0,
      ids: [...document.querySelectorAll("main [id]")].map((e) => e.id),
      links: [...document.querySelectorAll(".prose a[href^='/'], main nav a")].map((a) =>
        a.getAttribute("href"),
      ),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.ok(info.title.includes("cssints"), `${href}: title ${info.title}`);
    assert.ok(info.h1.length > 0 && info.text > 0, `${href}: empty page`);
    assert.equal(info.h1s, 1, `${href}: one title`);
    assert.ok(!info.overflow, `${href}: scrolls sideways`);
    anchors.set(slugOf(href), new Set(info.ids));
    links.push(...info.links.map((l) => [href, l]));
  }
  for (const [from, link] of links) {
    assert.ok(link.startsWith(prefix), `${from}: link ${link} is outside ${prefix}`);
    const [slug = "", hash] = slugOf(link).split("#");
    const ids = anchors.get(slug);
    assert.ok(ids, `${from}: link to ${link}, which is no page`);
    assert.ok(!hash || ids.has(hash), `${from}: link to ${link}, which has no such anchor`);
  }

  // the unknown path is the not-found page
  await home.goto(`${base}no-such-page`);
  await home.locator("main h1").waitFor({ state: "visible" });
  assert.equal(await home.textContent("h1"), "Page not found");

  // three columns, the outline of the page, the active page in the sidebar
  await home.goto(`${base}authoring-surface`);
  await ready(home);
  const cols = await home.evaluate(() => ({
    side: document.querySelector("#sidebar").getBoundingClientRect().width,
    outline: document.querySelector("aside").getBoundingClientRect().width,
    current: document.querySelector("#sidebar a[aria-current=page]")?.textContent,
  }));
  assert.ok(cols.side > 200 && cols.outline > 150, JSON.stringify(cols));
  assert.equal(cols.current, "Authoring surface");
  await home.click("aside a[href='#names']");
  await sleep(300);
  assert.ok((await home.evaluate(() => scrollY)) > 0, "the outline scrolls to the term");
  assert.equal(
    await home.evaluate(
      () => document.querySelector("aside a[aria-current=location]")?.textContent,
    ),
    "Names",
    "the outline marks the term that is open",
  );

  // type hovers: a token of a ts block shows its type; the popup is inside the window and above the code's clip
  await home.goto(`${base}tokens`);
  await ready(home);
  const at = await home.evaluate(() => {
    const el = [...document.querySelectorAll(".prose pre .twoslash-hover")].find(
      (e) => e.lastChild?.textContent === "token",
    );
    el.setAttribute("data-probe", "");
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await home.mouse.move(at.x, at.y);
  await sleep(500);
  const popup = home.locator("[data-probe] .twoslash-popup-container");
  const box = await popup.boundingBox();
  assert.ok(box && box.width > 0 && box.x >= 0 && box.x + box.width <= 1440, "hover popup");
  assert.equal(await popup.evaluate((e) => getComputedStyle(e).opacity), "1");
  assert.match(await popup.textContent(), /token/);
  assert.ok(
    (await home.locator(".twoslash-error-line").count()) > 0,
    "a line marked // error shows its message",
  );
  await home.screenshot({ path: join(out, "hover-light.png") });

  // search: "/" focuses it; words match headings and terms; Enter opens the first hit at its anchor
  await home.goto(`${base}`);
  await ready(home);
  await home.keyboard.press("/");
  await home.keyboard.type("frame");
  await home.waitForFunction(() => document.querySelector("[role=option]"));
  assert.match(await home.textContent("[role=option]"), /frame\(\)/);
  await home.screenshot({ path: join(out, "search-light.png") });
  await home.keyboard.press("Enter");
  await home.waitForURL(/\/frame-concentric-radius/);
  await home.locator("main h1").waitFor({ state: "visible" });
  assert.equal(await home.locator("[role=option]").count(), 0, "the results close");
  await home.keyboard.press("/");
  await home.keyboard.type("zzzz");
  await home.locator("text=No headings match").waitFor({ state: "visible" });
  await home.keyboard.press("Escape");

  // system dark, the toggle (system, light, dark), and what is stored
  const dark = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 1440, height: 900 },
  });
  const night = await open(dark, "basic-usage");
  await ready(night);
  assert.equal(await bg(night), "rgb(12, 15, 21)", "dark follows the system");
  await night.screenshot({ path: join(out, "basic-usage-dark.png") });
  await night.click("button[aria-label^='Colour mode']");
  await sleep(100);
  assert.ok(await night.evaluate(() => document.documentElement.classList.contains("light")));
  assert.equal(
    await bg(night),
    "rgb(255, 255, 255)",
    "a page that asks for light is light on a dark system",
  );
  await night.click("button[aria-label^='Colour mode']");
  assert.ok(await night.evaluate(() => document.documentElement.classList.contains("dark")));
  await night.reload();
  await night.locator("main h1").waitFor({ state: "visible" });
  assert.ok(
    await night.evaluate(() => document.documentElement.classList.contains("dark")),
    "the mode is kept",
  );
  await night.click("button[aria-label^='Colour mode']");
  assert.ok(await night.evaluate(() => !document.documentElement.classList.length), "system again");
  await night.close();
  await dark.close();

  // a phone: the sidebar is a drawer behind the menu button, closed by a link
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const mobile = await open(phone, "install");
  await ready(mobile);
  assert.ok(!(await mobile.isVisible("#sidebar")), "the drawer is closed");
  const wide = await mobile.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter(
        (e) =>
          e.getBoundingClientRect().right > innerWidth + 1 &&
          !e.closest(".twoslash-popup-container, pre"),
      )
      .map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`),
  );
  assert.deepEqual(wide, [], "nothing sticks out of a phone's width");
  await mobile.screenshot({ path: join(out, "install-mobile.png") });
  const menuIcon = () => mobile.locator("button[aria-label=Menu] span").getAttribute("class");
  const closedIcon = await menuIcon();
  await mobile.click("button[aria-label=Menu]");
  assert.notEqual(await menuIcon(), closedIcon, "the menu button turns into a cross");
  await mobile.locator("#sidebar").waitFor({ state: "visible" });
  await sleep(300);
  await mobile.screenshot({ path: join(out, "menu-mobile.png") });
  await mobile.click(`#sidebar a[href='${prefix}tokens']`);
  await mobile.waitForURL(/\/tokens$/);
  await mobile.locator("#sidebar").waitFor({ state: "hidden" });
  await phone.close();

  await home.goto(`${base}basic-usage`);
  await ready(home);
  await home.screenshot({ path: join(out, "basic-usage-light.png") });
  await home.goto(base);
  await ready(home);
  await home.screenshot({ path: join(out, "overview-light.png") });

  // the built site
  const dist = join(out, "dist");
  await build({ root, logLevel: "error", build: { outDir: dist, emptyOutDir: true } });
  const site = await preview({
    root,
    logLevel: "error",
    build: { outDir: dist },
    preview: { port: 0 },
  });
  try {
    const built = site.resolvedUrls.local[0];
    // JavaScript off: the page is the document (as a crawler reads it), with its links
    const plain = await browser.newContext({ javaScriptEnabled: false });
    const bare = await plain.newPage();
    await bare.goto(`${built}authoring-surface/`);
    assert.equal(await bare.title(), "Authoring surface · cssints");
    assert.equal(await bare.textContent("h1"), "Authoring surface");
    assert.ok((await bare.textContent(".prose")).length > 1000, "the article is in the document");
    assert.ok((await bare.getAttribute("meta[name=description]", "content")).length > 40);
    assert.equal(await bare.locator("#root").isVisible(), false, "the empty root is hidden");
    await bare.click(`#prerender nav a[href='${prefix}tokens/']`);
    assert.equal(await bare.textContent("h1"), "Tokens", "a link is another document");
    await plain.close();

    // JavaScript on: the app takes over. At every frame the page is the static copy or the app, never both and never neither
    const watched = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await watched.addInitScript(() => {
      window.__frames = [];
      const tick = () => {
        const copy = !!document.getElementById("prerender");
        const app = document.getElementById("root")?.hidden === false;
        window.__frames.push([copy, app]);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const seen = [];
    for (const path of ["tokens/", "tokens", "frame-concentric-radius#names", "", "no-such-page"]) {
      const page = await watched.newPage();
      page.on("pageerror", (e) => problems.push(`built ${path}: ${e}`));
      page.on(
        "console",
        (m) => m.type() === "error" && problems.push(`built ${path}: ${m.text()}`),
      );
      await page.goto(built + path);
      await page.locator("main h1").waitFor({ state: "visible" });
      await sleep(200);
      const state = await page.evaluate(() => ({
        copies: document.querySelectorAll("#prerender").length,
        h1s: document.querySelectorAll("h1").length,
        proses: document.querySelectorAll(".prose").length,
        frames: window.__frames,
      }));
      assert.deepEqual([state.copies, state.h1s, state.proses <= 1], [0, 1, true], `built ${path}`);
      const live = state.frames.slice(state.frames.findIndex(([copy, app]) => copy || app));
      assert.ok(
        live.every(([copy, app]) => copy !== app),
        `built ${path}: a frame shows both or neither`,
      );
      seen.push(await page.textContent("h1"));
      if (path === "tokens/") {
        await page.click(`#sidebar a[href='${prefix}install']`);
        await page.waitForURL(/\/install$/);
        await page.locator("main h1", { hasText: "Install" }).waitFor({ state: "visible" });
        assert.equal(await page.title(), "Install · cssints");
      }
      await page.close();
    }
    assert.deepEqual(seen, [
      "Tokens",
      "Tokens",
      "frame(): concentric radius",
      "CSS-in-TS",
      "Page not found",
    ]);
    // the devtools: the page asks for nothing of them until the first open, then the overlay and the table load, and a pick shows its calls
    const tools = await watched.newPage();
    const loaded = [];
    tools.on("request", (r) => loaded.push(r.url()));
    tools.on("pageerror", (e) => problems.push(`built devtools: ${e}`));
    tools.on(
      "console",
      (m) => m.type() === "error" && problems.push(`built devtools: ${m.text()}`),
    );
    await tools.goto(`${built}install`);
    await tools.locator("main h1").waitFor({ state: "visible" });
    await sleep(500);
    const lazy = /\/assets\/(overlay|cssints-devtools)-/;
    assert.deepEqual(
      loaded.filter((u) => lazy.test(u)),
      [],
      "nothing of the devtools before the first open",
    );
    await tools.keyboard.press("Alt+Shift+C");
    await tools.locator("[data-devtools=panel]").waitFor();
    assert.equal(loaded.filter((u) => lazy.test(u)).length, 2, "the overlay and the table");
    await tools.locator("text=hover an element").waitFor();
    await tools.hover("#sidebar", { position: { x: 4, y: 4 } });
    await tools.click("#sidebar", { position: { x: 4, y: 4 } });
    await tools.waitForSelector("[data-devtools=classes] [data-site]");
    const where = await tools
      .locator("[data-site]")
      .evaluateAll((es) => es.map((e) => e.dataset.site));
    assert.match(where.join(), /^src\/[\w/.-]+\.tsx?:\d+/, "file:line, relative to the project");
    assert.ok(
      (await tools.$eval("[data-call]", (e) => e.textContent)).length > 3,
      "the call's text",
    );
    assert.equal(
      await tools.locator("[data-devtools=classes] button").count(),
      0,
      "no link to an editor",
    );
    assert.ok(await tools.locator("[data-devtools=properties] [data-prop]").count(), "the cascade");
    await tools.screenshot({ path: join(out, "devtools-built.png") });
    await tools.keyboard.press("Escape");
    await tools.close();
    await watched.close();
  } finally {
    await site.close();
  }
  assert.deepEqual(problems, []);
} finally {
  await browser.close();
  await server.close();
}
console.log(
  `docs browser (base ${prefix}): every page renders with no console error; links, search, modes, menu and hovers ok; the built pages read without JS and the app takes over cleanly`,
);
process.exit(0);
