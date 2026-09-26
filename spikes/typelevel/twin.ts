// Runtime twin of css.ts, arktype style: the same lexer, parser and recognizer written as functions, one per
// type, same names in lower case (Next/next, Parse/parse, Consume/consume, Valid/valid). Change them together.
//
// Where the type level has to give up, the twin is stricter: numeric ranges like `[0,∞]`, `${number}`
// accepting "1 " (so "1 rem"), hex digits, empty idents, more than 8 repetitions. The twin also reports the
// furthest point the value reached and what the grammar expected there.
import { properties, syntaxes } from "./mdn.ts";

const props: Record<string, string> = properties;
const syns: Record<string, string> = syntaxes;

// ---------------------------------------------------------------- lexer: one token at a time

const trim = (s: string) => s.replace(/^[ \n\t]+/, "");

type Tok =
  | { t: "type"; v: string; lo?: string; hi?: string } | { t: "prop"; v: string } | { t: "kw"; v: string } | { t: "fn"; v: string }
  | { t: "range"; lo: string; hi: string } | { t: "p"; v: string } | { t: "eof" };

export function next(s: string): [Tok, string] {
  s = trim(s);
  if (s === "") return [{ t: "eof" }, ""];
  let m: RegExpExecArray | null;
  if ((m = /^<'([^']*)'>/.exec(s))) return [{ t: "prop", v: m[1]! }, s.slice(m[0].length)];
  if ((m = /^<([^>]*)>/.exec(s))) {
    const [v, range] = m[1]!.split(" [") as [string, string?];
    const [lo, hi] = range ? range.slice(0, -1).split(",") : [];
    return [{ t: "type", v, lo, hi }, s.slice(m[0].length)];
  }
  if ((m = /^(\|\||&&)/.exec(s))) return [{ t: "p", v: m[1]! }, s.slice(2)];
  if ((m = /^\{([^}]*)\}/.exec(s))) {
    const [lo, hi = lo] = m[1]!.split(",") as [string, string?];
    return [{ t: "range", lo, hi }, s.slice(m[0].length)];
  }
  if ((m = /^[[\])|?*+#!,/]/.exec(s))) return [{ t: "p", v: m[0] }, s.slice(1)];
  if ((m = /^[^()[\]|&?*+#!,/{}<>' \n\t]+(?=[ \n\t]|$)/.exec(s))) return [{ t: "kw", v: m[0] }, s.slice(m[0].length)];
  const w = /^[A-Za-z0-9_-]*/.exec(s)![0];
  const r = s.slice(w.length);
  if (w === "") return [{ t: "eof" }, ""];
  return r.startsWith("(") ? [{ t: "fn", v: w }, r.slice(1)] : [{ t: "kw", v: w }, r];
}

// ---------------------------------------------------------------- parser  (alt < or(||) < and(&&) < seq < term+mult)
// Same node shapes as css.ts, except alternatives are a flat list (the cons list only exists for tsc) and
// `type` keeps its numeric range.

export type Node =
  | ["kw", string] | ["type", string, string?, string?] | ["prop", string] | ["fn", string] | ["lit", string]
  | ["alt", Node[]] | ["or", Node[]] | ["and", Node[]] | ["seq", Node[]]
  | ["opt", Node] | ["star", Node] | ["plus", Node] | ["list", Node] | ["rep", Node, string, string];

const parsed = new Map<string, Node>();
export function parse(s: string): Node {
  let n = parsed.get(s);
  if (!n) parsed.set(s, (n = parseAlt(s)[0]));
  return n;
}

const infix = (tag: "alt" | "or" | "and", op: string, sub: (s: string) => [Node, string]) => (s: string): [Node, string] => {
  const xs: Node[] = [];
  for (;;) {
    const [n, r] = sub(s);
    xs.push(n);
    const [t, r2] = next(r);
    if (t.t === "p" && t.v === op) s = r2;
    else return [xs.length === 1 ? xs[0]! : [tag, xs], r];
  }
};
const parseAnd = infix("and", "&&", parseSeq);
const parseOr = infix("or", "||", parseAnd);
const parseAlt = infix("alt", "|", parseOr);

function parseSeq(s: string): [Node, string] {
  const xs: Node[] = [];
  for (;;) {
    const [t] = next(s);
    if (t.t === "eof" || (t.t === "p" && ["|", "||", "&&", "]", ")"].includes(t.v))) return [xs.length === 1 ? xs[0]! : ["seq", xs], s];
    const [n, r] = parseTerm(s);
    xs.push(n);
    s = r;
  }
}

function parseTerm(s: string): [Node, string] {
  const [t, r] = next(s);
  if (t.t === "p" && t.v === "[") {
    const [n, r2] = parseAlt(r);
    const [close, r3] = next(r2);
    if (close.t !== "p" || close.v !== "]") throw new SyntaxError(`grammar: expected "]" at "${r2}"`);
    return mult(n, r3);
  }
  if (t.t === "fn") return mult(["fn", t.v], skipFn(r));
  if (t.t === "type") return mult(t.lo === undefined ? ["type", t.v] : ["type", t.v, t.lo, t.hi], r);
  if (t.t === "prop" || t.t === "kw") return mult([t.t, t.v], r);
  if (t.t === "p" && (t.v === "," || t.v === "/")) return mult(["lit", t.v], r);
  throw new SyntaxError(`grammar: unexpected token at "${s}"`);
}

// function arguments are not modelled yet: skip to the matching ")" (depth-aware).
function skipFn(s: string): string {
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") d++;
    else if (s[i] === ")" && d-- === 0) return s.slice(i + 1);
  }
  return "";
}

const MULT: Record<string, "opt" | "star" | "plus" | "list"> = { "?": "opt", "*": "star", "+": "plus", "#": "list" };
function mult(n: Node, s: string): [Node, string] {
  for (;;) {
    const [t, r] = next(s);
    if (t.t === "p" && MULT[t.v]) n = [MULT[t.v]!, n];
    else if (t.t === "range") n = ["rep", n, t.lo, t.hi];
    else if (!(t.t === "p" && t.v === "!")) return [n, s];
    s = r;
  }
}

// ---------------------------------------------------------------- value recognizer
// consume(n, s) = set of possible remainders after n matched a prefix of s. s is left-trimmed.

function tok1(s: string): [string, string] {
  const i = s.indexOf(" ");
  const [t, r] = i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)];
  const j = t.indexOf(",");
  return j < 0 ? [t, r] : [t.slice(0, j), `${t.slice(j)} ${r}`];
}

const NUM = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;
const LENGTH_UNIT = "px|em|rem|vw|vh|vmin|vmax|ch|ex|lh|rlh|cm|mm|in|pt|pc|q|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|ic|cap|rex|rch|ric|rcap";
const re = (s: string) => new RegExp(`^(?:${s})$`);
const PRIMITIVE: Record<string, RegExp> = {
  length: re(`${NUM}(?:${LENGTH_UNIT})|0`),
  percentage: re(`${NUM}%`),
  "length-percentage": re(`${NUM}(?:${LENGTH_UNIT})|0|${NUM}%`),
  number: re(NUM),
  integer: re(String.raw`[+-]?\d+`),
  "hex-color": /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  string: /^(?:"[^"]*"|'[^']*')$/,
  "custom-ident": /^.+$/,
  "dashed-ident": /^--.+$/,
  angle: re(`${NUM}(?:deg|rad|grad|turn)`),
  time: re(`${NUM}(?:s|ms)`),
};
// Recursive syntaxes we do not descend into: the whole `name(...)` chunk is accepted as opaque.
const OPAQUE = new Set(["calc-sum", "calc-size()", "anchor-size()", "color-function", "light-dark()"]);

interface Ctx {
  len: number;
  far: number;
  expected: Set<string>;
}
// Furthest failure wins: its position is where the value went wrong, its labels are what was expected there.
function fail(ctx: Ctx, s: string, what: string) {
  const at = ctx.len - s.length;
  if (at > ctx.far) (ctx.far = at), (ctx.expected = new Set());
  if (at === ctx.far) ctx.expected.add(what);
}

const NONE = new Set<string>();
const union = (sets: Iterable<Set<string>>) => {
  const out = new Set<string>();
  for (const s of sets) for (const r of s) out.add(r);
  return out;
};
const flatMap = (rs: Set<string>, f: (r: string) => Set<string>) => union([...rs].map(f));

// `label` is the outermost named type we are inside, so errors say <color> rather than "aliceblue | ...".
export function consume(n: Node, s: string, ctx: Ctx, label?: string): Set<string> {
  const leaf = (ok: boolean, rest: string, what: string) => (ok ? new Set([trim(rest)]) : (fail(ctx, s, label ?? what), NONE));
  const sub = (x: Node, r: string) => consume(x, r, ctx, label);
  switch (n[0]) {
    case "kw": {
      const [t, r] = tok1(s);
      return leaf(t === n[1], r, n[1]);
    }
    case "lit":
      return leaf(s.startsWith(n[1]), s.slice(n[1].length), `'${n[1]}'`);
    case "type":
      return consumeType(n, s, ctx, label);
    case "prop": {
      const g = props[n[1]];
      return g ? consume(parse(g), s, ctx, label ?? `<'${n[1]}'>`) : leaf(false, s, `<'${n[1]}'>`);
    }
    case "fn": {
      // ponytail: inner args not checked yet, same as css.ts
      const close = s.indexOf(")");
      return leaf(s.startsWith(`${n[1]}(`) && close > 0, s.slice(close + 1), `${n[1]}()`);
    }
    case "alt":
      return union(n[1].map((x) => sub(x, s)));
    case "seq":
      return seq(n[1], s, sub);
    case "opt":
      return new Set([s, ...sub(n[1], s)]);
    case "star":
      return closure(new Set([s]), (r) => sub(n[1], r));
    case "plus":
      return closure(sub(n[1], s), (r) => sub(n[1], r));
    case "list":
      return closure(sub(n[1], s), (r) => (r.startsWith(",") ? sub(n[1], trim(r.slice(1))) : NONE));
    case "rep":
      return rep(s, Number(n[2]), n[3] === "∞" ? Infinity : Number(n[3]), (r) => sub(n[1], r));
    case "or":
      return anyOrder(n[1], s, false, sub);
    case "and":
      return anyOrder(n[1], s, true, sub);
  }
}

function consumeType([, v, lo, hi]: ["type", string, string?, string?], s: string, ctx: Ctx, label?: string): Set<string> {
  let rs: Set<string>;
  if (PRIMITIVE[v]) {
    const [t, r] = tok1(s);
    rs = PRIMITIVE[v].test(t) ? new Set([trim(r)]) : NONE;
  } else if (OPAQUE.has(v)) {
    const m = /^[^(]*\([^)]*\)/.exec(s);
    rs = m ? new Set([trim(s.slice(m[0].length))]) : NONE;
  } else if (v.endsWith("()")) return consume(["fn", v.slice(0, -2)], s, ctx, label);
  else if (syns[v]) rs = consume(parse(syns[v]), s, ctx, label ?? `<${v}>`);
  else rs = NONE;
  if (rs === NONE) fail(ctx, s, label ?? `<${v}>`);
  if (lo === undefined || hi === undefined) return rs;
  // Ranges: the type level strips them, the twin checks the number that was consumed.
  const bound = (b: string) => (b === "∞" ? Infinity : b === "-∞" ? -Infinity : Number(b));
  const out = new Set<string>();
  for (const r of rs) {
    const x = parseFloat(s.slice(0, s.length - r.length));
    if (Number.isNaN(x) || (x >= bound(lo) && x <= bound(hi))) out.add(r);
    else fail(ctx, s, `<${v} [${lo},${hi}]>`);
  }
  return out;
}

// Seq with comma omission (CSS Values 4 §2.6.1): a `,` is skipped for the remainders in `start` (nothing
// consumed since the seq start or the previous comma; never before the first term). When every later term is
// nullable it may also end the seq (`done`), and a consumed comma then needs something after it (`moved` is
// banned). Like css.ts, `start` and `moved` are sets over all paths, not per path.
export const nullable = (n: Node) => n[0] === "opt" || n[0] === "star" || (n[0] === "rep" && n[2] === "0");
function seq(xs: Node[], s: string, sub: (x: Node, r: string) => Set<string>): Set<string> {
  let rs = new Set([s]), start = NONE, moved = NONE;
  const done = new Set<string>();
  xs.forEach((x, i) => {
    if (x[0] !== "lit" || x[1] !== ",") {
      if (start === NONE) start = rs;
      return void (rs = flatMap(rs, (r) => sub(x, r)));
    }
    const go = new Set([...rs].filter((r) => !start.has(r)));
    const after = flatMap(go, (r) => sub(x, r));
    const rest = xs.slice(i + 1);
    if (rest.length && rest.every(nullable)) go.forEach((r) => done.add(r)), (moved = after);
    rs = start = new Set([...rs].filter((r) => start.has(r)).concat(...after));
  });
  return new Set([...rs].filter((r) => !moved.has(r)).concat(...done));
}

// Star / list: repeat until no new remainder appears (css.ts stops after 8, the twin runs to the fixpoint).
function closure(rs: Set<string>, step: (r: string) => Set<string>): Set<string> {
  const all = new Set(rs);
  for (let todo = [...rs]; todo.length; ) {
    const fresh: string[] = [];
    for (const r of todo) for (const q of step(r)) if (!all.has(q)) all.add(q), fresh.push(q);
    todo = fresh;
  }
  return all;
}

function rep(s: string, lo: number, hi: number, step: (r: string) => Set<string>): Set<string> {
  const out = new Set<string>();
  let cur = new Set([s]);
  for (let i = 0; ; i++) {
    if (i >= lo) {
      const before = out.size;
      for (const r of cur) out.add(r);
      if (i > lo && out.size === before) return out;
    }
    if (i === hi || cur.size === 0) return out;
    cur = flatMap(cur, step);
  }
}

// || (all=false: at least one part) and && (all=true: every part), any order, each part at most once.
function anyOrder(xs: Node[], s: string, all: boolean, sub: (x: Node, r: string) => Set<string>): Set<string> {
  if (!xs.length) return new Set([s]);
  const out = new Set<string>();
  xs.forEach((x, i) => {
    for (const r1 of sub(x, s)) {
      if (!all) out.add(r1);
      for (const r of anyOrder(xs.filter((_, j) => j !== i), r1, all, sub)) out.add(r);
    }
  });
  return out;
}

// ---------------------------------------------------------------- public

export function matches(syntax: string, s: string): boolean {
  const v = trim(s);
  return consume(parse(syntax), v, { len: v.length, far: -1, expected: new Set() }).has("");
}

// Twin of Valid<P, S>: returns the value, or throws with the furthest point reached and what was expected.
export function valid(p: string, s: string): string {
  const syntax = props[p];
  if (!syntax) throw new TypeError(`${p}: no grammar for this property`);
  const v = trim(s);
  const ctx: Ctx = { len: v.length, far: -1, expected: new Set() };
  const rs = consume(parse(syntax), v, ctx);
  if (rs.has("")) return s;
  for (const r of rs) fail(ctx, r, "end of value");
  const [bad] = tok1(v.slice(ctx.far));
  const what = bad ? `unexpected "${bad}"` : "unexpected end";
  throw new TypeError(`${p}: ${what} in "${s}", expected ${[...ctx.expected].join(" | ")}`);
}
