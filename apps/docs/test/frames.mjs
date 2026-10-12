// The result frames of the docs pages take the site's canvas: its background, text colour and font, read off the page's current tokens
// and passed into the frame (plugin/docs.ts), in every mode and palette. Every example frame is rendered in light and dark, in two
// palettes, and no text in it has a contrast below 3 against the background it sits on (a project that sets a background sets its
// text colour too, and the other way round). A frame that follows a palette and a font setting, and the Code tab, are checked on
// the way; screenshots of two pages in two palettes and two modes go to test/out/. (Skipped without Chrome, like browser.mjs.)
//   node test/frames.mjs
import assert from "node:assert/strict";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createServer } from "vite";

// the pages are listed without the type-check of their code blocks
process.env.DOCS_HOVERS = "0";

const root = join(import.meta.dirname, "..");
const out = join(import.meta.dirname, "out");
mkdirSync(out, { recursive: true });
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const browser = await chromium.launch({ channel: "chrome" }).catch((e) => {
  console.log(`docs frames: skipped, Chrome did not start (${String(e).split("\n")[0]})`);
  process.exit(0);
});
const server = await createServer({ root, logLevel: "error", server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];

const slugs = readdirSync(join(root, "examples")).filter((d) => d !== "csssky" && d !== "install");
const PALETTES = ["cssints", "flexoki"];
const MODES = ["light", "dark"];

// In the frame: every element with text of its own, its colour and the background under it (the layers of its ancestors, up to the
// canvas); a gradient or an image under the text is not a colour, so that text is counted apart. The elements below 3:1 come back.
const contrast = () => {
  const cv = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const parse = (c) => {
    const read = (probe) => {
      cv.clearRect(0, 0, 1, 1);
      cv.fillStyle = probe;
      cv.fillStyle = c;
      cv.fillRect(0, 0, 1, 1);
      return [...cv.getImageData(0, 0, 1, 1).data];
    };
    const [a, b] = [read("#123456"), read("#654321")];
    return a.join() === b.join() ? [a[0], a[1], a[2], a[3] / 255] : undefined;
  };
  const over = (top, bottom) => [
    top[0] * top[3] + bottom[0] * (1 - top[3]),
    top[1] * top[3] + bottom[1] * (1 - top[3]),
    top[2] * top[3] + bottom[2] * (1 - top[3]),
    1,
  ];
  const under = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none") return undefined;
      const c = parse(cs.backgroundColor);
      if (!c) return undefined;
      layers.push(c);
      if (c[3] === 1) break;
    }
    return layers.reduceRight((below, layer) => over(layer, below), [255, 255, 255, 1]);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const low = [];
  let checked = 0;
  let unknown = 0;
  for (const el of document.body.querySelectorAll("*")) {
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ");
    const cs = getComputedStyle(el);
    if (!text || !el.getClientRects().length || cs.visibility === "hidden" || cs.opacity === "0")
      continue;
    const bg = under(el);
    const fg = parse(cs.color);
    if (!bg || !fg) {
      unknown++;
      continue;
    }
    const a = lum(over(fg, bg)) + 0.05;
    const b = lum(bg) + 0.05;
    const ratio = Math.max(a, b) / Math.min(a, b);
    checked++;
    if (ratio < 3)
      low.push(
        `<${el.localName}> "${text.slice(0, 30)}" ${cs.color} on ${cs.backgroundColor} = ${ratio.toFixed(2)}`,
      );
  }
  return { low, checked, unknown };
};

const problems = [];
try {
  const page = await (
    await browser.newContext({ viewport: { width: 1200, height: 900 }, colorScheme: "light" })
  ).newPage();
  page.setDefaultTimeout(180_000);
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  // the settings are classes and data attributes of <html>; the frame is told, and asks the page what the tokens are now
  const set = (mode, palette) =>
    page.evaluate(
      ([mode, palette]) => {
        const c = document.documentElement.classList;
        c.toggle("light", mode === "light");
        c.toggle("dark", mode === "dark");
        c.remove("dim");
        document.documentElement.dataset.palette = palette;
      },
      [mode, palette],
    );
  const tokens = () =>
    page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        bg: cs.getPropertyValue("--color-bg").trim(),
        text: cs.getPropertyValue("--color-text").trim(),
      };
    });
  let checked = 0;
  let unknown = 0;
  const seen = new Set();
  const failures = [];
  for (const slug of slugs) {
    await page.goto(`${base}${slug}`);
    const frame = await (await page.locator(".example iframe").elementHandle()).contentFrame();
    await frame.locator("#root:not(:empty)").waitFor();
    for (const palette of PALETTES)
      for (const mode of MODES) {
        await set(mode, palette);
        const want = await tokens();
        seen.add(`${mode}/${palette}/${want.bg}`);
        // the frame has what the page's tokens are now
        await frame.waitForFunction((w) => {
          const cs = getComputedStyle(document.documentElement);
          return (
            cs.getPropertyValue("--canvas-bg") === w.bg &&
            cs.getPropertyValue("--canvas-text") === w.text
          );
        }, want);
        const r = await frame.evaluate(contrast);
        checked += r.checked;
        unknown += r.unknown;
        if (r.low.length)
          failures.push(`${slug}, ${mode}, ${palette}:\n    ${r.low.join("\n    ")}`);
      }
  }
  assert.deepEqual(failures, [], "text below 3:1");
  // the canvas is the site's: not always white, and a palette and a mode make four different backgrounds
  assert.equal(seen.size, 4, `four backgrounds: ${[...seen].join(" ")}`);
  console.log(
    `docs frames: ${slugs.length} examples x ${MODES.length} modes x ${PALETTES.length} palettes: ${checked} texts, none below 3:1 (${unknown} on an image or a gradient not counted)`,
  );

  // the canvas of the frame is the site's: the page's background and text colour, the page's font; a project's own rules win
  await page.goto(`${base}basic-usage`);
  const frame = await (await page.locator(".example iframe").elementHandle()).contentFrame();
  await frame.locator("#root:not(:empty)").waitFor();
  await set("dark", "flexoki");
  const want = await tokens();
  await frame.waitForFunction(
    (w) => getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)" || w,
    want,
  );
  const read = () =>
    frame.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        font: getComputedStyle(document.body).fontFamily,
        scheme: cs.colorScheme,
      };
    });
  const hostCanvas = () =>
    page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        bg: cs.backgroundColor,
        color: cs.getPropertyValue("--color-text").trim(),
        font: getComputedStyle(document.body).fontFamily,
        scheme: cs.colorScheme,
      };
    });
  await frame.waitForFunction(
    (h) => getComputedStyle(document.documentElement).backgroundColor === h,
    (await hostCanvas()).bg,
  );
  const inside = await read();
  const outside = await hostCanvas();
  assert.equal(inside.bg, outside.bg, "the frame's background is the site's");
  assert.equal(inside.font, outside.font, "the frame's font is the site's");
  assert.equal(inside.scheme, "dark", "the frame's colour scheme is the site's");
  assert.notEqual(inside.bg, "rgb(255, 255, 255)");
  await page.evaluate(() => (document.documentElement.dataset.font = "serif"));
  await frame.waitForFunction(() => /Georgia/.test(getComputedStyle(document.body).fontFamily));

  // the Code tab: shown with no script by the radio input, the files of the project, a switcher
  await page.goto(`${base}themes`);
  const panel = page.locator(".example");
  await panel.waitFor();
  assert.equal(await panel.locator(".pane-code").isVisible(), false, "Result first");
  await panel.getByText("Code", { exact: true }).click();
  assert.equal(await panel.locator(".pane-result").isVisible(), false);
  const names = await panel.locator(".pane-code > div label").allTextContents();
  assert.deepEqual(names, ["index.tsx", "theme.ts"]);
  assert.equal(await panel.locator(".pane-code pre:visible").count(), 1, "one file at a time");
  assert.match(await panel.locator(".pane-code pre:visible").textContent(), /^import /);
  await panel.getByText("theme.ts", { exact: true }).click();
  assert.match(
    await panel.locator(".pane-code pre:visible").textContent(),
    /createTokens|createGlobalTheme/,
  );
  assert.equal(await panel.locator(".pane-code pre:visible").count(), 1);
  // the highlight follows the mode, as the page's blocks do
  await set("light", "cssints");
  const spans = panel.locator(".pane-code pre:visible span[style*='--shiki-light']");
  const first = () => spans.evaluateAll((els) => getComputedStyle(els[0]).color);
  const light = await first();
  await set("dark", "cssints");
  assert.notEqual(await first(), light);
  await set("dark", "cssints");

  // screenshots: two pages, two palettes, two modes
  for (const slug of ["basic-usage", "themes"])
    for (const palette of PALETTES)
      for (const mode of MODES) {
        await page.goto(`${base}${slug}`);
        const f = await (await page.locator(".example iframe").elementHandle()).contentFrame();
        await f.locator("#root:not(:empty)").waitFor();
        await set(mode, palette);
        const w = await tokens();
        await f.waitForFunction(
          (x) =>
            getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg") === x.bg,
          w,
        );
        await page
          .locator(".example")
          .screenshot({ path: join(out, `frame-${slug}-${palette}-${mode}.png`) });
      }
  await page.goto(`${base}themes`);
  await page.locator(".example").waitFor();
  await set("dark", "flexoki");
  await page.locator(".example").getByText("Code", { exact: true }).click();
  await page.locator(".example").screenshot({ path: join(out, "frame-themes-code-dark.png") });
  assert.deepEqual(problems, []);
} finally {
  await browser.close();
  await server.close();
}
console.log("docs frames: the canvas follows the site; the Code tab shows the files");
process.exit(0);
