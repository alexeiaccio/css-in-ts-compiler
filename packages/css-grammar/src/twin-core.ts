// Runtime twin of css.ts, arktype style: the same lexer, parser and recognizer written as functions, one per
// type, same names in lower case (Next/next, Parse/parse, Consume/consume, Valid/valid). Change them together.
//
// Plain code on purpose: the lexer and the recognizer are the hot path (perf budget: cssints/test/perf.mjs), so
// nothing here returns an Effect. Failures are thrown as the tagged errors of errors.ts; the Effect.fn boundary is
// twin.ts (and rules.ts, support.ts, which call `matches` here without the boundary cost).
//
// Where the type level has to give up, the twin is stricter: numeric ranges like `[0,∞]`, `${number}`
// accepting "1 " (so "1 rem"), hex digits, empty idents, more than 8 repetitions, the type of a math function
// (`calc(1px + 2s)`). The twin also reports the furthest point the value reached and what the grammar expected there.
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
// <calc-sum> (calc-size() takes one): css-values-5 §11, "if a <calc-sum> is given, its type must match <length-percentage>".
function calcSum(s: string, ctx: Ctx): number {
  const [t, end] = mathScan(s, undefined, true);
  if (t && fits(t, KIND["length-percentage"]!)) return end;
  ctx.why = [
    ctx.len - s.length,
    t ? `${s.slice(0, end)} is ${typeName(t)}, not <length-percentage>` : why,
  ];
  return -1;
}
const SCAN: Record<string, (s: string, ctx: Ctx) => number> = {
  string: (s) => STRING.exec(s)?.[0].length ?? -1,
  url: (s) => URL_RE.exec(s)?.[0].length ?? -1,
  "declaration-value": declarationValue,
  "if()": ifCall,
  "calc-sum": calcSum,
};
// Whether the twin reads `<name>` itself (a primitive or a scan), with no entry in `syntaxes`: scripts/webref-rule.mjs.
export const isNative = (name: string) => !!(PRIMITIVE[name] || SCAN[name]);

// Relative colour (css-color-5 §4.2 to §4.9, §5.1): `from <color>` is in the grammar, the component keywords are only in
// the prose of each function, so they are here. A function with a `from` opens a scope (`Ctx.ch`) in which a channel
// keyword, a var() or a math function over those stands for a <number>, <percentage> or <angle>. The scope of a colour() is
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

// Pending substitution (css-values-5, arbitrary substitution functions).
//
// THE RULE. A var(), env() or if() anywhere in a property value is a placeholder for zero or more component values,
// commas included (what it becomes is known only at computed-value time, so the parser must accept it). The value is
// valid when some choice of what each placeholder stands for makes the whole value match the grammar; everything that
// is not a placeholder is checked as usual, which is stricter than Chrome (it takes any value that has a placeholder).
// `padding: var(--a) 2px` and `margin: var(--a)` pass; `padding: var(--a) red` and `border: 1px var(--x) solud` fail
// on `red` and `solud`. `var(--a)` alone passes for every property (the grammars are all non-empty).
//
// HOW. The recognizer reads forward and returns the set of remainders. A call at the head of the text is tried by every
// leaf (keyword, literal, function, primitive) that fails there: the call stands for that leaf and ends (the text after
// the call), stands for it and stays at the head for the next leaf (the text itself), or is empty (the leaf tries the
// text after it). So it can take the place of any number of leaves, and it never swallows text after it. Around that:
// - a function closes, and a value ends, after trailing placeholders (`skipPending`, `complete`);
// - in a `#` list a placeholder may hold the comma;
// - in `||` and `&&` a placeholder at the head may stand for any of the parts, whole, and for the head of one more, so
//   no part is required there (`anyOrder`); without a placeholder at the head `&&` still takes every part.
// The flag is `Ctx.pend`, set only for a value that has `var(`, `env(` or `if(` in it, so any other value pays nothing
// beyond that one test per declaration.
//
// WHICH CALLS. `var(--name[, fallback])` by <var()>, `if()` by `ifCall` (its conditions go through <if-condition>, its
// branch values are any <declaration-value>), and `env()`, which is the same kind of arbitrary-substitution function
// (css-env-1: it may stand wherever a var() may, and `mathScan` already took it for anything), by the shape
// `env(<ident> ...)`. Not `attr()`: its use outside `content` is typed, not arbitrary.
//
// LIMITS. A call is checked by shape only: the fallback, the branch values and the name of an env() variable are not
// checked against the position, nor is the range of a number the call stands for. A call stands for whole component
// values only: it cannot be glued to a token (`1var(--u)`) or end one. The stay state is not tracked per path, so the
// comma omission of a seq sees a placeholder as nothing consumed. The types follow the same rule with the arguments as
// balanced tokens (and only `var(--` for a var()); tokens are not touched: they are checked by literals of their type.
const PENDING = /(?:var|env|if)\(/;
const ENV = /^env\([ \n\t]*[A-Za-z_-][\w-]*/;
// The length of the var(), env() or if() at the start of s, or -1.
function pendingEnd(s: string): number {
  if (!/^(?:var|env|if)\(/.test(s)) return -1;
  if (s[0] === "i") return ifCall(s);
  const { end } = args(s.slice(4), "");
  if (end < 0) return -1;
  const call = s.slice(0, end + 5);
  return (s[0] === "v" ? matches(syns["var()"]!, call) : ENV.test(call)) ? end + 5 : -1;
}
function skipPending(s: string): string {
  for (let e; (e = pendingEnd(s)) >= 0; ) s = trim(s.slice(e));
  return s;
}
function pend(n: Node, s: string, ctx: Ctx, label?: string): Set<string> {
  const e = pendingEnd(s);
  if (e < 0) return NONE;
  const rest = trim(s.slice(e));
  return new Set([s, rest, ...consume(n, rest, ctx, label)]);
}
const complete = (rs: Set<string>, ctx: Ctx) =>
  ctx.pend ? [...rs].some((r) => skipPending(r) === "") : rs.has("");

interface Ctx {
  len: number;
  far: number;
  expected: Set<string>;
  pend?: boolean; // the value has a var(), env() or if(): see "Pending substitution"
  ch?: readonly string[]; // the channel keywords in scope
  why?: [at: number, text: string]; // what was wrong with a math function at that position
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
    ok
      ? new Set([trim(rest)])
      : (fail(ctx, s, label ?? what), ctx.pend ? pend(n, s, ctx, label) : NONE);
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
      const rs = flatMap(sub(n[2], body), (r0) => {
        const r = ctx.pend ? skipPending(r0) : r0;
        return r.startsWith(")")
          ? new Set([trim(r.slice(1))])
          : (fail(ctx, r0, label ?? "')'"), NONE);
      });
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
      return closure(sub(n[1], s), (r) => {
        if (r.startsWith(",")) return sub(n[1], trim(r.slice(1)));
        const e = ctx.pend ? pendingEnd(r) : -1; // a placeholder may hold the comma
        return e < 0 ? NONE : union([sub(n[1], r), sub(n[1], trim(r.slice(e)))]);
      });
    case "rep":
      return rep(s, Number(n[2]), n[3] === "∞" ? Infinity : Number(n[3]), (r) => sub(n[1], r));
    case "bang": {
      // `[ ... ]!`: the group must not be empty (CSS Values 4 §2.2)
      const rs = new Set([...sub(n[1], s)].filter((r) => r !== s));
      if (!rs.size) fail(ctx, s, label ?? "a non-empty group");
      return rs;
    }
    case "or":
      return anyOrder(n[1], s, false, sub, ctx.pend);
    case "and":
      return anyOrder(n[1], s, true, sub, ctx.pend);
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

// Math functions (css-values-4 §10): calc(), min(), max(), clamp(), round(), mod(), rem(), sin() ... sign(). A numeric
// primitive accepts one whose calc type (§10.7, "Type Checking") is that primitive's: the type is the exponent of each
// base type (`length`, `angle`, `time`, ... and `percent`), so `1px * 2` is a length, `1px / 1px` a number, `1px * 1px` no
// primitive at all. Adding a percentage to a dimension gives a type with a percent hint (`mix`): a <length-percentage> or
// <angle-percentage>, no other position. A var() or env() stands for anything (`any`). Numeric ranges (`[0,∞]`) are not
// checked on a math function: the result is not known before the values are, and browsers clamp it.
interface CT {
  e: Record<string, number>;
  mix?: boolean;
  any?: boolean;
}
const NUMBER: CT = { e: {} },
  ANY: CT = { e: {}, any: true };
const dim = (k: string): CT => ({ e: { [k]: 1 } });
const bases = (t: CT) => Object.keys(t.e);
// a base type to the first power: `length`, not `length * length` or a number
const plain = (t: CT) => bases(t).length === 1 && t.e[bases(t)[0]!] === 1;
const same = (a: CT, b: CT) =>
  bases(a).length === bases(b).length && bases(a).every((k) => a.e[k] === b.e[k]);
const isNumber = (t: CT) => t.any || (!t.mix && !bases(t).length);
const typeName = (t: CT) =>
  t.any
    ? "anything"
    : `${bases(t)
        .map((k) => `${k === "percent" ? "percentage" : k}${t.e[k] === 1 ? "" : `^${t.e[k]}`}`)
        .join(" * ")}${t.mix ? "-percentage" : ""}` || "number";

// `+` and `-`: equal types, or a percentage and a dimension (the percent hint)
function add(a: CT, b: CT): CT | undefined {
  if (a.any || b.any) return ANY;
  if (same(a, b)) return { e: a.e, mix: a.mix || b.mix };
  const pct = (t: CT) => same(t, dim("percent")) && !t.mix;
  if (pct(a) && plain(b)) return { e: b.e, mix: true };
  if (pct(b) && plain(a)) return { e: a.e, mix: true };
}
function mul(a: CT, b: CT, sign: 1 | -1): CT {
  if (a.any || b.any) return ANY;
  const e = { ...a.e };
  for (const k in b.e) if (!(e[k] = (e[k] ?? 0) + sign * b.e[k]!)) delete e[k];
  return { e, mix: a.mix || b.mix };
}

// [base type, whether the percent hint is allowed] of the primitives that take a math function. Not <flex>: a
// calc() cannot hold `fr` (Chrome rejects `calc(1fr)`).
const KIND: Record<string, [string, boolean]> = {
  number: ["", false],
  integer: ["", false],
  x: ["", false],
  y: ["", false],
  length: ["length", false],
  percentage: ["percent", false],
  "length-percentage": ["length", true],
  angle: ["angle", false],
  "angle-percentage": ["angle", true],
  time: ["time", false],
  resolution: ["resolution", false],
};
const fits = (t: CT, [k, pct]: [string, boolean]) =>
  t.any ||
  (t.mix
    ? pct && plain(t) && t.e[k] === 1
    : k === ""
      ? !bases(t).length
      : plain(t) && (t.e[k] === 1 || (pct && t.e.percent === 1)));

const MATH = new Set(
  "calc min max clamp round mod rem sin cos tan asin acos atan atan2 pow sqrt hypot log exp abs sign".split(
    " ",
  ),
);
const MATH_START = new RegExp(`^(?:${[...MATH].join("|")})\\(`);
const UNITS = new Map<string, string>([
  ...LENGTH_UNIT.split("|").map((u) => [u, "length"] as [string, string]),
  ...["deg", "rad", "grad", "turn"].map((u) => [u, "angle"] as [string, string]),
  ...["s", "ms"].map((u) => [u, "time"] as [string, string]),
  ...["dpi", "dpcm", "dppx", "x"].map((u) => [u, "resolution"] as [string, string]),
]);
const sticky = (r: string) => new RegExp(r, "iy");
const NUM_TOKEN = sticky(NUM),
  UNIT_TOKEN = /%|[A-Za-z]+/y,
  WORD = /-?[A-Za-z][\w-]*/y,
  WS = /[ \n\t]*/y,
  ROUND_MODE = /(?:nearest|up|down|to-zero)(?=[ \n\t]*,)/y,
  NONE_WORD = /none(?![\w-])/y;

// Why the last mathScan failed (its first problem).
let why = "";

// Parses at the start of `s` (which is not trimmed at the end): a math function call, or with `sumOnly` a <calc-sum>.
// Its type (undefined when it is malformed or adds unlike types, see `why`) and the index where it ends. `ch` are the
// channel keywords in scope (numbers).
function mathScan(
  s: string,
  ch: readonly string[] | undefined,
  sumOnly: boolean,
): [CT | undefined, number] {
  let i = 0;
  const tok = (r: RegExp) => {
    r.lastIndex = i;
    const m = r.exec(s);
    if (m) i = r.lastIndex;
    return m?.[0];
  };
  const ws = () => void tok(WS);
  const no = (m: string) => ((why ||= m), undefined);

  function sum(): CT | undefined {
    let a = product();
    for (;;) {
      const at = i;
      ws();
      const op = s[i];
      // `1px+2px` and `1px +2px` are not sums: the operator needs a space on both sides
      if (!a || (op !== "+" && op !== "-") || i === at || !/[ \n\t]/.test(s[i + 1] ?? "")) {
        i = at;
        return a;
      }
      i++;
      ws();
      const b = product();
      if (!b) return undefined;
      a =
        add(a, b) ??
        no(`cannot ${op === "+" ? "add" : "subtract"} ${typeName(a)} and ${typeName(b)}`);
    }
  }
  function product(): CT | undefined {
    let a = value();
    for (;;) {
      const at = i;
      ws();
      const op = s[i];
      if (!a || (op !== "*" && op !== "/")) {
        i = at;
        return a;
      }
      i++;
      ws();
      const b = value();
      if (!b) return undefined;
      a = mul(a, b, op === "*" ? 1 : -1);
    }
  }
  function value(): CT | undefined {
    if (s[i] === "(") {
      i++;
      ws();
      const t = sum();
      ws();
      if (!t) return undefined;
      if (s[i] !== ")") return no('expected ")"');
      i++;
      return t;
    }
    if (tok(NUM_TOKEN) !== undefined) {
      const u = tok(UNIT_TOKEN);
      if (u === undefined) return NUMBER;
      const k = u === "%" ? "percent" : UNITS.get(u);
      return k ? dim(k) : no(`unknown unit "${u}"`);
    }
    const w = tok(WORD);
    if (w === undefined) return no("expected a number, a dimension or a function");
    if (s[i] === "(") return call(w, i++);
    return /^(?:-?infinity|e|pi|nan)$/i.test(w) || ch?.includes(w.toLowerCase())
      ? NUMBER
      : no(`unknown "${w}"`);
  }
  function call(name: string, open: number): CT | undefined {
    if (name === "var" || name === "env") {
      const { end } = args(s.slice(i), "");
      if (end < 0) return no(`${name}() is not closed`);
      i += end + 1;
      return name === "env" || matches(syns["var()"]!, s.slice(open - 3, i))
        ? ANY
        : no("not a var()");
    }
    if (!MATH.has(name)) return no(`${name}() is not a math function`);
    const ts: (CT | "none")[] = [];
    for (let mode = name === "round"; ; ) {
      ws();
      if (mode && tok(ROUND_MODE) !== undefined)
        mode = false; // round( <rounding-strategy>? , ...
      else {
        mode = false;
        const t = name === "clamp" && tok(NONE_WORD) !== undefined ? "none" : sum();
        if (!t) return undefined;
        ts.push(t);
      }
      ws();
      if (s[i] === ",") i++;
      else if (s[i] === ")") break;
      else return no(i >= s.length ? `${name}() is not closed` : 'expected "," or ")"');
    }
    i++;
    const n = ts.length;
    const cs = ts.filter((t): t is CT => t !== "none");
    const [a, b] = cs as [CT, CT];
    const arity = (lo: number, hi = lo) =>
      n >= lo && n <= hi
        ? true
        : (no(`${name}() takes ${lo === hi ? lo : `${lo} to ${hi}`} arguments`), false);
    // the arguments of min(), clamp(), mod() ... are added: they must have one type
    const fold = () =>
      cs.reduce<CT | undefined>(
        (x, y) => x && (add(x, y) ?? no(`${name}() cannot take ${typeName(x)} and ${typeName(y)}`)),
        a,
      );
    const numbers = (r: CT) =>
      cs.every(isNumber)
        ? r
        : no(`${name}() takes numbers, not ${typeName(cs.find((t) => !isNumber(t))!)}`);
    switch (name) {
      case "calc":
      case "abs":
        return arity(1) ? a : undefined;
      case "min":
      case "max":
      case "hypot":
        return arity(1, Infinity) ? fold() : undefined;
      case "clamp":
        return arity(3)
          ? ts[1] === "none"
            ? no("clamp() needs a value in the middle")
            : fold()
          : undefined;
      case "round":
        return n === 1 && isNumber(a) ? a : arity(2) ? fold() : undefined; // B is optional for a number
      case "mod":
      case "rem":
        return arity(2) ? fold() : undefined;
      case "sign":
        return arity(1) ? NUMBER : undefined;
      case "sin":
      case "cos":
      case "tan":
        return arity(1)
          ? isNumber(a) || same(a, dim("angle"))
            ? NUMBER
            : no(`${name}() takes a number or an angle, not ${typeName(a)}`)
          : undefined;
      case "asin":
      case "acos":
      case "atan":
        return arity(1) ? numbers(dim("angle")) : undefined;
      case "sqrt":
      case "exp":
        return arity(1) ? numbers(NUMBER) : undefined;
      case "pow":
        return arity(2) ? numbers(NUMBER) : undefined;
      case "log":
        return arity(1, 2) ? numbers(NUMBER) : undefined;
      default: // atan2: two arguments of one type (no percent hint here)
        return arity(2)
          ? a.any || b.any || (same(a, b) && !a.mix && !b.mix)
            ? dim("angle")
            : no(`atan2() cannot take ${typeName(a)} and ${typeName(b)}`)
          : undefined;
    }
  }

  why = "";
  const t = sumOnly ? sum() : value();
  return [t, i];
}

// Where a numeric primitive did not match its token: a math function of that type, or (in a relative colour) a
// channel keyword or a var().
function mathValue(v: string, s: string, t: string, r: string, ctx: Ctx): Set<string> {
  const kind = KIND[v];
  if (!kind) return NONE;
  if (ctx.ch && (v === "number" || v === "percentage" || v === "angle")) {
    if (v === "number" && ctx.ch.includes(t.toLowerCase())) return new Set([trim(r)]);
    if (s.startsWith("var(")) return consumeType(["type", "var()"], s, ctx);
  }
  if (!t.includes("(") || !MATH_START.test(t)) return NONE;
  const [ty, end] = mathScan(s, ctx.ch, false);
  if (ty && fits(ty, kind)) return new Set([trim(s.slice(end))]);
  ctx.why = [ctx.len - s.length, ty ? `${s.slice(0, end)} is ${typeName(ty)}, not <${v}>` : why];
  return NONE;
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
    rs = PRIMITIVE[v].test(t) ? new Set([trim(r)]) : mathValue(v, s, t, r, ctx);
  } else if (SCAN[v]) {
    const n = SCAN[v](s, ctx);
    rs = n < 0 ? NONE : new Set([trim(s.slice(n))]);
  } else if (syns[v]) {
    // `<name()>`: the name must be next before its grammar is even parsed (as in css.ts)
    rs =
      v.endsWith("()") && !s.startsWith(`${v.slice(0, -2)}(`)
        ? NONE
        : consume(parseGrammar(syns[v]), s, ctx, label ?? `<${v}>`);
    // <angle> | <percentage> alone would not take `calc(10deg + 5%)`
    if (v === "angle-percentage") {
      const m = mathValue(v, s, ...tok1(s), ctx);
      if (m !== NONE) rs = union([rs, m]);
    }
  } else rs = NONE;
  if (rs === NONE) {
    fail(ctx, s, label ?? `<${v}>`);
    if (ctx.pend && (PRIMITIVE[v] || SCAN[v] || v.endsWith("()")))
      return pend(["type", v, lo, hi], s, ctx, label);
  }
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

// || (all=false: at least one part) and && (all=true: every part), any order, each part at most once. A placeholder at the
// head may stand for any of the parts, whole, and for the head of one more: so what follows it is any of the parts, or the
// rest of the one it began, and no part is required (`all` is off). Without that the states that stay at the placeholder
// would go through every order of the parts. Where no placeholder is at the head, `&&` still takes every part.
function anyOrder(
  xs: Node[],
  s: string,
  all: boolean,
  sub: (x: Node, r: string) => Set<string>,
  pend = false,
): Set<string> {
  if (!xs.length) return new Set([s]);
  const e = pend ? pendingEnd(s) : -1;
  const q = e < 0 ? s : trim(s.slice(e)); // the text after the placeholder
  const out =
    e < 0 ? new Set<string>() : union([new Set([s, q]), anyOrder(xs, q, false, sub, pend)]);
  xs.forEach((x, i) => {
    for (const r1 of sub(x, s)) {
      if (e >= 0 && (r1 === s || r1 === q)) continue; // covered above
      if (!all || e >= 0) out.add(r1);
      for (const r of anyOrder(
        xs.filter((_, j) => j !== i),
        r1,
        all && e < 0,
        sub,
        pend,
      ))
        out.add(r);
    }
  });
  return out;
}

// ---------------------------------------------------------------- public

// `pending`: `s` is a property value, where a var(), env() or if() is a placeholder (see "Pending substitution").
export function matches(syntax: string, s: string, pending = false): boolean {
  const v = trim(s);
  const ctx: Ctx = {
    len: v.length,
    far: -1,
    expected: new Set(),
    pend: pending && PENDING.test(v),
  };
  return complete(consume(parseGrammar(syntax), v, ctx), ctx);
}

// Twin of Valid<P, S> (ValidIn<Label, G, S> with `syntax`): returns the value, or throws with the furthest point
// reached and what was expected. `p` is the property, or what a message calls a plugin's grammar.
export function valid(p: string, s: string, syntax: string | undefined = props[p]): string {
  if (!syntax)
    throw new UnknownPropertyError({ message: `${p}: no grammar for this property`, property: p });
  const v = trim(s);
  const ctx: Ctx = { len: v.length, far: -1, expected: new Set(), pend: PENDING.test(v) };
  const rs = consume(parseGrammar(syntax), v, ctx);
  if (complete(rs, ctx)) return s;
  for (const r of rs) fail(ctx, r, "end of value");
  const [token] = tok1(v.slice(ctx.far));
  const what = token ? `unexpected "${token}"` : "unexpected end";
  const expected = [...ctx.expected];
  throw new InvalidValueError({
    message: `${p}: ${what} in "${s}", expected ${expected.join(" | ")}${ctx.why?.[0] === ctx.far ? ` (${ctx.why[1]})` : ""}`,
    property: p,
    value: s,
    position: ctx.far + (s.length - v.length),
    expected,
  });
}
