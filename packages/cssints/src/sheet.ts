// The sheet: the @property rules of tokens, then the kernels, the css.global() rules and the token sets and themes (layer _.k), then every rule once, sorted by layer, condition, shorthand before
// longhand, class; the rules of one layer under the same at-rules share a block.

import { Effect } from "effect";

import { FALLBACK } from "./delivery.ts";
import { KERNEL } from "./kernel.ts";
import { width } from "./leaves.ts";
import { GLOBAL, type Kernel, type Rule, Registry, type Themed } from "./registry.ts";

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

/** Adds a global rule (`*{box-sizing:border-box}`) to layer _.k, once per key. No user API yet: for the engine and plugins. */
export const addGlobal = Effect.fn("cssints.addGlobal")(function* (key: string, css: string) {
  const { globals } = yield* Registry;
  if (!globals.has(key)) globals.set(key, css);
});

// What a module records of token sets and themes: those it made, and those that set or read a variable it uses (`names`).
// One line each, sorted by `key` when the sheet is rendered.
export const themedEntries = (
  themed: Map<string, Themed>,
  file: string,
  names: Set<string>,
): string[] =>
  [...themed.values()]
    .filter((t) => t.file === file || t.names.some((n) => names.has(n)))
    .map((t) => `${THEME}${t.key}\t${t.css}`);

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
    .filter((e) => e.startsWith(THEME))
    .map((e) => e.split("\t") as [string, string, string])
    .sort((a, b) => cmp(a[1], b[1]));
  const used = all
    .filter((e) => e.startsWith(KERNEL))
    .map((e) => JSON.parse(e.slice(KERNEL.length)) as Kernel)
    .sort((a, b) => cmp(a.key, b.key));
  const fallbacks = all
    .filter((e) => e.startsWith(FALLBACK))
    .map((e) => JSON.parse(e.slice(FALLBACK.length)) as string)
    .sort();
  const sorted = all
    .flatMap((cls) => {
      const rule = rules.get(cls);
      return rule ? [{ cls, ...rule }] : [];
    })
    .sort(byOrder);
  let out = `${LAYERS}\n${[...properties, ...used.flatMap((k) => k.atProperty ?? [])].map((p) => `${p}\n`).join("")}`;
  if (globals.size || used.length || fallbacks.length || themes.length)
    out += `@layer _.k {\n${[...globals.values(), ...used.map((k) => k.css), ...fallbacks, ...themes.map((t) => t[2])].map((g) => `  ${g}\n`).join("")}}\n`;
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
