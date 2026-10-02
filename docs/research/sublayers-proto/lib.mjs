// Shared by audit.mjs and run.mjs: where the packages are, Chrome, and the sort variants.
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const here = import.meta.dirname;
export const repo = join(here, "../../..");
export const pkg = join(repo, "packages/cssints");
const modules = join(repo, "node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
export const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
export const launch = () => chromium.launch({ channel: "chrome" });

const req = createRequire(join(pkg, "package.json"));
export const MDN = req("mdn-data/css/properties.json");
export const lightningcss = req("lightningcss");
export const vite = await import(pathToFileURL(req.resolve("vite")).href);

// Chrome's expansion of each property: set to `initial`, a shorthand lists its longhands (reset-only ones too). Chrome keeps
// `all` as one entry, so that one is every longhand but direction and unicode-bidi. Unsupported properties are absent.
export const truthOf = async (page, props) => {
  const out = await page.evaluate((ps) => {
    const el = document.createElement("div");
    const t = {};
    for (const p of ps) {
      el.style.cssText = "";
      el.style.setProperty(p, "initial");
      if (el.style.length) t[p] = [...el.style].sort();
    }
    return t;
  }, props);
  if (out.all?.length === 1) {
    const longhands = new Set(Object.values(out).flat());
    for (const p of ["all", "direction", "unicode-bidi"]) longhands.delete(p);
    out.all = [...longhands].sort();
  }
  return out;
};

// The same from the spec data (@webref/css: `longhands`, and `resetLonghands` for what a shorthand resets without setting).
const WEB = new Map(
  createRequire(join(repo, "packages/css-grammar/package.json"))(
    "@webref/css/css.json",
  ).properties.map((p) => [p.name, p]),
);
export const webrefLeaves = (p) => {
  const e = WEB.get(p);
  const kids = [...(e?.longhands ?? []), ...(e?.resetLonghands ?? [])];
  return kids.length ? kids.flatMap(webrefLeaves) : [p];
};

// The leaves and the nesting depth of a property by mdn-data `computed`: what sheet.ts counts (leaves) and what a
// sublayer scheme would use (depth: a longhand 0, a shorthand 1 + its deepest member, `all` above everything).
export const leaves = (p) => {
  const c = MDN[p]?.computed;
  return p !== "all" && Array.isArray(c) ? c.flatMap(leaves) : [p];
};
export const depth = (p) => {
  const c = MDN[p]?.computed;
  return p !== "all" && Array.isArray(c) && c.length ? 1 + Math.max(...c.map(depth)) : 0;
};
export const ALL_DEPTH = 1 + Math.max(...Object.keys(MDN).map(depth));

// A sheet from the registry's rules with a chosen sort. `engine` is sheet.ts itself (renderSheet); the others are
// rendered here, one block per rule, which is the same cascade as the merged blocks of sheet.ts.
//   mdn         sheet.ts's comparator rebuilt here (a check that this renderer agrees with the real one)
//   truth       count of the leaves Chrome expands a property to (`all` included)
//   where       truth, and pseudo-classes inside :where(), so every class rule has the specificity of one class
//   sublayers   no shorthand order inside a layer; each layer L splits into L.d<depth>, deepest shorthand first
export const sheetOf = (rules, how, truth) => {
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const cmpCond = (a, b) =>
    a.reduce((d, x, i) => d || (i < b.length ? x - b[i] : 0), 0) || a.length - b.length;
  const wrapKey = (r) => r.wrap.join("{");
  const width = {
    mdn: (p) => new Set(leaves(p)).size,
    truth: (p) => truth[p]?.length ?? 1,
    where: (p) => truth[p]?.length ?? 1,
    sublayers: () => 0,
  }[how];
  const all = [...rules].map(([cls, r]) => ({ cls, ...r }));
  all.sort(
    (a, b) =>
      cmp(a.layer, b.layer) ||
      (how === "sublayers" ? depthOf(b.prop) - depthOf(a.prop) : 0) ||
      cmpCond(a.cond, b.cond) ||
      cmp(wrapKey(a), wrapKey(b)) ||
      width(b.prop) - width(a.prop) ||
      cmp(a.cls, b.cls),
  );
  const layerOf = (r) => (how === "sublayers" ? `${r.layer}.d${depthOf(r.prop)}` : r.layer);
  const names = ["_.k", "_.a", "_.b", "_.c", "_.d", "_.e"];
  const statement =
    how === "sublayers"
      ? names.flatMap((n) =>
          n === "_.k"
            ? [n]
            : Array.from({ length: ALL_DEPTH + 1 }, (_, d) => `${n}.d${ALL_DEPTH - d}`),
        )
      : names;
  const body = all
    .map((r) => {
      const open = r.wrap.map((w) => `${w}{`).join("");
      const css = how === "where" ? r.css.replace(/^(\.[\w-]+)(:[^{]+)\{/, "$1:where($2){") : r.css;
      return `@layer ${layerOf(r)}{${open}${css}${"}".repeat(r.wrap.length)}}`;
    })
    .join("\n");
  return `@layer ${statement.join(", ")};\n${body}\n`;
};
// all sits above every shorthand: the deepest of mdn-data, plus one
const depthOf = (p) => (p === "all" ? ALL_DEPTH : depth(p));
