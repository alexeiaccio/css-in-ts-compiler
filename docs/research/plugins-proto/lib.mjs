/* oxlint-disable */
import { readFileSync } from "node:fs";

// PW=<dir of another playwright-core>/index.mjs drives an older browser build (with PLAYWRIGHT_BROWSERS_PATH), see README
const { chromium, firefox, webkit } = await import(
  process.env.PW ?? "/Users/a.tukachev/github/css-in-ts-compiler/node_modules/.bun/node_modules/playwright-core/index.mjs"
);

const here = (p) => new URL(p, import.meta.url);
export const read = (p) => readFileSync(here(p), "utf8");

export const FEATS = [
  { s: ".f", r: "--_fi", w: "--_fu", t: "--_ft" },
  { s: ".s", r: "--_sc", w: "--_su", t: "--_st" },
];

// @property blocks first (outside layers), then the layered kernel; site classes are a separate layer above it.
const split = (css) => {
  const props = css.match(/^@property[\s\S]*?\}\n/gm)?.join("") ?? "";
  return [props, css.replace(/^@property[\s\S]*?\}\n/gm, "")];
};
const parts = ["kernels/frame.css", "kernels/surface.css"].map((f) => split(read(f)));
const fb = ["kernels/frame.fallback.css", "kernels/surface.fallback.css"].map((f) =>
  split(read(f)),
);
const sheet = (kernels) =>
  kernels.map((k) => k[0]).join("") + "@layer k{" + kernels.map((k) => k[1]).join("") + "}";
const noContainer = (css) => css.replace(/@container[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");

export const SITES = `@layer s{
 .r24{--_r:24px}.r40{--_r:40px}.r8{--_r:8px}.p8{--_p:8px}.p6{--_p:6px}.p4{--_p:4px}.p2{--_p:2px}.p12{--_p:12px}.b2{--_b:2px}.b1{--_b:1px}.m3{--_m:3px}
 .base{--_k:#2b3a67}.up6{--_d:.06}.up6b{--_d:.06}.dn10{--_d:-.1}
 .con{--_d:calc(.15 * clamp(-1, (.5636 - l) * 1e6, 1))}
 .lightbase{--_k:#dde6f5}
 .hov:hover{--_p:20px;--_d:.2}
 @media (width < 500px){.resp{--_p:1px}}
}`;

// "sq": style queries only (reference). "poly": no @container rules, fallback CSS, engine forced.
// "both": everything, engine probes. "both-off": everything, no engine (checks the fallback CSS does no harm).
export const css = {
  sq: `@layer k,s;${sheet(parts)}${SITES}`,
  poly: `@layer k,s;${noContainer(sheet(parts))}${sheet(fb)}${read("kernels/poly.css")}${SITES}`,
  both: `@layer k,s;${sheet(parts)}${sheet(fb)}${read("kernels/poly.css")}${SITES}`,
};
export const engine = read("engine.js").replace("export default", "window.__poly =");

// BROWSER=chrome (installed Chrome, default) | firefox | webkit (playwright builds)
export const BROWSER = process.env.BROWSER ?? "chrome";
export const launch = (args = []) =>
  BROWSER === "firefox"
    ? firefox.launch()
    : BROWSER === "webkit"
      ? webkit.launch()
      : chromium.launch({ channel: "chrome", args });

export async function load(
  browser,
  mode,
  html,
  { run = mode === "poly" || mode === "both", force = mode === "poly" } = {},
) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.setContent(`<style>${css[mode]}</style><body>${html}</body>`);
  if (run) {
    await page.addScriptTag({ content: engine });
    await page.evaluate(([f, force]) => window.__poly(f, force), [FEATS, force]);
  }
  return page;
}

export const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((r) =>
        setTimeout(
          () => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 20))),
          0,
        ),
      ),
  );
