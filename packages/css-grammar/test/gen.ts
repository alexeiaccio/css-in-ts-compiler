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

function primitive(v: string, lo?: string, hi?: string): Arb | null {
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
      return ident.map((s) => `"${s}"`);
    case "custom-ident":
      return ident;
    case "dashed-ident":
      return ident.map((s) => `--${s}`);
    case "angle":
      return unit(["deg", "rad", "grad", "turn"], lo, hi);
    case "time":
      return unit(["s", "ms"], lo, hi);
    case "dimension":
      return unit([...LENGTH_UNITS, "deg", "s", "dppx", "fr"], lo, hi);
  }
  return null;
}

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
    case "lit":
      return fc.constant(n[1]);
    case "type": {
      const [, v, lo, hi] = n;
      const p = primitive(v, lo, hi);
      if (p) return p;
      return syns[v] ? sub(parse(syns[v])) : null;
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
