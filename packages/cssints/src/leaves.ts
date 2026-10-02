// The longhands a property sets, as Chrome expands it (css-grammar longhands.ts). The sheet orders more leaves first,
// so a shorthand comes before every longhand it contains; cn() tells same, containing and overlapping properties apart.
import { longhands } from "@cssints/css-grammar/longhands";

// The longhands a property sets: itself when it is a longhand.
export const leaves = (p: string): readonly string[] => longhands[p] ?? [p];

// How many longhands a property sets: the sheet puts more first.
export const width = (p: string): number => leaves(p).length;

// A logical longhand and the physical ones of its group are one value in the cascade (css-logical-1 §4): which wins is
// the order. A longhand's group and side: margin-inline-start is ["margin-*", "inline-start"], top is ["inset-*", "top"].
const SIDE: [RegExp, (m: RegExpMatchArray) => [string, string]][] = [
  [/^border-(top|bottom)-(left|right)-radius$/, (m) => ["border-*-radius", `${m[1]}-${m[2]}`]],
  [/^border-(start|end)-(start|end)-radius$/, (m) => ["border-*-radius", `${m[1]}-${m[2]}`]],
  [/^(top|right|bottom|left)$/, (m) => ["inset-*", m[1]!]],
  [/^inset-((?:block|inline)-(?:start|end))$/, (m) => ["inset-*", m[1]!]],
  [/^(.+)-((?:block|inline)-(?:start|end))(-.+)?$/, (m) => [`${m[1]}-*${m[3] ?? ""}`, m[2]!]],
  [/^(.+)-(top|right|bottom|left)(-.+)?$/, (m) => [`${m[1]}-*${m[3] ?? ""}`, m[2]!]],
  [/^((?:min-|max-|contain-intrinsic-)?)(width|height)$/, (m) => [`${m[1]}size`, m[2]!]],
  [/^((?:min-|max-|contain-intrinsic-)?)(inline|block)-size$/, (m) => [`${m[1]}size`, m[2]!]],
  [/^(overflow|overscroll-behavior)-(x|y|inline|block)$/, (m) => [m[1]!, m[2]!]],
];
// Every side of a group, physical or logical: a property that sets all of one covers whatever a sibling sets.
const FAMILIES = [
  ["top", "right", "bottom", "left"],
  ["block-start", "block-end", "inline-start", "inline-end"],
  ["top-left", "top-right", "bottom-left", "bottom-right"],
  ["start-start", "start-end", "end-start", "end-end"],
  ["width", "height"],
  ["inline", "block"],
  ["x", "y"],
];
const LOGICAL = new Set(FAMILIES.filter((_, i) => i % 2).flat());
const sideOf = (l: string): [string, string] | undefined => {
  for (const [re, f] of SIDE) {
    const m = l.match(re);
    if (m) return f(m);
  }
  return undefined;
};
const groups = (p: string) => {
  const out = new Map<string, Set<string>>();
  for (const l of leaves(p)) {
    const s = sideOf(l);
    if (s) (out.get(s[0]) ?? out.set(s[0], new Set()).get(s[0])!).add(s[1]);
  }
  return out;
};
const full = (sides: Set<string> | undefined) =>
  !!sides && FAMILIES.some((f) => f.every((x) => sides.has(x)));

// A covers B when everything B sets, A sets too: each longhand of B is one of A's, or a side of a group A sets whole.
const covers = (a: string, b: string) => {
  const la = leaves(a);
  const ga = groups(a);
  return leaves(b).every((l) => la.includes(l) || full(ga.get(sideOf(l)?.[0] ?? "")));
};
// They meet when they share a longhand, or one sets a logical side and the other a physical side of the same group
// (which physical side a logical one is depends on the writing mode).
const meet = (a: string, b: string) => {
  const lb = leaves(b);
  if (leaves(a).some((l) => lb.includes(l))) return true;
  const gb = groups(b);
  return [...groups(a)].some(
    ([g, sa]) =>
      gb.has(g) &&
      [...sa].some((x) => LOGICAL.has(x)) !== [...gb.get(g)!].some((x) => LOGICAL.has(x)),
  );
};

// How two properties meet in one class string: "same" (each covers the other: equal or an alias), "contains" (either
// way), "overlap", or "apart".
export function relation(a: string, b: string): "same" | "contains" | "overlap" | "apart" {
  if (a === b) return "same";
  const ab = covers(a, b);
  const ba = covers(b, a);
  if (ab && ba) return "same";
  if (ab || ba) return "contains";
  return meet(a, b) ? "overlap" : "apart";
}
