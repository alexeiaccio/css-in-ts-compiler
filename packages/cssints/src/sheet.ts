// The sheet: the @property rules of tokens, then the kernels, the css.global() rules, the token sets and themes and the data of the derived-token runtime (layer _.k), then every rule once, sorted by layer, condition, shorthand before
// longhand, class; the rules of one layer under the same at-rules share a block.

import { Effect, Schema } from "effect";

import { FALLBACK } from "./delivery.ts";
import { derivedRule } from "./derived-data.ts";
import { KERNEL } from "./kernel.ts";
import { width } from "./leaves.ts";
import { GLOBAL, type Kernel, type Rule, Registry, type Themed } from "./registry.ts";

// @effect-diagnostics-next-line schemaSync:off -- the entries are what formatJson wrote, read back in a sync map
const fromJson = Schema.decodeSync(Schema.fromJsonString(Schema.Unknown));

// The entries of token sets and themes start with this and a tab: `@theme\t<key>\t<css>`.
const THEME = "@theme\t";

// _.k is the layer of global rules (addGlobal, kernels), below every class layer: _.a (no condition) to _.e (four).
export const LAYERS = "@layer _.k, _.a, _.b, _.c, _.d, _.e;";

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const cmpCond = (a: number[], b: number[]) =>
  a.reduce((d, x, i) => d || (i < b.length ? x - b[i]! : 0), 0) || a.length - b.length;

type Sortable = Rule & { cls: string };
const wrapKey = (r: Rule) => r.wrap.join("{");
const byOrder = (a: Sortable, b: Sortable) =>
  cmp(a.layer, b.layer) ||
  cmpCond(a.cond, b.cond) ||
  cmp(wrapKey(a), wrapKey(b)) ||
  width(b.prop) - width(a.prop) ||
  cmp(a.cls, b.cls);

/** Adds a global rule (`*{box-sizing:border-box}`) once per key. `layer` names a top-level layer to wrap it in, `null` prints it verbatim at the top (an `@layer a, b;` order statement), and no layer puts it in `_.k`. No user API yet: for the engine and plugins. */
export const addGlobal = Effect.fn("cssints.addGlobal")(function* (
  key: string,
  css: string,
  layer?: string | null,
) {
  const { globals } = yield* Registry;
  if (!globals.has(key)) globals.set(key, layer === undefined ? { css } : { css, layer });
});

// What a module records of token sets and themes: those it made, and those that set or read a variable it uses (`names`).
// One line each, sorted by `key` when the sheet is rendered.
export const themedEntries = (
  themed: Map<string, Themed>,
  file: string,
  names: Set<string>,
): string[] =>
  [...themed.values()].flatMap((t) =>
    t.file === file || t.names.some((n) => names.has(n))
      ? [`${THEME}${t.key}\t${t.layer ?? ""}\t${t.css}`]
      : [],
  );

// The variables that the global rules of `file` read: their tokens need a `@property` rule in its sheet.
export const globalNames = (themed: Map<string, Themed>, file: string): string[] =>
  [...themed.values()]
    .filter((t) => t.file === file && t.key.startsWith(GLOBAL))
    .flatMap((t) => t.css.match(/--[\w-]+/g) ?? []);

// Adds to `names` the tokens that those are made of: a derived token is `oklch(0.6 0.2 var(--hue-accent))`, no colour
// unless `--hue-accent` has its @property rule, and so is a theme value that refers to a token. Through chains.
export const closeNames = (
  names: Set<string>,
  defs: Map<string, { refs?: string[] }>,
  themed: Map<string, Themed>,
): void => {
  for (let size = -1; size !== names.size; ) {
    size = names.size;
    for (const n of [...names]) defs.get(n)?.refs?.forEach((r) => names.add(r));
    for (const t of themed.values())
      if (t.names.some((n) => names.has(n))) t.css.match(/--[\w-]+/g)?.forEach((n) => names.add(n));
  }
};

/** The rules of `entries`: class names, and the text of `@property` rules (once each, whichever module has them). */
export const renderSheet = Effect.fn("cssints.renderSheet")(function* (
  entries: Iterable<string>,
): Effect.fn.Return<string> {
  const { rules, globals } = yield* Registry;
  const all = [...new Set(entries)];
  const properties = all.filter((e) => e.startsWith("@property")).sort();
  const themes = all
    .flatMap((e) =>
      e.startsWith(THEME) ? [e.split("\t") as [string, string, string, string]] : [],
    )
    .sort((a, b) => cmp(a[1], b[1]));
  const kThemes = themes.filter((t) => t[2] === "");
  const topThemes = themes.filter((t) => t[2] !== "");
  const used = all
    .flatMap((e) => (e.startsWith(KERNEL) ? [fromJson(e.slice(KERNEL.length)) as Kernel] : []))
    .sort((a, b) => cmp(a.key, b.key));
  const fallbacks = all
    .flatMap((e) => (e.startsWith(FALLBACK) ? [fromJson(e.slice(FALLBACK.length)) as string] : []))
    .sort();
  const derived = yield* derivedRule(
    properties,
    themes.map((t) => t[1]),
  );
  const sorted = all
    .flatMap((cls) => {
      const rule = rules.get(cls);
      return rule ? [{ cls, ...rule }] : [];
    })
    .sort(byOrder);
  const allGlobals = [...globals.values()];
  const kGlobals = allGlobals.filter((g) => g.layer === undefined).map((g) => g.css);
  const topGlobals = allGlobals.filter((g) => g.layer !== undefined);
  const verbatim = topGlobals.filter((g) => g.layer === null);
  const layered = topGlobals.filter((g) => typeof g.layer === "string");
  let out = `${LAYERS}\n${[...properties, ...used.flatMap((k) => k.atProperty ?? [])].map((p) => `${p}\n`).join("")}`;
  if (kGlobals.length || used.length || fallbacks.length || kThemes.length)
    out += `@layer _.k {\n${[...kGlobals, ...used.map((k) => k.css), ...fallbacks, ...kThemes.map((t) => t[3]), ...(derived ? [derived] : [])].map((g) => `  ${g}\n`).join("")}}\n`;
  // Named top-level layers (a look's `@layer app`): declared after `_.k` and the class layers, so a look beats the
  // engine's `:root` fallbacks. Verbatim globals (an `@layer a, b;` order statement) print first, so the order they
  // name is the one that holds.
  for (const g of verbatim) out += `${g.css}\n`;
  for (const g of layered) out += `@layer ${g.layer} {\n  ${g.css}\n}\n`;
  for (const t of topThemes) out += `@layer ${t[2]} {\n  ${t[3]}\n}\n`;
  let layer = "";
  let wrap = ""; // the at-rules that are open
  let depth = 0;
  const closeWrap = () => (out += depth ? `  ${"}".repeat(depth)}\n` : "");
  for (const r of sorted) {
    const key = wrapKey(r);
    if (r.layer !== layer) {
      closeWrap();
      out += `${layer ? "}\n" : ""}@layer ${r.layer} {\n`;
      layer = r.layer;
      wrap = "";
      depth = 0;
    }
    if (key !== wrap) {
      closeWrap();
      wrap = key;
      depth = r.wrap.length;
      if (depth) out += `  ${r.wrap.map((w) => `${w} {`).join(" ")}\n`;
    }
    out += `${depth ? "    " : "  "}${r.css}\n`;
  }
  closeWrap();
  return layer ? `${out}}\n` : out;
});
