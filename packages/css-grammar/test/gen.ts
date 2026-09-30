// Third interpretation of the same grammar tree: generate values instead of recognising them.
// arbFor(prop) is a fast-check Arbitrary of values the grammar says are valid.
import * as fc from "fast-check";

import { properties, syntaxes } from "../src/mdn.ts";
import { nullable, parse, type Node } from "./sync.ts";
import { magnitude } from "../src/twin-core.ts";

const props: Record<string, string> = properties;
const syns: Record<string, string> = syntaxes;
type Arb = fc.Arbitrary<string>;

const LENGTH_UNITS = [
  "px",
  "em",
  "rem",
  "vw",
  "vh",
  "vmin",
  "vmax",
  "ch",
  "ex",
  "lh",
  "rlh",
  "cm",
  "mm",
  "in",
  "pt",
  "pc",
  "q",
  "svw",
  "svh",
  "lvw",
  "lvh",
  "dvw",
  "dvh",
  "cqw",
  "cqh",
  "cqi",
  "cqb",
  "cqmin",
  "cqmax",
  "ic",
  "cap",
  "rex",
  "rch",
  "ric",
  "rcap",
];
const bound = (b: string | undefined, dflt: number) =>
  b === undefined || b === "∞" ? dflt : b === "-∞" ? -dflt : magnitude(b);
// A number within [lo,hi]; the bounds may carry a unit (`0s`, `-90deg`), and `u` is the unit the number gets.
const num = (lo?: string, hi?: string, int = false, u = ""): fc.Arbitrary<number> => {
  const scale = magnitude(`1${u}`);
  const min = bound(lo, 1000) / scale,
    max = bound(hi, 1000) / scale;
  return int
    ? fc.integer({ min: lo ? Math.ceil(min) : -100, max: Math.floor(max) })
    : fc
        .integer({ min: Math.ceil((lo ? min : -100) * 10), max: Math.floor(max * 10) })
        .map((x) => x / 10);
};
const unit = (us: string[], lo?: string, hi?: string) =>
  fc.constantFrom(...us).chain((u) => num(lo, hi, false, u).map((n) => `${n}${u}`));
const ident = fc.stringMatching(/^[a-z][a-z0-9-]{0,6}$/).map((s) => `x-${s}`);

// Math functions (css-values-4 §10) in the numeric positions: an expression of the calc type of the primitive, nested to
// depth 2. `MATH=0` leaves them out of the numeric primitives (the draws before cssints-91im, but for calc-size()).
type MathType =
  | "number"
  | "length"
  | "percentage"
  | "length-percentage"
  | "angle"
  | "time"
  | "resolution";
const MATH_TYPE: Record<string, MathType> = {
  number: "number",
  integer: "number",
  x: "number",
  y: "number",
  length: "length",
  percentage: "percentage",
  "length-percentage": "length-percentage",
  angle: "angle",
  time: "time",
  resolution: "resolution",
};
export const leaf = (t: MathType): Arb => {
  switch (t) {
    case "number":
      return fc.oneof(num().map(String), fc.constantFrom("pi", "e"));
    case "length":
      return unit(LENGTH_UNITS);
    case "percentage":
      return num().map((n) => `${n}%`);
    case "length-percentage":
      return fc.oneof(leaf("length"), leaf("percentage"));
    case "angle":
      return unit(["deg", "rad", "grad", "turn"]);
    case "time":
      return unit(["s", "ms"]);
    case "resolution":
      return unit(["dpi", "dpcm", "dppx", "x"]);
  }
};
const memo = new Map<string, Arb>();
const operand = (t: MathType, d: number): Arb => (d ? fc.oneof(leaf(t), mathArb(t, d)) : leaf(t));
export function mathArb(t: MathType, d = 2): Arb {
  const key = `${t} ${d}`;
  let a = memo.get(key);
  if (a) return a;
  const x = operand(t, d - 1),
    n = leaf("number"),
    strategy = fc.constantFrom("nearest", "up", "down", "to-zero");
  const alts: Arb[] = [
    fc.tuple(x, fc.constantFrom("+", "-"), x).map(([p, o, q]) => `calc(${p} ${o} ${q})`),
    fc.tuple(x, x).map(([p, q]) => `min(${p}, ${q})`),
    fc.tuple(x, x, x).map(([p, q, r]) => `max(${p}, ${q}, ${r})`),
    fc.tuple(x, x, x).map(([p, q, r]) => `clamp(${p}, ${q}, ${r})`),
    fc.tuple(x, x).map(([p, q]) => `clamp(none, ${p}, ${q})`),
    fc.tuple(x, x).map(([p, q]) => `clamp(${p}, ${q}, none)`),
    x.map((p) => `abs(${p})`),
    fc.tuple(x, x).map(([p, q]) => `round(${p}, ${q})`),
    fc.tuple(strategy, x, x).map(([m, p, q]) => `round(${m}, ${p}, ${q})`),
    fc.tuple(x, x).map(([p, q]) => `mod(${p}, ${q})`),
    fc.tuple(x, x).map(([p, q]) => `rem(${p}, ${q})`),
    fc.tuple(x, x).map(([p, q]) => `hypot(${p}, ${q})`),
    fc.tuple(x, n).map(([p, q]) => `calc(${p} * ${q})`),
    fc.tuple(n, x).map(([p, q]) => `calc(${p} * ${q})`),
    fc.tuple(x, n).map(([p, q]) => `calc(${p} / ${q})`),
    fc.tuple(x, x, n).map(([p, q, r]) => `calc((${p} + ${q}) * ${r})`),
    x.map((p) => `calc(${p})`),
  ];
  const nums = operand("number", d - 1);
  if (t === "number")
    alts.push(
      fc.tuple(strategy, n).map(([m, p]) => `round(${m}, ${p}, 1)`),
      nums.map((p) => `round(${p})`),
      nums.map((p) => `sin(${p})`),
      operand("angle", d - 1).map((p) => `cos(${p})`),
      nums.map((p) => `tan(${p})`),
      fc.oneof(x, leaf("length")).map((p) => `sign(${p})`),
      fc.tuple(nums, nums).map(([p, q]) => `pow(${p}, ${q})`),
      nums.map((p) => `sqrt(${p})`),
      nums.map((p) => `exp(${p})`),
      fc.tuple(nums, nums).map(([p, q]) => `log(${p}, ${q})`),
      nums.map((p) => `log(${p})`),
      fc.tuple(leaf("length"), leaf("length")).map(([p, q]) => `calc(${p} / ${q})`),
    );
  if (t === "angle")
    alts.push(
      nums.map((p) => `asin(${p})`),
      nums.map((p) => `acos(${p})`),
      nums.map((p) => `atan(${p})`),
      fc.tuple(leaf("length"), leaf("length")).map(([p, q]) => `atan2(${p}, ${q})`),
    );
  memo.set(key, (a = fc.oneof(...alts)));
  return a;
}
// a <calc-sum>, the argument of calc-size(): a length-percentage expression without the function around it
const calcSum = fc.oneof(
  operand("length-percentage", 1),
  fc
    .tuple(
      operand("length-percentage", 1),
      fc.constantFrom("+", "-"),
      operand("length-percentage", 1),
    )
    .map(([p, o, q]) => `${p} ${o} ${q}`),
  fc.tuple(operand("length-percentage", 1), leaf("number")).map(([p, q]) => `${p} * ${q}`),
);

function primitive(v: string, lo?: string, hi?: string): Arb | null {
  const p = plainPrimitive(v, lo, hi);
  if (v === "calc-sum") return calcSum;
  const t = MATH_TYPE[v];
  return p && t && process.env.MATH !== "0"
    ? fc.oneof({ weight: 5, arbitrary: p }, { weight: 1, arbitrary: mathArb(t) })
    : p;
}

function plainPrimitive(v: string, lo?: string, hi?: string): Arb | null {
  switch (v) {
    case "length":
      return fc.oneof(unit(LENGTH_UNITS, lo, hi), fc.constant("0"));
    case "percentage":
      return num(lo, hi).map((n) => `${n}%`);
    case "length-percentage":
      return fc.oneof(
        unit(LENGTH_UNITS, lo, hi),
        num(lo, hi).map((n) => `${n}%`),
        fc.constant("0"),
      );
    case "number":
      return num(lo, hi).map(String);
    case "integer":
      return num(lo, hi, true).map(String);
    case "hex-color":
      return fc
        .constantFrom(3, 4, 6, 8)
        .chain((n) => fc.stringMatching(new RegExp(`^[0-9a-f]{${n}}$`)))
        .map((h) => `#${h}`);
    case "string":
      return fc.oneof(
        ident.map((s) => `"${s}"`),
        fc.tuple(ident, ident).map(([a, b]) => `'${a}, (${b})'`),
      );
    case "custom-ident":
    case "ident":
    case "ident-token":
      return ident;
    case "dashed-ident":
      return ident.map((s) => `--${s}`);
    case "angle":
      return unit(["deg", "rad", "grad", "turn"], lo, hi);
    case "time":
      return unit(["s", "ms"], lo, hi);
    case "dimension":
      return unit([...LENGTH_UNITS, "deg", "s", "dppx", "fr"], lo, hi);
    case "resolution":
      return unit(["dpi", "dpcm", "dppx", "x"], lo, hi);
    case "flex":
      return num(lo, hi).map((n) => `${n}fr`);
    case "zero":
      return fc.constantFrom("0", "+0", "-0");
    case "hash-token":
      return ident.map((s) => `#${s}`);
    case "intrinsic-size-keyword":
      return fc.constantFrom("min-content", "max-content", "fit-content", "stretch");
    case "x":
    case "y":
      return num().map(String);
    case "url":
      return fc.oneof(
        ident.map((s) => `url(${s})`),
        ident.map((s) => `url("${s} b")`),
      );
    case "declaration":
      // alternates over every property, and the properties reach <color>, which reaches <if()>, which reaches this:
      // three stand for it
      return fc.constantFrom("display : grid", "color : red", "--x : 1");
    case "declaration-value":
      // words, numbers and a balanced function
      return fc
        .array(
          fc.oneof(
            ident,
            num().map(String),
            ident.map((s) => `f(${s}, [1])`),
          ),
          { minLength: 1, maxLength: 3 },
        )
        .map((xs) => xs.join(" "));
  }
  return null;
}

// Relative colour: the grammar has `from <color>` and numbers, the channel keywords are prose (css-color-5 §4). Each
// component is a keyword of the function (any, `alpha` included: css-color-5 §4.1 "you can use them in any position"),
// `none`, a number or a math function over a keyword. No var(): Chrome takes any value with a var() in it, whatever the grammar says.
const RELATIVE: [fn: string, space: string, channels: string[]][] = [
  ...["rgb", "rgba"].map((f) => [f, "", ["r", "g", "b", "alpha"]] as [string, string, string[]]),
  ...["hsl", "hsla"].map((f) => [f, "", ["h", "s", "l", "alpha"]] as [string, string, string[]]),
  ["hwb", "", ["h", "w", "b", "alpha"]],
  ...["lab", "oklab"].map((f) => [f, "", ["l", "a", "b", "alpha"]] as [string, string, string[]]),
  ...["lch", "oklch"].map((f) => [f, "", ["l", "c", "h", "alpha"]] as [string, string, string[]]),
  ["color", "display-p3 ", ["r", "g", "b", "alpha"]],
  ["color", "xyz-d65 ", ["x", "y", "z", "alpha"]],
];
const relative = (origin: Arb): Arb =>
  fc.constantFrom(...RELATIVE).chain(([f, space, ks]) => {
    const key = fc.constantFrom(...ks);
    const part = fc.oneof(
      key,
      fc.constant("none"),
      num("0").map(String),
      key.map((k) => `calc(${k} * 2)`),
      key.map((k) => `calc(${k} + 1)`),
      key.map((k) => `min(${k}, 10)`),
      key.map((k) => `clamp(0, ${k}, 255)`),
      key.map((k) => `round(${k}, 1)`),
    );
    return fc
      .tuple(origin, fc.array(part, { minLength: 3, maxLength: 3 }), fc.option(part, { nil: "" }))
      .map(([o, cs, a]) => `${f}(from ${o} ${space}${cs.join(" ")}${a ? ` / ${a}` : ""})`);
  });

// Pending substitution: now and then a keyword or a primitive is a `var(--x)`, which stands for any value there, so the
// value stays valid. Chrome takes every value with a var() in it, whatever the grammar says, so it cannot judge these (its
// verdicts on them are in the catalogue as "chrome accepts"); the twin and the types must. `VAR=0` leaves them out.
// Not inside the arguments of var() and if(): the twin checks those calls (the name, the conditions).
let inCall = 0;
const holed = (a: Arb): Arb =>
  inCall || process.env.VAR === "0"
    ? a
    : fc.oneof({ weight: 12, arbitrary: a }, { weight: 1, arbitrary: fc.constant("var(--x)") });

// null = this node cannot be generated (opaque, unknown type, too deep); alternatives route around it.
export function arb(n: Node, depth = 0): Arb | null {
  if (depth > 12) return null;
  const sub = (x: Node) => arb(x, depth + 1);
  const all = (xs: Node[]) => {
    const as = xs.map(sub);
    return as.every(Boolean) ? (as as Arb[]) : null;
  };
  switch (n[0]) {
    case "kw":
      return holed(fc.constant(n[1]));
    case "lit":
      return fc.constant(n[1]);
    case "type": {
      const [, v, lo, hi] = n;
      const p = primitive(v, lo, hi);
      if (p) return holed(p);
      const call = v === "if()" || v === "var()";
      if (call) inCall++;
      const g = syns[v] ? sub(parse(syns[v])) : null;
      if (call) inCall--;
      const origin = v === "color" && depth < 8 ? sub(n) : null;
      return g && origin ? fc.oneof(g, relative(origin)) : g;
    }
    case "prop":
      return props[n[1]] ? sub(parse(props[n[1]]!)) : null;
    case "fn": {
      const a = sub(n[2]);
      return a && a.map((x) => `${n[1]}(${x})`);
    }
    case "alt": {
      const as = n[1].map(sub).filter((a): a is Arb => !!a);
      return as.length ? fc.oneof(...as) : null;
    }
    case "seq": {
      const as = all(n[1]);
      return as && fc.tuple(...as).map((ps) => join(commas(n[1], ps)));
    }
    case "opt": {
      const a = sub(n[1]);
      return a ? fc.option(a, { nil: "" }) : fc.constant("");
    }
    case "star":
    case "plus":
    case "rep": {
      const a = sub(n[1]);
      const lo = n[0] === "rep" ? Number(n[2]) : n[0] === "plus" ? 1 : 0;
      const hi = n[0] === "rep" && n[3] !== "∞" ? Number(n[3]) : lo + 3;
      return a
        ? fc.array(a, { minLength: lo, maxLength: hi }).map(join)
        : lo === 0
          ? fc.constant("")
          : null;
    }
    case "bang": {
      // non-empty group: one of its optional parts is made required. Not a filter: deep down fc.option always
      // picks nil, and the filter never ends.
      const xs = n[1][0] === "seq" ? n[1][1] : [n[1]];
      const forced = xs.flatMap((x, i) =>
        x[0] === "opt" ? [sub(["seq", xs.map((y, j) => (j === i ? x[1] : y))])] : [],
      );
      if (!forced.length) return sub(n[1]);
      const as = forced.filter((a): a is Arb => !!a);
      return as.length ? fc.oneof(...as) : null;
    }
    case "list": {
      const a = sub(n[1]);
      return a && fc.array(a, { minLength: 1, maxLength: 3 }).map((xs) => xs.join(", "));
    }
    case "or":
    case "and": {
      // || : a non-empty subset in any order; && : every part in any order
      const parts = n[1].map(sub);
      const ok = parts.flatMap((a, i) => (a ? [i] : []));
      if (n[0] === "and" && ok.length !== parts.length) return null;
      if (!ok.length) return null;
      return fc
        .shuffledSubarray(ok, { minLength: n[0] === "and" ? ok.length : 1 })
        .chain((is) => fc.tuple(...is.map((i) => parts[i]!)).map(join));
    }
  }
}

// Comma omission, as in twin.ts `seq`: drop a `,` with nothing emitted since the seq start or the previous comma
// (never before the first term), or with only omitted nullable terms after it.
function commas(xs: Node[], ps: string[]): string[] {
  let first = true,
    since = false;
  return ps.map((p, i) => {
    const x = xs[i]!;
    if (x[0] !== "lit" || x[1] !== ",") return ((first = false), (since ||= p !== ""), p);
    if (!first && !since) return "";
    if (
      i + 1 < xs.length &&
      xs.slice(i + 1).every(nullable) &&
      ps.slice(i + 1).every((q) => q === "")
    )
      return "";
    first = since = false;
    return p;
  });
}

const join = (xs: string[]) => xs.filter(Boolean).join(" ").replace(/ ,/g, ",");

export const arbFor = (prop: string): Arb | null => (props[prop] ? arb(parse(props[prop])) : null);
