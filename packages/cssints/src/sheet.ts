// The sheet: every rule once, sorted by layer, condition, shorthand before longhand, class.
import { createRequire } from "node:module";

import { Effect } from "effect";

import { type Rule, Registry } from "./registry.ts";

export const LAYERS = "@layer _.a, _.b, _.c, _.d, _.e;";

interface MdnProperty {
  computed?: string | string[];
}

// A is a shorthand of B when every leaf longhand of B is among A's leaves (mdn-data `computed`; the direct lists
// miss border > border-top). More leaves first is a total order that keeps that relation.
const MDN = createRequire(import.meta.url)("mdn-data/css/properties.json") as Record<string, MdnProperty | undefined>;
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
const byOrder = (a: Sortable, b: Sortable) =>
  cmp(a.layer, b.layer) || cmpCond(a.cond, b.cond) || width(b.prop) - width(a.prop) || cmp(a.cls, b.cls);

export const renderSheet = Effect.fn("cssints.renderSheet")(function* (classes: Iterable<string>): Effect.fn.Return<string> {
  const { rules } = yield* Registry;
  const sorted = [...new Set(classes)]
    .flatMap((cls) => {
      const rule = rules.get(cls);
      return rule ? [{ cls, ...rule }] : [];
    })
    .sort(byOrder);
  let out = `${LAYERS}\n`;
  sorted.forEach((r, i) => {
    if (r.layer !== sorted[i - 1]?.layer) out += `${i ? "}\n" : ""}@layer ${r.layer} {\n`;
    out += `  ${r.css}\n`;
  });
  return sorted.length ? `${out}}\n` : out;
});
