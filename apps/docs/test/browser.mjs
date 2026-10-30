// The site on the dev server in Chrome (playwright-core from node_modules/.bun; skipped when Chrome is not installed). Every page of the
// sidebar is opened: it must render its title and its text, and a page error, a console error, a failed request or Solid's
// SETTLED_CLEANUP_UNOWNED (the dev build reports what the production one drops) fails the run. Then the parts: the links between the
// pages and their anchors, the search, the settings panel (keyboard, each setting, kept across a reload, Chrome's contrast over the hue), the mobile menu, the type hovers. Screenshots go to
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

import { CUBES, DEFAULT_HUE, HUES, IDS, palettes } from "../src/palettes.ts";

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
// "#rrggbb" as Chrome prints a computed colour
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
// the default palette is the logo's (cssints)
const start = palettes.cssints(DEFAULT_HUE);

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const home = await open(desktop, "overview");
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
    if (slug === "playground" || slug === "tui") continue; // pages of their own, not docs (test/tui.mjs)
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
  await home.goto(`${base}overview`);
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

  // system dark, then the settings panel: opened and closed by keyboard, each setting changes computed styles, all are kept
  const dark = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 1440, height: 900 },
  });
  const night = await open(dark, "basic-usage");
  await ready(night);
  assert.equal(await bg(night), rgb(start.dark.bg), "dark follows the system");
  await night.screenshot({ path: join(out, "basic-usage-dark.png") });
  const gear = "button[aria-label='Display settings']";
  const read = (fn, arg) => night.evaluate(fn, arg);
  const style = (sel, prop) =>
    read(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
  const setting = (name, value) =>
    night.check(`#settings-content input[name=${name}][value=${value}]`);
  assert.equal(
    await night.locator("#settings-content").isVisible(),
    false,
    "the panel starts closed",
  );
  await night.focus(gear);
  await night.keyboard.press("Enter");
  await night.locator("#settings-content").waitFor({ state: "visible" });
  // the trigger says it is open, and the panel is measured under it (bottom-end): 4 px below, right edges flush
  assert.equal(await night.getAttribute(gear, "aria-expanded"), "true");
  const [triggerBox, panelBox] = await read(() => {
    const rect = (el) => el.getBoundingClientRect().toJSON();
    return [
      rect(document.querySelector("button[aria-label='Display settings']")),
      rect(document.querySelector("#settings-content")),
    ];
  });
  assert.ok(
    Math.abs(panelBox.top - (triggerBox.bottom + 4)) < 1,
    "the panel sits under its trigger",
  );
  assert.ok(Math.abs(panelBox.right - triggerBox.right) < 1, "its right edge is the trigger's");
  await night.keyboard.press("Tab");
  assert.ok(
    await read(() => document.activeElement.closest("#settings-content") !== null),
    "Tab goes into the panel",
  );
  await night.keyboard.press("Escape");
  await night.locator("#settings-content").waitFor({ state: "hidden" });
  assert.equal(await night.getAttribute(gear, "aria-expanded"), "false");
  assert.equal(await read(() => document.activeElement.ariaLabel), "Display settings");
  await night.click(gear);
  await night.locator("#settings-content").waitFor({ state: "visible" });
  await night.screenshot({ path: join(out, "settings-dark.png") });

  // the mode: a page that asks for light is light on a dark system; dim is dark with a lifted background
  await setting("mode", "light");
  assert.equal(await bg(night), rgb(start.light.bg));
  await setting("mode", "dim");
  assert.equal(await bg(night), rgb(start.dim.bg));
  assert.equal(await read(() => document.documentElement.className), "dark dim");
  assert.equal(await style("html", "colorScheme"), "dark");
  await night.screenshot({ path: join(out, "settings-dim.png") });
  await setting("mode", "system");
  assert.equal(await bg(night), rgb(start.dark.bg));
  await setting("mode", "dark");

  // the result of the page's example (plugin/examples.ts): a sandboxed frame that renders the project with no console error (the
  // `problems` listener sees the frame's too), cannot read the page, and takes the display mode as the class of its <html>, which
  // a project's themes read (on the themes page `.light` beats the system's dark)
  const result = await (await night.$(".example iframe")).contentFrame();
  await result.locator("#root:not(:empty)").waitFor();
  assert.equal(await night.getAttribute(".example iframe", "sandbox"), "allow-scripts");
  assert.equal(
    await result.evaluate(() => {
      try {
        return parent.document.title;
      } catch {
        return "blocked";
      }
    }),
    "blocked",
    "the frame cannot read the page",
  );
  assert.equal(
    await night.textContent(".example a[href*='playground#example=basic-usage']"),
    "Open in playground",
  );
  const frameMode = async (name) => {
    await setting("mode", name);
    await result.waitForFunction((c) => document.documentElement.className === c, name);
  };
  await frameMode("light");
  await night.locator(".example").screenshot({ path: join(out, "result-light.png") });
  await frameMode("dim");
  await frameMode("dark");
  await night.locator(".example").screenshot({ path: join(out, "result-dark.png") });
  // what a project's own themes do with it: the themes example is dark on a dark system, and light with the class `light`
  const themed = await open(await browser.newContext({ colorScheme: "dark" }), "themes");
  const panel = await (await themed.waitForSelector(".example iframe")).contentFrame();
  const panelBg = () => panel.$eval("section", (e) => getComputedStyle(e).backgroundColor);
  await panel.waitForFunction(() => document.querySelector("section"));
  assert.equal(await panelBg(), "rgb(11, 11, 15)", "dark on a dark system");
  await themed.evaluate(() => document.documentElement.classList.add("light"));
  await panel.waitForFunction(() => document.documentElement.className === "light");
  assert.equal(await panelBg(), "rgb(255, 255, 255)", "the frame follows the mode");
  await themed.screenshot({ path: join(out, "result-themes.png") });
  await themed.context().close();

  // the hue by keyboard: a step of the wheel, and the accent of that step in the cube (build time, palettes.ts)
  const swatch = () => style("[data-testid=swatch-accent]", "backgroundColor");
  const slider = "#settings-content input[type=range]";
  assert.equal(await swatch(), rgb(start.dark.accent), "the logo's accent");
  assert.equal(await night.locator(slider).isDisabled(), true, "the logo palette has one accent");
  await setting("palette", "itten");
  const before = await swatch();
  assert.equal(before, rgb(palettes.itten(DEFAULT_HUE).dark.accent));
  await night.focus(slider);
  await night.keyboard.press("Home");
  await night.keyboard.press("ArrowRight");
  assert.equal(await night.textContent("[data-testid=hue]"), "1");
  assert.equal(await read(() => document.documentElement.dataset.hue), "1");
  assert.equal(await swatch(), rgb(palettes.itten(1).dark.accent));
  assert.notEqual(await swatch(), before);
  await night.locator(slider).fill("4");
  assert.equal(await swatch(), rgb(palettes.itten(4).dark.accent));
  await setting("mode", "light");
  assert.equal(await swatch(), rgb(palettes.itten(4).light.accent));
  await night.screenshot({ path: join(out, "settings-hue.png") });

  // the palette: a whole theme in each mode. A cube of RYBitten has the wheel, a set of @cssints/tokens one accent (the slider is
  // off); the neutrals and the accent are the palette's, in light, dim and dark
  await setting("palette", "munsell");
  assert.equal(await bg(night), rgb(palettes.munsell(4).light.bg));
  assert.equal(await swatch(), rgb(palettes.munsell(4).light.accent));
  await night.locator(slider).fill("8");
  assert.equal(await swatch(), rgb(palettes.munsell(8).light.accent));
  await setting("mode", "dim");
  assert.equal(await bg(night), rgb(palettes.munsell(8).dim.bg));
  assert.equal(await swatch(), rgb(palettes.munsell(8).dark.accent));
  await night.screenshot({ path: join(out, "settings-munsell-dim.png") });
  await setting("palette", "flexoki");
  assert.equal(await night.locator(slider).isDisabled(), true, "a set has one accent");
  assert.equal(await bg(night), rgb(palettes.flexoki(0).dim.bg));
  await setting("mode", "dark");
  assert.equal(await bg(night), rgb(palettes.flexoki(0).dark.bg));
  assert.equal(await swatch(), rgb(palettes.flexoki(0).dark.accent));
  await setting("mode", "light");
  assert.equal(await bg(night), rgb(palettes.flexoki(0).light.bg));
  await night.screenshot({ path: join(out, "settings-flexoki.png") });
  await setting("palette", "radix");
  assert.equal(await bg(night), rgb(palettes.radix(0).light.bg));
  await setting("palette", "albers");
  assert.equal(await night.locator(slider).isDisabled(), false, "a cube has the wheel");
  assert.equal(await swatch(), rgb(palettes.albers(8).light.accent), "the hue was kept");
  assert.match(await night.textContent("#settings-content"), /RYBitten/, "the cubes are credited");
  assert.equal(
    await night.getAttribute("#settings-content a[href='https://rybitten.space/']", "href"),
    "https://rybitten.space/",
  );
  await night.screenshot({ path: join(out, "settings-albers.png") });

  // text size, density, font and corners, each against the computed style of the page
  assert.equal(await style(".prose", "fontSize"), "16px");
  await setting("text", "small");
  assert.equal(await style(".prose", "fontSize"), "14px");
  await setting("text", "large");
  assert.equal(await style(".prose", "fontSize"), "18px");
  const gap = () => style(".prose > * + *", "marginTop");
  assert.equal(await gap(), "16px");
  await setting("density", "compact");
  assert.equal(await gap(), "12px");
  await setting("density", "comfortable");
  assert.equal(await gap(), "20px");
  assert.match(await style("body", "fontFamily"), /^system-ui/);
  await setting("font", "serif");
  assert.match(await style("body", "fontFamily"), /^Georgia/);
  await setting("font", "mono");
  assert.match(await style("body", "fontFamily"), /Menlo/);
  assert.equal(await style("#settings-content", "borderRadius"), "10px");
  await setting("radius", "sharp");
  assert.equal(await style("#settings-content", "borderRadius"), "0px");
  await setting("radius", "round");
  assert.equal(await style("#settings-content", "borderRadius"), "20px");
  await night.screenshot({ path: join(out, "settings-all.png") });

  // kept across a reload, before the app runs again (the panel reads the stored values back)
  await night.reload();
  await night.locator("main h1").waitFor({ state: "visible" });
  assert.equal(await style(".prose", "fontSize"), "18px");
  assert.equal(await style("#settings-content", "borderRadius"), "20px");
  assert.equal(await read(() => document.documentElement.dataset.font), "mono");
  await night.click(gear);
  assert.ok(await night.isChecked("#settings-content input[name=density][value=comfortable]"));
  assert.equal(await night.inputValue(slider), "8");
  assert.equal(await read(() => document.documentElement.dataset.palette), "albers");
  assert.ok(await night.isChecked("#settings-content input[name=palette][value=albers]"));
  assert.equal(await read(() => document.documentElement.className), "light");
  assert.equal(await swatch(), rgb(palettes.albers(8).light.accent));

  // Reset: every setting back to its default, the system's dark again
  await night.click("#settings-content button");
  assert.equal(await bg(night), rgb(start.dark.bg));
  assert.equal(await style(".prose", "fontSize"), "16px");
  assert.equal(await gap(), "16px");
  assert.equal(await read(() => document.documentElement.dataset.hue), String(DEFAULT_HUE));
  assert.equal(await read(() => document.documentElement.dataset.palette), "cssints");

  // the contrast of every palette at every hue, measured in Chrome on the built themes (test/contrast.mjs does the same with the
  // engine's maths on the data): a pixel of each colour, WCAG ratios, the floors of test/contrast.mjs
  const wheel = [...CUBES];
  const worst = await read(
    ({ ids, wheel, hues }) => {
      const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      const root = document.documentElement;
      const lum = (css) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3), (v) => {
          const c = v / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const pairs = [
        ...["bg", "bg-subtle", "bg-muted"].flatMap((bg) => [
          ["text", bg, 7],
          ["text-medium", bg, 4.5],
        ]),
        ["text-low", "bg", 4.5],
        ["text-low", "bg-subtle", 4.5],
        ["accent", "bg", 3],
        ["accent", "bg-subtle", 3],
        ["link", "bg", 4.5],
        ["link", "bg-subtle", 4.5],
        ["on-accent", "accent", 4.5],
        ["accent-strong", "accent-soft", 4.5],
      ];
      const out = {};
      let n = 0;
      for (const id of ids) {
        root.dataset.palette = id;
        for (const mode of ["light", "dim", "dark"]) {
          root.className = mode === "light" ? "light" : mode === "dim" ? "dark dim" : "dark";
          for (let hue = 0; hue < (wheel.includes(id) ? hues : 1); hue++) {
            root.dataset.hue = String(hue);
            const cs = getComputedStyle(root);
            for (const [fg, bg, min] of pairs) {
              const r = ratio(
                lum(cs.getPropertyValue(`--color-${fg}`)),
                lum(cs.getPropertyValue(`--color-${bg}`)),
              );
              const key = `${id} ${fg}/${bg} ${mode}`;
              n++;
              if (!out[key] || r < out[key].r) out[key] = { r, hue, min };
            }
          }
        }
      }
      return { out, n };
    },
    { ids: [...IDS], wheel, hues: HUES },
  );
  for (const [key, { r, hue, min }] of Object.entries(worst.out))
    assert.ok(r >= min - 0.01, `Chrome: ${key} is ${r.toFixed(2)} at hue ${hue}, under ${min}`);
  assert.ok(worst.n >= 1680, `${worst.n} pairs measured in Chrome`);
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
  await home.goto(`${base}overview`);
  await ready(home);
  await home.screenshot({ path: join(out, "overview-light.png") });

  // the landing page: the whole width (no sidebar, no menu button), the showcase, links that open pages of the site, no
  // sideways scroll at any width, and a screenshot light, dark and on a phone
  const landing = async (context, name) => {
    const page = await open(context);
    await page.locator("[data-landing] [data-panels]").waitFor({ state: "visible" });
    const info = await page.evaluate(() => ({
      title: document.title,
      h1s: document.querySelectorAll("h1").length,
      sidebar: document.querySelector("#sidebar")?.getBoundingClientRect().width,
      menu: getComputedStyle(document.querySelector("button[aria-label=Menu]")).display,
      logo: document.querySelector("[data-landing] [data-hero] img")?.naturalWidth,
      panels: document.querySelectorAll("[data-landing] figure").length,
      features: document.querySelectorAll("[data-landing] [data-features] li").length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      prerender: !!document.getElementById("prerender"),
      hero: document.querySelector("[data-hero]").getBoundingClientRect().toJSON(),
      header: document.querySelector("header").getBoundingClientRect().bottom,
      width: document.documentElement.clientWidth,
      links: [...document.querySelectorAll("[data-landing] a")].map((a) => a.getAttribute("href")),
    }));
    assert.equal(info.title, "cssints");
    assert.equal(info.h1s, 1, "one title");
    assert.ok(!info.sidebar, "no sidebar on the landing page");
    assert.equal(info.menu, "none", "no menu button on the landing page");
    assert.ok(info.logo > 0, "the logo loads");
    assert.deepEqual([info.panels, info.features], [3, 6]);
    assert.ok(!info.overflow && !info.prerender, "no sideways scroll; the static copy is gone");
    // the hero is full-bleed: right under the header and as wide as the page (its glow fills it)
    assert.deepEqual(
      [info.hero.top, info.hero.left, info.hero.width],
      [info.header, 0, info.width],
      "the hero spans the page under the header",
    );
    for (const link of info.links) {
      assert.ok(link.startsWith(prefix), `${link} is outside ${prefix}`);
      assert.ok(
        anchors.has(slugOf(link).replace(/\/$/, "")) || slugOf(link) === "playground/",
        link,
      );
    }
    await page.screenshot({ path: join(out, `landing-${name}.png`), fullPage: true });
    return page;
  };
  const sun = await landing(desktop, "light");
  await sun.click("[data-landing] [data-primary]");
  await sun.waitForURL(/\/install\/?$/);
  await sun.locator("main h1", { hasText: "Install" }).waitFor({ state: "visible" });
  await sun.goBack();
  await sun.locator("[data-landing]").waitFor({ state: "visible" });
  await sun.close();
  const evening = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 1440, height: 900 },
  });
  await (await landing(evening, "dark")).close();
  await evening.close();
  const small = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await (await landing(small, "mobile")).close();
  await small.close();

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
    // the example's tabs work with no script (radio inputs): Code shows a file, the switcher shows the other
    const tabs = bare.locator("#prerender .example");
    assert.equal(await tabs.locator(".pane-code").isVisible(), false, "Result first");
    await tabs.getByText("Code", { exact: true }).click();
    assert.equal(await tabs.locator(".pane-result").isVisible(), false);
    assert.match(await tabs.locator(".pane-code pre:visible").textContent(), /^import /);
    await tabs.getByText("stack.ts", { exact: true }).click();
    assert.match(await tabs.locator(".pane-code pre:visible").textContent(), /export const stack/);
    await tabs.getByText("Result", { exact: true }).click();
    assert.equal(await tabs.locator(".pane-result").isVisible(), true);
    await bare.click(`#prerender nav a[href='${prefix}tokens/']`);
    assert.equal(await bare.textContent("h1"), "Tokens", "a link is another document");
    await bare.goto(built);
    const staticLanding = await bare.locator("[data-landing]").evaluate((e) => e.outerHTML);
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
    for (const path of [
      "tokens/",
      "tokens",
      "frame-concentric-radius#names",
      "",
      "overview/",
      "no-such-page",
    ]) {
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
      if (path === "") {
        // the app renders the string of the document, so the swap changes nothing
        const live = await page.evaluate(() => document.querySelector("[data-landing]").outerHTML);
        assert.equal(live, staticLanding, "the landing page of the app is the prerendered one");
      }
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
      "CSS in TypeScript, compiled away",
      "CSS-in-TS",
      "Page not found",
    ]);
    // the built page's frame follows the mode too (the code that tells it is in the page's chunk)
    const sky = await watched.newPage();
    await sky.goto(`${built}basic-usage`);
    await sky.locator(".example iframe").waitFor();
    const skyFrame = await (await sky.$(".example iframe")).contentFrame();
    await skyFrame.locator("#root:not(:empty)").waitFor();
    await sky.evaluate(() => document.documentElement.classList.add("dark", "dim"));
    await skyFrame.waitForFunction(() => document.documentElement.className === "dim");
    await sky.close();
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

    // stored settings are on the prerendered page before the app: the app's script is blocked, so only index.html's inline
    // script can have set them, and the document is the static copy
    const stored = JSON.stringify({
      mode: "dim",
      palette: "flexoki",
      hue: 4,
      text: "large",
      density: "compact",
      font: "serif",
      radius: "round",
    });
    const early = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await early.addInitScript((v) => localStorage.setItem("cssints-docs.settings", v), stored);
    await early.route(/\/assets\/index-[^/]*\.js$/, (r) => r.abort());
    const still = await early.newPage();
    await still.goto(`${built}tokens/`);
    await still.locator("#prerender h1").waitFor({ state: "visible" });
    assert.deepEqual(
      await still.evaluate(() => {
        const cs = (s, p) => getComputedStyle(document.querySelector(s))[p];
        return [
          document.getElementById("root").hidden,
          document.documentElement.className,
          cs("html", "backgroundColor"),
          cs("#prerender .prose", "fontSize"),
          cs("body", "fontFamily").slice(0, 7),
          cs("#prerender .prose > * + *", "marginTop"),
          document.documentElement.dataset.palette,
          document.documentElement.dataset.hue,
        ];
      }),
      [
        true,
        "dark dim",
        rgb(palettes.flexoki(0).dim.bg),
        "18px",
        "Georgia",
        "12px",
        "flexoki",
        "4",
      ],
    );
    // the result of the example is in the static copy too: a frame with its project rendered, no script of the page needed
    const staticFrame = await (await still.$("#prerender .example iframe")).contentFrame();
    await staticFrame.locator("#root:not(:empty)").waitFor();
    await still.screenshot({ path: join(out, "built-prerender-settings.png") });
    await early.close();
  } finally {
    await site.close();
  }
  assert.deepEqual(problems, []);
} finally {
  await browser.close();
  await server.close();
}
console.log(
  `docs browser (base ${prefix}): every page renders with no console error; links, search, the settings panel, menu and hovers ok; the built pages read without JS and the app takes over cleanly`,
);
process.exit(0);
