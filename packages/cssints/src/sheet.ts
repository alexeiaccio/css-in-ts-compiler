// The sheet: the @property rules of tokens, then the global rules and the token sets and themes (layer _.k), then every rule once, sorted by layer, condition, shorthand before
// longhand, class; the rules of one layer under the same at-rules share a block.
import { createRequire } from "node:module";

import { Effect } from "effect";

import { KERNEL } from "./kernel.ts";
import { type Kernel, type Rule, Registry, type Themed } from "./registry.ts";

// The entries of token sets and themes start with this and a tab: `@theme\t<key>\t<css>`.
const THEME = "@theme\t";

// _.k is the layer of global rules (addGlobal, kernels), below every class layer: _.a (no condition) to _.e (four).
export const LAYERS = "@layer _.k, _.a, _.b, _.c, _.d, _.e;";

interface MdnProperty {
  computed?: string | string[];
}

// A is a shorthand of B when every leaf longhand of B is among A's leaves (mdn-data `computed`; the direct lists
// miss border > border-top). More leaves first is a total order that keeps that relation.
const MDN = createRequire(import.meta.url)("mdn-data/css/properties.json") as Record<
  string,
  MdnProperty | undefined
>;
const leaves = (p: string): string[] => {
  const computed = MDN[p]?.computed;
  return p !== "all" && Array.isArray(computed) ? computed.flatMap(leaves) : [p];
};
const WIDTH = new Map<string, number>();
const width = (p: string): number => WIDTH.get(p) ?? WIDTH.set(p, new Set(leaves(p)).size).get(p)!;

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
  const sorted = all
    .flatMap((cls) => {
      const rule = rules.get(cls);
      return rule ? [{ cls, ...rule }] : [];
    })
    .sort(byOrder);
  let out = `${LAYERS}\n${[...properties, ...used.flatMap((k) => k.atProperty ?? [])].map((p) => `${p}\n`).join("")}`;
  if (globals.size || used.length || themes.length)
    out += `@layer _.k {\n${[...globals.values(), ...used.map((k) => k.css), ...themes.map((t) => t[2])].map((g) => `  ${g}\n`).join("")}}\n`;
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
