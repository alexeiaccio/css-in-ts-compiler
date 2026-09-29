// Runtime twin of css.ts, arktype style: the same lexer, parser and recognizer written as functions, one per
// type, same names in lower case (Next/next, Parse/parse, Consume/consume, Valid/valid). Change them together.
//
// Plain code on purpose: the lexer and the recognizer are the hot path (perf budget: cssints/test/perf.mjs), so
// nothing here returns an Effect. Failures are thrown as the tagged errors of errors.ts; the Effect.fn boundary is
// twin.ts (and rules.ts, support.ts, which call `matches` here without the boundary cost).
//
// Where the type level has to give up, the twin is stricter: numeric ranges like `[0,∞]`, `${number}`
// accepting "1 " (so "1 rem"), hex digits, empty idents, more than 8 repetitions. The twin also reports the
// furthest point the value reached and what the grammar expected there.
import { InvalidValueError, ParseError, UnknownPropertyError } from "./errors.ts";
import { properties, syntaxes } from "./mdn.ts";

const props: Record<string, string> = properties;
const syns: Record<string, string> = syntaxes;

// ---------------------------------------------------------------- lexer: one token at a time

const trim = (s: string) => s.replace(/^[ \n\t]+/, "");

type Tok =
  | { t: "type"; v: string; lo?: string; hi?: string }
  | { t: "prop"; v: string }
  | { t: "kw"; v: string }
  | { t: "fn"; v: string }
  | { t: "range"; lo: string; hi: string }
  | { t: "p"; v: string }
  | { t: "lit"; v: string }
  | { t: "eof" };

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
  if ((m = /^'([^']*)'/.exec(s))) return [{ t: "lit", v: m[1]! }, s.slice(m[0].length)];
  if ((m = /^(\|\||&&)/.exec(s))) return [{ t: "p", v: m[1]! }, s.slice(2)];
  if ((m = /^\{([^}]*)\}/.exec(s))) {
    const [lo, hi = lo] = m[1]!.split(",") as [string, string?];
    return [{ t: "range", lo, hi: hi || "∞" }, s.slice(m[0].length)]; // `{A,}` is open
  }
  if ((m = /^[[\]()|?*+#!,/;]/.exec(s))) return [{ t: "p", v: m[0] }, s.slice(1)];
  if ((m = /^[^()[\]|&?*+#!,/{}<>' \n\t]+(?=[ \n\t]|$)/.exec(s)))
    return [{ t: "kw", v: m[0] }, s.slice(m[0].length)];
  const w = /^[A-Za-z0-9_-]*/.exec(s)![0];
  const r = s.slice(w.length);
  if (w === "") return [{ t: "eof" }, ""];
  return r.startsWith("(") ? [{ t: "fn", v: w }, r.slice(1)] : [{ t: "kw", v: w }, r];
}

// ---------------------------------------------------------------- parser  (alt < or(||) < and(&&) < seq < term+mult)
// Same node shapes as css.ts, except alternatives are a flat list (the cons list only exists for tsc) and
// `type` keeps its numeric range.

export type Node =
  | ["kw", string]
  | ["type", string, string?, string?]
  | ["prop", string]
  | ["fn", string, Node]
  | ["lit", string]
  | ["alt", Node[]]
  | ["or", Node[]]
  | ["and", Node[]]
  | ["seq", Node[]]
  | ["opt", Node]
  | ["star", Node]
  | ["plus", Node]
  | ["list", Node]
  | ["rep", Node, string, string]
  | ["bang", Node];

const parsed = new Map<string, Node>();
// The grammar being parsed, for the position of a ParseError (every remainder is a suffix of it).
let whole = "";
const bad = (message: string, rest: string, expected: string[]) =>
  new ParseError({ message, grammar: whole, position: whole.length - rest.length, expected });

export function parseGrammar(s: string): Node {
  let n = parsed.get(s);
  if (!n) {
    whole = s;
    parsed.set(s, (n = parseAlt(s)[0]));
  }
  return n;
}

const infix =
  (tag: "alt" | "or" | "and", op: string, sub: (s: string) => [Node, string]) =>
  (s: string): [Node, string] => {
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
    if (t.t === "eof" || (t.t === "p" && ["|", "||", "&&", "]", ")"].includes(t.v)))
      return [xs.length === 1 ? xs[0]! : ["seq", xs], s];
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
    if (close.t !== "p" || close.v !== "]")
      throw bad(`grammar: expected "]" at "${r2}"`, r2, ['"]"']);
    return mult(n, r3);
  }
  if (t.t === "fn") return fnArgs(t.v, r);
  if (t.t === "p" && t.v === "(") return fnArgs("", r);
  if (t.t === "type")
    return mult(t.lo === undefined ? ["type", t.v] : ["type", t.v, t.lo, t.hi], r);
  if (t.t === "prop" || t.t === "kw") return mult([t.t, t.v], r);
  if (t.t === "p" && (t.v === "," || t.v === "/" || t.v === ";")) return mult(["lit", t.v], r);
  if (t.t === "lit") return mult(["lit", t.v], r);
  throw bad(`grammar: unexpected token at "${s}"`, s, ["a term"]);
}

// `name( args )`; a bare `( args )` group is a function with an empty name.
function fnArgs(v: string, s: string): [Node, string] {
  const [n, r] = parseAlt(s);
  const [close, r2] = next(r);
  if (close.t !== "p" || close.v !== ")") throw bad(`grammar: expected ")" at "${r}"`, r, ['")"']);
  return mult(["fn", v, n], r2);
}
// `X#{A,B}` is `X [ , X ]{A-1,B-1}`
const dec = (b: string) => (b === "∞" ? b : String(Number(b) - 1));

const MULT: Record<string, "opt" | "star" | "plus" | "list"> = {
  "?": "opt",
  "*": "star",
  "+": "plus",
  "#": "list",
};
function mult(n: Node, s: string): [Node, string] {
  for (;;) {
    const [t, r] = next(s);
    if (t.t === "p" && MULT[t.v]) n = [MULT[t.v]!, n];
    else if (t.t === "range")
      n =
        n[0] === "list"
          ? ["seq", [n[1], ["rep", ["seq", [["lit", ","], n[1]]], dec(t.lo), dec(t.hi)]]]
          : ["rep", n, t.lo, t.hi];
    else if (t.t === "p" && t.v === "!") n = ["bang", n];
    else return [n, s];
    s = r;
  }
}

// ---------------------------------------------------------------- value recognizer
// consume(n, s) = set of possible remainders after n matched a prefix of s. s is left-trimmed.

// A value token ends at a space, a comma or a ")"; the rest keeps the separator.
function tok1(s: string): [string, string] {
  const t = /^[^ ,)]*/.exec(s)![0];
  return [t, s.slice(t.length)];
}

const NUM = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;
const LENGTH_UNIT =
  "px|em|rem|vw|vh|vmin|vmax|ch|ex|lh|rlh|cm|mm|in|pt|pc|q|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|ic|cap|rex|rch|ric|rcap";
const re = (s: string) => new RegExp(`^(?:${s})$`);
// an ident (escapes ignored)
const IDENT = String.raw`(?:--|-?[A-Za-z_\u0080-\uffff])[\w\u0080-\uffff-]*`;
const PRIMITIVE: Record<string, RegExp> = {
  length: re(`${NUM}(?:${LENGTH_UNIT})|0`),
  percentage: re(`${NUM}%`),
  "length-percentage": re(`${NUM}(?:${LENGTH_UNIT})|0|${NUM}%`),
  number: re(NUM),
  integer: re(String.raw`[+-]?\d+`),
  "hex-color": /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  // an ident, minus the CSS-wide keywords and `default`
  "custom-ident": new RegExp(
    `^(?!(?:initial|inherit|unset|revert|revert-layer|default)$)${IDENT}$`,
    "i",
  ),
  "dashed-ident": /^--.+$/,
  angle: re(`${NUM}(?:deg|rad|grad|turn)`),
  time: re(`${NUM}(?:s|ms)`),
  dimension: re(`${NUM}(?:${LENGTH_UNIT}|deg|rad|grad|turn|s|ms|hz|khz|dpi|dpcm|dppx|x|fr)`),
  resolution: re(`${NUM}(?:dpi|dpcm|dppx|x)`),
  flex: re(`${NUM}fr`),
  // a number token with the value zero, in any spelling (`hue-rotate(0.0)`)
  zero: re(String.raw`[+-]?(?:0+(?:\.0+)?|\.0+)(?:e[+-]?\d+)?`),
  ident: re(IDENT),
  "ident-token": re(IDENT),
  "hash-token": /^#[\w\u0080-\uffff-]+$/,
  // css-sizing-4 §3.2 and css-values-5 §11: the keywords calc-size() takes as a basis
  "intrinsic-size-keyword": /^(?:min-content|max-content|fit-content|stretch)$/,
  // the cursor hotspot (css-ui-4 §6.1.1: "<x> <y>" are numbers)
  x: re(NUM),
  y: re(NUM),
};

// Primitives that are not one token (a string holds spaces, a url parentheses, a declaration value anything):
// the length of the prefix of s that they match, or -1. Strings and urls ignore escapes.
const STRING = /^(?:"[^"]*"|'[^']*')/;
const URL_RE = /^url\(\s*(?:"[^"]*"|'[^']*'|[^\s"'()\\]*)\s*\)/;
// <declaration-value> (css-syntax-3, "Parsing"): balanced tokens up to the unmatched `)` that ends the function around
// it, or the end; not empty, and no top-level `;` or `!`.
function declarationValue(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === '"' || c === "'") {
      i = s.indexOf(c, i + 1);
      if (i < 0) return -1;
    } else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) {
      if (depth) depth--;
      else return c === ")" && i > 0 ? i : -1;
    } else if (!depth && (c === ";" || c === "!")) return -1;
  }
  return depth || !s ? -1 : s.length;
}
// The grammars want `:` and `/` as tokens of their own (`<mf-plain>` is `<mf-name> : <mf-value>`), while a query
// writes `(width:40rem)` and `16/9`: space them out first, as `ValidQuery` (query.ts) does.
export const spaced = (q: string) => q.replace(/[:/]/g, " $& ");

// `s` is what follows an opening bracket: the index of the `)` that closes it (-1 when it never does) and of every
// top-level `sep` before it. Quotes are skipped, brackets nest.
function args(s: string, sep: string): { end: number; at: number[] } {
  const at: number[] = [];
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === '"' || c === "'") {
      i = s.indexOf(c, i + 1);
      if (i < 0) break;
    } else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) {
      if (!depth) return { end: c === ")" ? i : -1, at };
      depth--;
    } else if (c === sep && !depth) at.push(i);
  }
  return { end: -1, at };
}

// `if( [ <if-branch> ; ]* <if-branch> ;? )` (css-values-5 §if): the lexer has no `;` and `:` tokens, so the branches are
// split there and each condition is matched against <if-condition>. The value of a branch is any <declaration-value>?.
function ifCall(s: string): number {
  if (!s.startsWith("if(")) return -1;
  const body = s.slice(3);
  const { end, at } = args(body, ";");
  if (end < 0) return -1;
  const cuts = [-1, ...at, end];
  const branches = cuts.slice(1).map((e, i) => body.slice(cuts[i]! + 1, e).trim());
  if (branches.at(-1) === "") branches.pop();
  const branch = (b: string) => {
    const [i] = args(`${b})`, ":").at;
    if (i === undefined) return false;
    const cond = trim(spaced(b.slice(0, i)));
    const value = b.slice(i + 1).trim();
    const ctx: Ctx = { len: cond.length, far: -1, expected: new Set() };
    return (
      consume(parseGrammar(syns["if-condition"]!), cond, ctx).has("") &&
      (value === "" || declarationValue(value) === value.length)
    );
  };
  return branches.length && branches.every(branch) ? end + 4 : -1;
}
const SCAN: Record<string, (s: string) => number> = {
  string: (s) => STRING.exec(s)?.[0].length ?? -1,
  url: (s) => URL_RE.exec(s)?.[0].length ?? -1,
  "declaration-value": declarationValue,
  "if()": ifCall,
};

// Relative colour (css-color-5 §4.2 to §4.9, §5.1): `from <color>` is in the grammar, the component keywords are only in
// the prose of each function, so they are here. A function with a `from` opens a scope (`Ctx.ch`) in which a channel
// keyword, a var() or a calc() over those stands for a <number>, <percentage> or <angle>. The scope of a colour() is
// `alpha` plus the keywords of its color space, the first one of these names among its top-level tokens.
const RGB = ["r", "g", "b", "alpha"],
  HSL = ["h", "s", "l", "alpha"],
  LAB = ["l", "a", "b", "alpha"],
  LCH = ["l", "c", "h", "alpha"];
const CHANNELS = new Map<string, string[]>([
  ["rgb", RGB],
  ["rgba", RGB],
  ["hsl", HSL],
  ["hsla", HSL],
  ["hwb", ["h", "w", "b", "alpha"]],
  ["lab", LAB],
  ["oklab", LAB],
  ["lch", LCH],
  ["oklch", LCH],
  ["color", ["alpha"]],
]);
const SPACES = new Map<string, readonly string[]>([
  ...syns["predefined-rgb"]!.split(" | ").map((k) => [k, ["r", "g", "b"]] as const),
  ...syns["xyz-space"]!.split(" | ").map((k) => [k, ["x", "y", "z"]] as const),
]);
function spaceChannels(body: string): readonly string[] {
  let b = body.slice(0, args(body, "").end);
  for (let p = ""; p !== b; ) [p, b] = [b, b.replace(/\([^()]*\)/g, "")];
  return (
    b
      .split(/\s+/)
      .map((k) => SPACES.get(k))
      .find(Boolean) ?? []
  );
}

interface Ctx {
  len: number;
  far: number;
  expected: Set<string>;
  ch?: readonly string[]; // the channel keywords in scope
}
// Furthest failure wins: its position is where the value went wrong, its labels are what was expected there.
function fail(ctx: Ctx, s: string, what: string) {
  const at = ctx.len - s.length;
  if (at > ctx.far) {
    ctx.far = at;
    ctx.expected = new Set();
  }
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
  const leaf = (ok: boolean, rest: string, what: string) =>
    ok ? new Set([trim(rest)]) : (fail(ctx, s, label ?? what), NONE);
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
      return g
        ? consume(parseGrammar(g), s, ctx, label ?? `<'${n[1]}'>`)
        : leaf(false, s, `<'${n[1]}'>`);
    }
    case "fn": {
      if (!s.startsWith(`${n[1]}(`)) return leaf(false, s, `${n[1]}()`);
      const body = trim(s.slice(n[1].length + 1));
      const outer = ctx.ch;
      if (n[1]) {
        // a named function is its own scope
        const ch = /^from[ \n\t]/.test(body) ? CHANNELS.get(n[1]) : undefined;
        ctx.ch = ch && n[1] === "color" ? [...ch, ...spaceChannels(body)] : ch;
      }
      const rs = flatMap(sub(n[2], body), (r) =>
        r.startsWith(")") ? new Set([trim(r.slice(1))]) : (fail(ctx, r, label ?? "')'"), NONE),
      );
      ctx.ch = outer;
      return rs;
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
    case "bang": {
      // `[ ... ]!`: the group must not be empty (CSS Values 4 §2.2)
      const rs = new Set([...sub(n[1], s)].filter((r) => r !== s));
      if (!rs.size) fail(ctx, s, label ?? "a non-empty group");
      return rs;
    }
    case "or":
      return anyOrder(n[1], s, false, sub);
    case "and":
      return anyOrder(n[1], s, true, sub);
  }
}

// A number or dimension in the canonical unit of its type (deg, s), so that `<angle [-90deg,90deg]>` holds
// for 1.5rad and not for 100grad. Bounds are read the same way; NaN for anything else (calc(), var()).
const SCALE: Record<string, number> = { grad: 0.9, rad: 180 / Math.PI, turn: 360, ms: 0.001 };
const NUM_HEAD = new RegExp(`^${NUM}`, "i");
export const magnitude = (t: string): number =>
  t === "∞"
    ? Infinity
    : t === "-∞"
      ? -Infinity
      : parseFloat(t) * (SCALE[t.replace(NUM_HEAD, "").trim().toLowerCase()] ?? 1);

// Type of a <calc-sum> (css-values-4 §10.9 "Type Checking"): "number", "length" (percentages count as lengths, they
// resolve against one wherever calc-size() is allowed), another dimension's unit, or undefined when `+`/`-` mix types
// or `*` multiplies two dimensions. The grammar already checked the shape. `leaf` types a token first; "any" is the
// type of a var(), which matches every other.
export function calcType(s: string, leaf?: (t: string) => string | undefined): string | undefined {
  const toks = s.match(/[()*/]|[+-](?=\s)|[^\s()*/]+/g) ?? [];
  let i = 0;
  const both = (a?: string, b?: string) =>
    a === undefined || b === undefined ? undefined : a === "any" || b === "any" ? "any" : undefined;
  const value = (): string | undefined => {
    const t = toks[i++] ?? "";
    if (t === "(") return ((x) => (i++, x))(sum());
    return (
      leaf?.(t) ??
      (PRIMITIVE.number!.test(t) || /^-?(e|pi|infinity|nan)$/i.test(t)
        ? "number"
        : PRIMITIVE["length-percentage"]!.test(t)
          ? "length"
          : t.replace(/^[+-]?[\d.]+/, ""))
    );
  };
  const product = () => {
    let a = value();
    while (toks[i] === "*" || toks[i] === "/") {
      const op = toks[i++],
        b = value();
      a =
        both(a, b) ??
        (a === undefined || b === undefined
          ? undefined
          : op === "/"
            ? b === "number"
              ? a
              : undefined
            : a === "number"
              ? b
              : b === "number"
                ? a
                : undefined);
    }
    return a;
  };
  const sum = () => {
    let a = product();
    while (toks[i] === "+" || toks[i] === "-") {
      i++;
      const b = product();
      a = both(a, b) ?? (a !== undefined && b === a ? a : undefined);
    }
    return a;
  };
  return sum();
}

// Where a <number>, <percentage> or <angle> is expected inside a relative colour (`Ctx.ch`): a channel keyword (a
// <number>), a var(), or a calc() whose type is the expected one (min(), max() and clamp() are not checked: the twin rejects them).
function relative(v: string, s: string, ctx: Ctx): Set<string> {
  if (v !== "number" && v !== "percentage" && v !== "angle") return NONE;
  const [t, r] = tok1(s);
  if (v === "number" && ctx.ch!.includes(t.toLowerCase())) return new Set([trim(r)]);
  if (s.startsWith("var(")) return consumeType(["type", "var()"], s, ctx);
  if (!s.startsWith("calc(")) return NONE;
  const { end } = args(s.slice(5), "");
  if (end < 0) return NONE;
  const inner = trim(s.slice(5, 5 + end));
  const own: Ctx = { len: inner.length, far: -1, expected: new Set(), ch: ctx.ch };
  if (!consume(parseGrammar(syns["calc-sum"]!), inner, own).has("")) return NONE;
  const kind = calcType(inner.replace(/var\((?:[^()]|\([^()]*\))*\)/g, "⟨var⟩"), (x) =>
    x === "⟨var⟩"
      ? "any"
      : ctx.ch!.includes(x.toLowerCase())
        ? "number"
        : PRIMITIVE.percentage!.test(x)
          ? "percentage"
          : PRIMITIVE.angle!.test(x)
            ? "angle"
            : undefined,
  );
  return kind === v || kind === "any" ? new Set([trim(s.slice(6 + end))]) : NONE;
}

function consumeType(
  [, v, lo, hi]: ["type", string, string?, string?],
  s: string,
  ctx: Ctx,
  label?: string,
): Set<string> {
  let rs: Set<string>;
  if (PRIMITIVE[v]) {
    const [t, r] = tok1(s);
    rs = PRIMITIVE[v].test(t) ? new Set([trim(r)]) : ctx.ch ? relative(v, s, ctx) : NONE;
  } else if (SCAN[v]) {
    const n = SCAN[v](s);
    rs = n < 0 ? NONE : new Set([trim(s.slice(n))]);
  } else if (syns[v]) {
    // `<name()>`: the name must be next before its grammar is even parsed (as in css.ts)
    rs =
      v.endsWith("()") && !s.startsWith(`${v.slice(0, -2)}(`)
        ? NONE
        : consume(parseGrammar(syns[v]), s, ctx, label ?? `<${v}>`);
  } else rs = NONE;
  if (rs === NONE) fail(ctx, s, label ?? `<${v}>`);
  if (lo === undefined || hi === undefined) return rs;
  // Ranges: the type level strips them, the twin checks the number that was consumed.
  const out = new Set<string>();
  for (const r of rs) {
    const x = magnitude(s.slice(0, s.length - r.length));
    if (Number.isNaN(x) || (x >= magnitude(lo) && x <= magnitude(hi))) out.add(r);
    else fail(ctx, s, `<${v} [${lo},${hi}]>`);
  }
  return out;
}

// Seq with comma omission (CSS Values 4 §2.6.1): a `,` is skipped for the remainders in `start` (nothing
// consumed since the seq start or the previous comma; never before the first term). When every later term is
// nullable it may also end the seq (`done`), and a consumed comma then needs something after it (`moved` is
// banned). Like css.ts, `start` and `moved` are sets over all paths, not per path.
export const nullable = (n: Node) =>
  n[0] === "opt" || n[0] === "star" || (n[0] === "rep" && n[2] === "0");
function seq(xs: Node[], s: string, sub: (x: Node, r: string) => Set<string>): Set<string> {
  let rs = new Set([s]),
    start = NONE,
    moved = NONE;
  const done = new Set<string>();
  xs.forEach((x, i) => {
    if (x[0] !== "lit" || x[1] !== ",") {
      if (start === NONE) start = rs;
      return void (rs = flatMap(rs, (r) => sub(x, r)));
    }
    const go = new Set([...rs].filter((r) => !start.has(r)));
    const after = flatMap(go, (r) => sub(x, r));
    const rest = xs.slice(i + 1);
    if (rest.length && rest.every(nullable)) {
      go.forEach((r) => done.add(r));
      moved = after;
    }
    rs = start = new Set([...rs].filter((r) => start.has(r)).concat(...after));
  });
  return new Set([...rs].filter((r) => !moved.has(r)).concat(...done));
}

// Star / list: repeat until no new remainder appears (css.ts stops after 8, the twin runs to the fixpoint).
function closure(rs: Set<string>, step: (r: string) => Set<string>): Set<string> {
  const all = new Set(rs);
  for (let todo = [...rs]; todo.length; ) {
    const fresh: string[] = [];
    for (const r of todo)
      for (const q of step(r))
        if (!all.has(q)) {
          all.add(q);
          fresh.push(q);
        }
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
function anyOrder(
  xs: Node[],
  s: string,
  all: boolean,
  sub: (x: Node, r: string) => Set<string>,
): Set<string> {
  if (!xs.length) return new Set([s]);
  const out = new Set<string>();
  xs.forEach((x, i) => {
    for (const r1 of sub(x, s)) {
      if (!all) out.add(r1);
      for (const r of anyOrder(
        xs.filter((_, j) => j !== i),
        r1,
        all,
        sub,
      ))
        out.add(r);
    }
  });
  return out;
}

// ---------------------------------------------------------------- public

export function matches(syntax: string, s: string): boolean {
  const v = trim(s);
  return consume(parseGrammar(syntax), v, { len: v.length, far: -1, expected: new Set() }).has("");
}

// Twin of Valid<P, S>: returns the value, or throws with the furthest point reached and what was expected.
export function valid(p: string, s: string): string {
  const syntax = props[p];
  if (!syntax)
    throw new UnknownPropertyError({ message: `${p}: no grammar for this property`, property: p });
  const v = trim(s);
  const ctx: Ctx = { len: v.length, far: -1, expected: new Set() };
  const rs = consume(parseGrammar(syntax), v, ctx);
  if (rs.has("")) return s;
  for (const r of rs) fail(ctx, r, "end of value");
  const [token] = tok1(v.slice(ctx.far));
  const what = token ? `unexpected "${token}"` : "unexpected end";
  const expected = [...ctx.expected];
  throw new InvalidValueError({
    message: `${p}: ${what} in "${s}", expected ${expected.join(" | ")}`,
    property: p,
    value: s,
    position: ctx.far + (s.length - v.length),
    expected,
  });
}
