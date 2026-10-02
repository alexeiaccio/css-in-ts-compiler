// The appearance settings in Chrome (playwright-core from node_modules/.bun, Chrome is the installed channel; not in `test`):
// the built app is served, and the page is driven through its own controls and read with getComputedStyle.
//   - the hue slider recolours the accent, hover, strong and soft steps in all four modes (system under a light and a dark
//     browser), with each mode's lightness steps
//   - square buttons and avatars change the computed radii, and the inner frame of the preview button follows the outer one
//   - a reload keeps the settings, and the first frame already has them: a rAF hook reads <html> at every frame from the
//     start, while the app's script is held back for 600 ms. The control runs the same page with the inline script cut
//     out and must show the flash, so the check can fail.
// The last block compares the engine's contrast maths (colour outside sRGB clipped, color.ts) with the pixels Chrome paints.
//   node test/browser.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import { build, preview } from "vite";

import { luminance, ratio } from "../../../packages/cssints/src/color.ts";
import { hueOf } from "../src/settings.ts";

const root = join(import.meta.dirname, "..");
process.chdir(root);
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);

const outDir = "node_modules/.sky-browser";
const config = { root, logLevel: "warn", build: { outDir, emptyOutDir: true } };
await build(config);
const server = await preview({ ...config, preview: { port: 0 } });
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  await page.goto(`${base}settings`);

  const style = (testid, prop) =>
    page.getByTestId(testid).evaluate((el, p) => getComputedStyle(el)[p], prop);
  const steps = async () =>
    Object.fromEntries(
      await Promise.all(
        ["accent", "hover", "strong", "soft"].map(async (n) => [
          n,
          await style(`swatch-${n}`, "backgroundColor"),
        ]),
      ),
    );
  const slide = (shift) => page.getByLabel("Accent hue").fill(String(shift));
  const lightness = (c) => Number(/oklch\(([\d.]+)/.exec(c)?.[1]);
  const hueOfColour = (c) => Number(/oklch\([\d.]+ [\d.]+ ([\d.]+)/.exec(c)?.[1]);

  // the lightness of each step per mode (Mu's primary ramp: tokens.json for light, theme.ts for dim and dark)
  const L = {
    light: { accent: 0.637, hover: 0.58, strong: 0.525, soft: 0.926 },
    dark: { accent: 0.637, hover: 0.697, strong: 0.755, soft: 0.357 },
  };
  const modes = [
    { mode: "system", scheme: "light", expected: L.light, bg: "rgb(255, 255, 255)" },
    { mode: "system", scheme: "dark", expected: L.dark, bg: "rgb(0, 0, 0)" },
    // a class beats a dark system
    { mode: "light", scheme: "dark", expected: L.light, bg: "rgb(255, 255, 255)" },
    { mode: "dim", scheme: "light", expected: L.dark, bg: "rgb(26, 26, 26)" },
    { mode: "dark", scheme: "light", expected: L.dark, bg: "rgb(0, 0, 0)" },
  ];
  for (const { mode, scheme, expected, bg } of modes) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.getByRole("radio", { name: mode }).check();
    const label = `${mode} under a ${scheme} browser`;
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
      bg,
      label,
    );
    await slide(0);
    const home = await steps();
    for (const [name, c] of Object.entries(home).map(([n, v]) => [n, String(v)])) {
      assert.equal(hueOfColour(c), 345, `${label}: ${name} at 0 is ${c}`);
      assert.equal(lightness(c), expected[name], `${label}: ${name} is ${c}`);
    }
    for (const shift of [90, -90, 180, -180]) {
      await slide(shift);
      assert.equal(await page.getByTestId("hue").textContent(), String(shift));
      const moved = await steps();
      for (const [name, c] of Object.entries(moved).map(([n, v]) => [n, String(v)])) {
        assert.equal(hueOfColour(c), hueOf(shift), `${label}: ${name} at ${shift} is ${c}`);
        assert.equal(lightness(c), expected[name], `${label}: ${name} at ${shift} is ${c}`);
        assert.notEqual(c, home[name], `${label}: ${name} did not move at ${shift}`);
      }
    }
    // the colours that use the tokens move too: the brand mark of the side navigation
    await slide(90);
    const brand = await page
      .locator("a:visible", { hasText: /^sky$/ })
      .evaluate((el) => getComputedStyle(el).color);
    assert.equal(hueOfColour(brand), hueOf(90), `${label}: brand ${brand}`);
    console.log(
      `hue: ${label}: steps follow the slider, ${home.hover} -> ${(await steps()).hover}`,
    );
  }

  // square buttons and avatars
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByRole("radio", { name: "system" }).check();
  await slide(0);
  const radii = async () => ({
    button: await style("button", "borderRadius"),
    label: await style("button-label", "borderRadius"),
    avatar: await style("avatar", "borderRadius"),
    small: await style("avatar-small", "borderRadius"),
    nav: await page
      .locator("a[aria-label=Home]:visible")
      .evaluate((el) => getComputedStyle(el).borderRadius),
  });
  const round = await radii();
  assert.deepEqual(round, {
    button: "999px",
    label: "995px", // 999 less the 4px padding of the outer frame: the child follows
    avatar: "999px",
    small: "999px",
    nav: "999px",
  });
  await page.getByLabel("Square buttons").check();
  assert.deepEqual(await radii(), { ...round, button: "8px", label: "4px", nav: "8px" });
  await page.getByLabel("Square avatars").check();
  const square = await radii();
  assert.deepEqual(square, {
    button: "8px",
    label: "4px",
    avatar: "8px",
    small: "3px",
    nav: "8px",
  });
  await page.getByLabel("Square buttons").uncheck();
  assert.deepEqual(await radii(), { ...round, avatar: "8px", small: "3px" });
  console.log("radii: round", JSON.stringify(round), "square", JSON.stringify(square));

  // a reload keeps them: set everything through the controls
  await page.getByLabel("Square buttons").check();
  await page.getByRole("radio", { name: "dark" }).check();
  await slide(90);
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem("sky.settings")));
  assert.deepEqual(stored, { hue: 90, mode: "dark", squareButtons: true, squareAvatars: true });

  // the first frames of a load: <html> at each animation frame, the module script held back
  const frames = async (target, { cutScript = false } = {}) => {
    const p = await context.newPage();
    await p.addInitScript(() => {
      window.__frames = [];
      const tick = () => {
        const h = document.documentElement;
        const cs = getComputedStyle(h);
        window.__frames.push({
          bg: cs.backgroundColor,
          accent: cs.getPropertyValue("--color-accent"),
          button: cs.getPropertyValue("--radius-button"),
          classes: h.className,
        });
        if (window.__frames.length < 3) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await p.route("**/*.js", async (route) => {
      await sleep(600);
      await route.continue();
    });
    if (cutScript)
      await p.route(target, async (route) => {
        const res = await route.fetch();
        const html = (await res.text()).replace(/<script>[\s\S]*?<\/script>/, "");
        await route.fulfill({ response: res, body: html });
      });
    await p.goto(target, { waitUntil: "commit" });
    await p.waitForFunction(() => window.__frames?.length >= 3);
    const out = await p.evaluate(() => window.__frames);
    return [p, out];
  };
  const [reloaded, first] = await frames(`${base}settings`);
  console.log("first frame:", JSON.stringify(first[0]));
  for (const f of first) {
    assert.equal(f.bg, "rgb(0, 0, 0)", "the first frames are dark");
    assert.equal(hueOfColour(f.accent), hueOf(90), f.accent);
    assert.equal(f.button, "8px", "the square-buttons class is in effect");
    assert.ok(
      f.classes.split(" ").includes("dark") && f.classes.includes("square-buttons"),
      f.classes,
    );
  }
  // the app comes up with the stored values in its controls, and nothing was written over them
  await reloaded.getByRole("radio", { name: "dark" }).waitFor();
  assert.ok(await reloaded.getByRole("radio", { name: "dark" }).isChecked());
  assert.equal(await reloaded.getByLabel("Accent hue").inputValue(), "90");
  assert.ok(await reloaded.getByLabel("Square buttons").isChecked());
  assert.ok(await reloaded.getByLabel("Square avatars").isChecked());
  assert.equal(
    await reloaded.getByTestId("button").evaluate((el) => getComputedStyle(el).borderRadius),
    "8px",
  );
  assert.deepEqual(
    JSON.parse(await reloaded.evaluate(() => localStorage.getItem("sky.settings"))),
    stored,
  );

  // the control: without the inline script the same page shows the defaults until the app's script has run
  const [flash, before] = await frames(`${base}settings`, { cutScript: true });
  assert.equal(
    before[0].bg,
    "rgb(255, 255, 255)",
    "without the script the first frame is the default",
  );
  assert.equal(hueOfColour(before[0].accent), 345);
  console.log("control (no inline script): first frame", before[0].bg, before[0].accent);
  await flash.close();
  await reloaded.close();

  // storage that holds nonsense, or nothing: the defaults, no error
  const junk = await context.newPage();
  const errors = [];
  junk.on("pageerror", (e) => errors.push(e.message));
  await junk.addInitScript(() => localStorage.setItem("sky.settings", '{"hue":999,"mode":"blue"'));
  await junk.goto(`${base}settings`);
  await junk.getByRole("radio", { name: "system" }).waitFor();
  assert.ok(await junk.getByRole("radio", { name: "system" }).isChecked());
  assert.equal(await junk.getByLabel("Accent hue").inputValue(), "0");
  assert.deepEqual(errors, []);
  await junk.close();

  // Chrome against the engine: the pixel of a colour outside sRGB, as the check reads it and as Chrome paints it
  const painted = await page.evaluate(
    (hues) => {
      const c = new OffscreenCanvas(1, 1).getContext("2d");
      return hues.map((h) => {
        c.fillStyle = `oklch(0.637 0.203 ${h})`;
        c.fillRect(0, 0, 1, 1);
        return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
      });
    },
    [345, 190, 120, 250],
  );
  const lumOf = ([r, g, b]) => luminance(`rgb(${r} ${g} ${b})`).lum;
  const white = luminance("#ffffff").lum;
  const rows = [345, 190, 120, 250].map((h, i) => {
    const engine = ratio(white, luminance(`oklch(0.637 0.203 ${h})`).lum);
    const chrome = ratio(white, lumOf(painted[i]));
    return { h, engine: +engine.toFixed(2), chrome: +chrome.toFixed(2) };
  });
  console.log("white on accent, engine vs the pixels of Chrome:", JSON.stringify(rows));
  for (const r of rows) assert.ok(Math.abs(r.engine - r.chrome) < 0.5, JSON.stringify(r));
  console.log("sky browser: hue in four modes, square flags, reload and first frame ok");
} finally {
  await browser.close();
  await server.close();
}
process.exit(0);
