// The token fallbacks and the derived-token runtime in a browser that cannot parse oklch() or relative colour
// (cssints-33pa, cssints-i9xo; not in `test`, needs an old browser). The app is built with its default targets (BROWSERSLIST
// unset: chrome 109 is among them), then
//   - an old browser (default: Chromium 109 of Playwright 1.29) shows the default theme in real colours before anything is
//     touched: the page background, the text, the four accent steps and the brand mark are rgb() colours, not transparent or
//     initial, in a light and in a dark scheme
//   - the runtime moves them: the hue slider at 0, 90, -90, 180 and -180 recolours the four steps and flips onAccent (the
//     label of the preview button), in light, dim and dark, and in "system" when the browser's scheme changes; each colour is
//     compared with the pixel that Chrome (the installed channel, 154) paints for its own oklch() / relative colour, within
//     3/255 per channel (the old browser has sRGB only: a colour outside it is clipped, as Chrome clips it on an sRGB screen)
//   - Chrome keeps its live colours (oklch() at the hue of the slider) and the runtime, which ships to every browser, writes
//     nothing on <html>
//   - the time of one slider input in each browser (reported, not asserted)
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
const SLIDER = 'input[aria-label="Accent hue"]'; // getByLabel ignores aria-label before Playwright 1.30
const radio = (mode) => `input[type=radio][value=${mode}]`;
const SHIFTS = [0, 90, -90, 180, -180];
const FLIPS = [0.3, 0.55, 0.6, 0.65, 0.9]; // lightnesses of the accent, around where onAccent turns

// A colour as the 8-bit sRGB it paints, in the browser that computed it: an old browser computes rgb() already, Chrome
// computes oklch() or lab(), which its own canvas turns into pixels.
const paint = (page, colours) =>
  page.evaluate((list) => {
    const c = new OffscreenCanvas(1, 1).getContext("2d", { willReadFrequently: true });
    return list.map((v) => {
      c.clearRect(0, 0, 1, 1);
      c.fillStyle = v;
      c.fillRect(0, 0, 1, 1);
      return [...c.getImageData(0, 0, 1, 1).data];
    });
  }, colours);

const open = async (browser, scheme) => {
  const page = await (
    await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme })
  ).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}settings`);
  await page.locator(SLIDER).waitFor();
  return { page, errors };
};

// the colours the page shows now: the four steps and the label of the preview button, as computed
const colours = (page) =>
  page.evaluate((names) => {
    const get = (testid, prop) =>
      getComputedStyle(document.querySelector(`[data-testid=${testid}]`))[prop];
    return [
      ...names.map((n) => get(`swatch-${n}`, "backgroundColor")),
      get("button-label", "color"),
      getComputedStyle(document.documentElement).backgroundColor,
    ];
  }, NAMES);
const slide = (page, shift) =>
  page.evaluate(
    ([sel, v]) => {
      const el = document.querySelector(sel);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(v));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    [SLIDER, shift],
  );
const rgbOf = (c) => /^rgba?\((\d+), (\d+), (\d+)/.exec(c)?.slice(1).map(Number);
const real = (c) => /^rgba?\(\d+, \d+, \d+(, (0?\.\d+|1))?\)$/.test(c) && c !== "rgba(0, 0, 0, 0)";

// every combination: what the page shows in a mode, under a scheme, at each shift of the slider
const CASES = [
  { mode: "light", scheme: "light" },
  { mode: "dim", scheme: "light" },
  { mode: "dark", scheme: "light" },
  { mode: "system", scheme: "light" },
  { mode: "system", scheme: "dark", flip: true }, // light first, then the browser goes dark under the page
];
const sweep = async (browser, { toPixels }) => {
  const out = {};
  for (const { mode, scheme, flip } of CASES) {
    const { page, errors } = await open(browser, flip ? "light" : scheme);
    await page.locator(radio(mode)).check();
    if (flip) await page.emulateMedia({ colorScheme: scheme });
    const rows = {};
    for (const shift of SHIFTS) {
      await slide(page, shift);
      rows[shift] = await toPixels(page, await colours(page));
    }
    assert.deepEqual(errors, [], `${mode}/${scheme}: page errors`);
    out[`${mode} under ${scheme}`] = rows;
    await page.context().close();
  }
  return out;
};

// ---------- Chrome: the reference
const chrome = await chromium.launch({ channel: "chrome" });
let reference, chromeUpdate, chromeFlips;
try {
  const version = chrome.version();
  reference = await sweep(chrome, {
    toPixels: async (page, cs) => (await paint(page, cs)).map((p) => p.slice(0, 3)),
  });
  const { page } = await open(chrome, "light");
  const written = await page.evaluate(() => document.documentElement.style.cssText);
  assert.ok(!written.includes("--color-"), `chrome ${version}: the runtime wrote ${written}`);
  const hueOfColour = (c) => Number(/oklch\([\d.]+ [\d.]+ ([\d.]+)/.exec(c)?.[1]);
  await slide(page, 90);
  for (const c of (await colours(page)).slice(0, 4))
    assert.equal(hueOfColour(c), hueOf(90), `chrome ${version}: ${c} stays oklch()`);
  chromeFlips = [];
  for (const l of FLIPS) chromeFlips.push(await onAccentAt(page, true, l));
  chromeFlips = chromeFlips.map((c) =>
    c.startsWith("lab(100 ") ? "rgb(255, 255, 255)" : c.startsWith("lab(0 ") ? "rgb(0, 0, 0)" : c,
  );
  assert.ok(
    chromeFlips.includes("rgb(255, 255, 255)") && chromeFlips.includes("rgb(0, 0, 0)"),
    `chrome ${version}: ${chromeFlips.join()}`,
  );
  chromeUpdate = await timing(page);
  console.log(`chrome ${version}: live oklch(), nothing written on <html>`);
} finally {
  await chrome.close();
}

// the time of one slider input: the style write and the microtask that runs the observer (the runtime, in a browser that needs
// it), then the style recalculation that reads the new colour
function timing(page) {
  return page.evaluate(async () => {
    const root = document.documentElement;
    const swatch = document.querySelector("[data-testid=swatch-accent]");
    const hue = (i) => String((345 + (i % 361) + 360) % 360);
    const input = [];
    const total = [];
    const control = [];
    for (let i = 0; i < 720; i++) {
      const t0 = performance.now();
      root.style.setProperty("--hue-accent", hue(i));
      await Promise.resolve();
      const t1 = performance.now();
      void getComputedStyle(swatch).backgroundColor;
      const t2 = performance.now();
      if (i >= 20) {
        input.push(t1 - t0);
        total.push(t2 - t0);
      }
    }
    // the control: the style recalculation alone, before the observer's microtask has run
    for (let i = 0; i < 720; i++) {
      const t0 = performance.now();
      root.style.setProperty("--hue-accent", hue(i));
      void getComputedStyle(swatch).backgroundColor;
      const t1 = performance.now();
      await Promise.resolve();
      if (i >= 20) control.push(t1 - t0);
    }
    const q = (xs, p) => xs.sort((a, b) => a - b)[Math.floor(xs.length * p)];
    return {
      input: q(input, 0.5),
      inputP95: q(input, 0.95),
      total: q(total, 0.5),
      totalP95: q(total, 0.95),
      control: q(control, 0.5),
    };
  });
}

// ---------- the old browser
const results = [];
const oldBrowser = await old[kind].launch();
try {
  const version = oldBrowser.version();
  for (const [scheme, bg, text] of [
    ["light", "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
    ["dark", "rgb(0, 0, 0)", "rgb(255, 255, 255)"],
  ]) {
    const { page } = await open(oldBrowser, scheme);
    const label = `${kind} ${version}, ${scheme}`;
    assert.equal(
      await page.evaluate(() => CSS.supports("color", "oklch(0.6 0.2 345)")),
      false,
      `${label} must lack oklch(): it is not an old browser`,
    );
    const now = await page.evaluate(() => ({
      bg: getComputedStyle(document.documentElement).backgroundColor,
      text: getComputedStyle(document.body).color,
      brand: [...document.querySelectorAll("a")].find(
        (a) => a.textContent === "sky" && a.offsetParent,
      )
        ? getComputedStyle(
            [...document.querySelectorAll("a")].find(
              (a) => a.textContent === "sky" && a.offsetParent,
            ),
          ).color
        : "",
    }));
    const steps = await colours(page);
    assert.equal(now.bg, bg, label);
    assert.equal(now.text, text, label);
    for (const c of [...steps, now.brand]) assert.ok(real(c), `${label}: ${c}`);
    const [r, g, b] = rgbOf(steps[0]);
    assert.ok(
      Math.abs(r - 219) + Math.abs(g - 74) + Math.abs(b - 167) <= 3,
      `${label}: the accent is Mu pink, not ${steps[0]}`,
    );
    results.push(`${label}: bg ${now.bg}, text ${now.text}, steps ${steps.slice(0, 4).join(" ")}`);
    await page.context().close();
  }

  // the slider and the modes against Chrome
  const got = await sweep(oldBrowser, {
    toPixels: (_, cs) => Promise.resolve(cs.map((c) => rgbOf(c))),
  });
  let worst = 0;
  let moved = 0;
  for (const [name, rows] of Object.entries(got))
    for (const shift of SHIFTS)
      rows[shift].forEach((p, i) => {
        const want = reference[name][shift][i];
        const d = Math.max(...p.map((v, k) => Math.abs(v - want[k])));
        worst = Math.max(worst, d);
        assert.ok(
          d <= 3,
          `${kind} ${version}, ${name}, shift ${shift}, ${["accent", "hover", "strong", "soft", "onAccent", "bg"][i]}: ${p} vs Chrome ${want}`,
        );
      });
  for (const rows of Object.values(got))
    for (const i of [0, 1, 2, 3]) {
      assert.notDeepEqual(rows[0][i], rows[90][i], "the slider moved nothing");
      moved++;
    }
  // onAccent follows the accent's lightness: white on the dark ones, black on the light ones, where Chrome flips
  const { page: flipPage } = await open(oldBrowser, "light");
  const flips = [];
  for (const l of FLIPS) flips.push(await onAccentAt(flipPage, false, l));
  assert.deepEqual(
    flips,
    chromeFlips,
    `${kind} ${version}: onAccent at L ${FLIPS.join()} is ${flips.join()}`,
  );
  results.push(
    `${kind} ${version}: ${Object.keys(got).length} modes x ${SHIFTS.length} hues x 6 colours within ${worst}/255 of Chrome; the slider moved ${moved} steps; onAccent ${flips.map((c) => (c === "rgb(0, 0, 0)" ? "black" : "white")).join("/")} at L ${FLIPS.join("/")} like Chrome`,
  );
  const { page } = await open(oldBrowser, "light");
  const t = await timing(page);
  results.push(
    `${kind} ${version}: one slider input: the write and the runtime ${t.input.toFixed(2)} ms (p95 ${t.inputP95.toFixed(2)}), the style recalculation alone, with no runtime work before it, ${t.control.toFixed(2)} ms`,
  );
  results.push(
    `chrome 154 (runtime idle): the write ${chromeUpdate.input.toFixed(2)} ms, the recalculation alone ${chromeUpdate.control.toFixed(2)} ms`,
  );
} finally {
  await oldBrowser.close();
  await server.close();
}

// onAccent flips where the accent's lightness crosses CIE L* 49.4. The slider never changes the lightness, so the accent is made
// lighter and darker by hand: Chrome takes --color-accent on <html>, the old browser the accent template of the data the sheet
// holds (a style rule that replaces --_derived, which the runtime reads again at each update).
function onAccentAt(page, chromeLike, lightness) {
  return page.evaluate(
    async ([chromeLike, l]) => {
      const root = document.documentElement;
      const label = document.querySelector("[data-testid=button-label]");
      const style = document.createElement("style");
      if (chromeLike) root.style.setProperty("--color-accent", `oklch(${l} 0.2 345)`);
      else {
        const raw = getComputedStyle(root).getPropertyValue("--_derived").trim();
        const data = JSON.parse(raw.slice(1, -1).replace(/\\(.)/g, "$1"));
        data.b["--color-accent"] = `oklch(${l} 0.2 var(--hue-accent))`;
        data.t = [];
        style.textContent = `:root{--_derived:'${JSON.stringify(data)}'}`;
        document.head.append(style);
        root.style.setProperty("--hue-accent", "346"); // an <html> mutation: the runtime reads again
        await Promise.resolve();
      }
      const c = getComputedStyle(label).color;
      root.style.removeProperty("--color-accent");
      style.remove();
      root.style.setProperty("--hue-accent", "345");
      await Promise.resolve();
      return c;
    },
    [chromeLike, lightness],
  );
}
console.log(results.join("\n"));
console.log(
  "sky old browser: the runtime follows the slider and the modes like Chrome; Chrome stays live and idle",
);
