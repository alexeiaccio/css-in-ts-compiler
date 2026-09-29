// Prose rules: validity rules that the specs state in text, not in the value grammar. One function per
// property (`rules`) or per CSS function (`fnRules`); it returns why the value is invalid, or undefined.
// `checkRules` fails like the twin's `valid`: with a tagged error that names the property and the value.
//
// The rules themselves are plain code that calls the twin core directly; `checkRules` is the Effect boundary.
import { Effect } from "effect";

import { RuleError } from "./errors.ts";
import { matches } from "./twin-core.ts";

// Top-level comma split: commas inside (...) or quotes do not count.
const splitList = (v: string) => v.match(/(?:"[^"]*"|'[^']*'|\([^()]*(?:\([^()]*\)[^()]*)*\)|[^,"'()])+/g)?.map((s) => s.trim()) ?? [];

const CSS_WIDE = new Set(["inherit", "initial", "unset", "revert", "revert-layer", "revert-rule"]);

// Type of a <calc-sum> (css-values-4 §10.9 "Type Checking"): "number", "length" (percentages count as lengths,
// they resolve against one wherever calc-size() is allowed), another dimension's unit, or undefined when `+`/`-`
// mix types or `*` multiplies two dimensions. The grammar already checked the shape.
function calcType(s: string): string | undefined {
  const toks = s.match(/[()*/]|[+-](?=\s)|[^\s()*/]+/g) ?? [];
  let i = 0;
  const value = (): string | undefined => {
    const t = toks[i++] ?? "";
    if (t === "(") return ((x) => (i++, x))(sum());
    if (matches("<number>", t) || /^-?(e|pi|infinity|nan)$/i.test(t)) return "number";
    return matches("<length-percentage>", t) ? "length" : t.replace(/^[+-]?[\d.]+/, "");
  };
  const product = () => {
    let a = value();
    while (toks[i] === "*" || toks[i] === "/") {
      const op = toks[i++], b = value();
      a = a === undefined || b === undefined ? undefined : op === "/" ? (b === "number" ? a : undefined) : a === "number" ? b : b === "number" ? a : undefined;
    }
    return a;
  };
  const sum = () => {
    let a = product();
    while (toks[i] === "+" || toks[i] === "-") i++, a = product() === a ? a : undefined;
    return a;
  };
  return sum();
}

// https://drafts.csswg.org/css-values-5/#calc-size (§11): "For either argument, if a <calc-sum> is given, its
// type must match <length-percentage>". A keyword or nested calc-size() basis is not a <calc-sum>.
function calcSize(v: string) {
  for (const m of v.matchAll(/calc-size\(/g)) {
    const args = [""];
    for (let j = m.index + m[0].length, d = 1; j < v.length; j++) {
      d += v[j] === "(" ? 1 : v[j] === ")" ? -1 : 0;
      if (!d) break;
      if (d === 1 && v[j] === ",") args.push("");
      else args[args.length - 1] += v[j];
    }
    for (const a of args.map((x) => x.trim())) {
      if (/^(calc-size\(|[a-z-]+$)/i.test(a) && !/^-?(e|pi|infinity|nan)$/i.test(a)) continue;
      const t = calcType(a);
      if (t !== "length") return `the calc-size() argument "${a}" is ${t ? `of type ${t}` : "a type mismatch"}, it must be a <length-percentage> (css-values-5 §11)`;
    }
  }
}

const rules: Record<string, (v: string) => string | undefined> = {
  // https://drafts.csswg.org/css-transitions-1/#transition-shorthand-property (§2.5): "If there is more than one
  // <single-transition> in the shorthand, and any of the transitions has none as the <single-transition-property>,
  // then the declaration is invalid."
  transition(v) {
    const items = splitList(v);
    if (items.length > 1 && items.some((t) => t.replace(/\([^)]*\)/g, "").split(/\s+/).includes("none")))
      return `"none" is only valid when it is the only transition, this list has ${items.length} (css-transitions-1 §2.5)`;
    for (const item of items) {
      // §2.5: "the first value that can be parsed as a time is assigned to the transition-duration", and "A
      // negative value for transition-duration renders the declaration invalid" (§2.2). Chrome reads a lone
      // negative time as the delay; both readings reject two negative times (WPT transition-invalid.html "-1s -2s").
      const times = item.replace(/\([^)]*\)/g, "").split(/\s+/).filter((t) => matches("<time>", t));
      if (times.length === 2 && times.every((t) => t.startsWith("-"))) return `one of the times in "${item}" is the duration, which cannot be negative (css-transitions-1 §2.2, §2.5)`;
      // https://drafts.csswg.org/css-values-4/#custom-idents (§4.2): "When parsing positionally-ambiguous keywords
      // in a property value, a <custom-ident> production can only claim the keyword if no other unfulfilled
      // production can claim it." So in `ease-in steps(2)` ease-in is the easing function, and steps(2) is left over.
      const taken = new Set<string>();
      for (const t of item.match(/[\w-]+\([^)]*\)|\S+/g) ?? []) {
        const slot = ["<easing-function>", "<transition-behavior-value>"].find((g) => matches(g, t));
        if (slot && !taken.has(slot)) taken.add(slot);
        else if (slot && (t.includes("(") || taken.has("ident"))) return `"${t}" has no place left in "${item}": an earlier keyword took the ${slot} (css-values-4 §4.2)`;
        else if (t === "none" || matches("<single-transition-property>", t)) taken.add("ident");
      }
    }
  },
  // https://drafts.csswg.org/css-fonts-4/#font-family-name-syntax (§2.1.1): "Any identifier which could be
  // misinterpreted as a pre-defined keyword in the font-family value definition, or the CSS-wide keywords, is not
  // allowed." A lone generic keyword is the generic family, a lone CSS-wide keyword as the whole value is itself;
  // `default` is reserved (css-values-4 <custom-ident>). Chrome only checks the first identifier of a name.
  "font-family"(v) {
    const items = splitList(v);
    for (const item of items) {
      if (/^["']/.test(item)) continue;
      const ids = item.split(/\s+/);
      if (ids.length === 1 && matches("<generic-family>", ids[0]!.toLowerCase())) continue;
      if (items.length === 1 && ids.length === 1 && CSS_WIDE.has(ids[0]!.toLowerCase())) continue;
      const bad = ids.find((id) => id.toLowerCase() === "default" || CSS_WIDE.has(id.toLowerCase()) || matches("<generic-family>", id.toLowerCase()));
      if (bad) return `the keyword "${bad}" cannot be (part of) the unquoted family name "${item}", quote the name (css-fonts-4 §2.1.1)`;
    }
  },
};

// Rules about a function rather than a property: they run on every declaration.
const fnRules: ((p: string, v: string) => string | undefined)[] = [
  (_, v) => calcSize(v),
  // https://drafts.csswg.org/css-easing-2/#step-easing-functions (§2.3): "If the <step-position> is jump-none,
  // the <integer> must be at least 2, or the function is invalid. Otherwise, the <integer> must be at least 1".
  (_, v) => {
    for (const [f, n, pos] of v.matchAll(/steps\(\s*([+-]?\d+)\s*(?:,\s*([a-z-]+)\s*)?\)/g)) {
      const min = pos === "jump-none" ? 2 : 1;
      if (Number(n) < min) return `${f} needs at least ${min} step${min > 1 ? "s" : ""} (css-easing-2 §2.3)`;
    }
  },
  // https://drafts.csswg.org/css-anchor-position-1/#anchor-size-fn (§5): anchor-size() "is only allowed in the
  // accepted @position-try properties (and is otherwise invalid)": sizing, inset and margin properties here.
  // flex-basis reaches it through <'width'>, and is not one of them.
  (p, v) => {
    if (v.includes("anchor-size(") && !/^((min-|max-)?(width|height|block-size|inline-size)|top|left|right|bottom|inset(-.+)?|margin(-.+)?)$/.test(p))
      return `anchor-size() is only valid in sizing, inset and margin properties (css-anchor-position-1 §5)`;
  },
];

// Why the value is invalid by prose, or undefined. Plain core, also called by check.ts (one boundary per declaration).
export function violation(p: string, v: string): RuleError | undefined {
  let why = rules[p]?.(v);
  for (const f of fnRules) why ??= f(p, v);
  return why ? new RuleError({ message: `${p}: in "${v}", ${why}`, property: p, value: v, reason: why }) : undefined;
}

// Once per declaration: fnUntraced, like `valid` in twin.ts.
export const checkRules = Effect.fnUntraced(function* (p: string, v: string): Effect.fn.Return<string, RuleError> {
  const error = violation(p, v);
  if (error) return yield* error;
  return v;
});
