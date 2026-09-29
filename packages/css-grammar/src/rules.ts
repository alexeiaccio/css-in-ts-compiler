// Prose rules: validity rules that the specs state in text, not in the value grammar. One function per
// property (`rules`) or per CSS function (`fnRules`); it returns why the value is invalid, or undefined.
// `checkRules` fails like the twin's `valid`: with a tagged error that names the property and the value.
//
// The rules themselves are plain code that calls the twin core directly; `checkRules` is the Effect boundary.
import { Effect } from "effect";

import { RuleError } from "./errors.ts";
import { matches } from "./twin-core.ts";

// Top-level comma split: commas inside (...) or quotes do not count.
const splitList = (v: string) =>
  v.match(/(?:"[^"]*"|'[^']*'|\([^()]*(?:\([^()]*\)[^()]*)*\)|[^,"'()])+/g)?.map((s) => s.trim()) ??
  [];

const CSS_WIDE = new Set(["inherit", "initial", "unset", "revert", "revert-layer", "revert-rule"]);

// The bodies of the quoted strings in a value (escapes ignored, like the twin).
const strings = (v: string) => [...v.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]!);
// A top-level negative number or dimension: `-1`, `-0.5px`, `2 -3`; not `calc(-1px)`, not `calc(1px - -1px)`, not `a-1`.
const negative = (v: string) => {
  for (let p = ""; p !== v; ) [p, v] = [v, v.replace(/\([^()]*\)/g, "")];
  return /(^|[\s,])-\.?\d/.test(v);
};
const words = (v: string) =>
  v
    .toLowerCase()
    .split(/[\s(),]+/)
    .filter(Boolean);

// https://drafts.csswg.org/css-grid-2/#propdef-grid-template-areas (§7.3): a string holds named cell tokens (ident
// code points), null cell tokens ("."), whitespace, and "a sequence of any other characters, representing a trash
// token. A trash token is a syntax error, and makes the declaration invalid. All strings must define the same number
// of cell tokens ..., and at least one cell token, or else the declaration is invalid." Also: "If a named grid area
// spans multiple grid cells, but those cells do not form a single filled-in rectangle, the declaration is invalid."
function gridAreas(v: string) {
  const grid = strings(v).map((s) => {
    const cells: string[] = [];
    for (const [, name, nul, trash] of s.matchAll(/([\w\u0080-\uffff-]+)|(\.+)|\s+|(.)/gu)) {
      if (trash) return `the string "${s}" has a trash token ${JSON.stringify(trash)}`;
      if (name || nul) cells.push(name ?? "");
    }
    return cells;
  });
  const bad = grid.find((r) => typeof r === "string");
  if (bad) return `${bad} (css-grid-2 §7.3)`;
  const rows = grid as string[][];
  if (rows.some((r) => !r.length || r.length !== rows[0]!.length))
    return `every string needs the same number, at least one, of cell tokens (css-grid-2 §7.3)`;
  const areas = new Map<string, number[][]>();
  rows.forEach((r, y) => r.forEach((n, x) => n && areas.set(n, [...(areas.get(n) ?? []), [y, x]])));
  for (const [n, cs] of areas) {
    const ys = cs.map((c) => c[0]!),
      xs = cs.map((c) => c[1]!);
    const box = (Math.max(...ys) - Math.min(...ys) + 1) * (Math.max(...xs) - Math.min(...xs) + 1);
    if (box !== cs.length) return `the area "${n}" is not a rectangle (css-grid-2 §7.3)`;
  }
}

// https://drafts.csswg.org/css-grid-2/#line-placement (§8.3): "In all the above productions, the <custom-ident>
// additionally excludes the keywords span and auto." So `span` alone, or twice, cannot be a <grid-line>.
function gridLine(v: string) {
  for (const part of v.split("/")) {
    const t = words(part);
    const spans = t.filter((w) => w === "span").length;
    if (spans > 1 || (spans === 1 && t.length === 1))
      return `"${part.trim()}" uses span as a line name, which the <custom-ident> excludes (css-grid-2 §8.3)`;
    // "An <integer> value of zero makes the declaration invalid", and a span is `span && [ <integer [1,∞]> || ... ]`
    const ints = t.filter((w) => /^[+-]?\d+$/.test(w)).map(Number);
    if (ints.includes(0) || (spans && ints.some((n) => n < 1)))
      return `"${part.trim()}" has an integer that is zero, or negative in a span (css-grid-2 §8.3)`;
  }
}

// https://drafts.csswg.org/css-grid-2/#repeat-notation (§7.2.3.2): "On a subgridded axis, the auto-fill keyword is
// only valid once per <line-name-list>".
const subgridAutoFill = (v: string) =>
  /^\s*subgrid\b/.test(v) && (v.match(/repeat\(\s*auto-fill/g) ?? []).length > 1
    ? `auto-fill is only valid once on a subgrid (css-grid-2 §7.2.3.2)`
    : undefined;

// https://drafts.csswg.org/css-lists-3/#counter-properties (§4): "A <counter-name> name cannot match the keyword
// none; such an identifier is invalid as a <counter-name>." (also inside reversed())
const counterName = (v: string) =>
  v.trim().toLowerCase() !== "none" && words(v).includes("none")
    ? `"none" cannot be a counter name (css-lists-3 §4)`
    : undefined;

// SVG 2 §7.3-7.5 (r, rx, ry): "A negative value for r must be treated as an illegal value."
const svgRadius = (v: string) =>
  negative(v) ? `a negative radius is illegal (svg2 §7.3-7.5)` : undefined;
// https://drafts.fxtf.org/fill-stroke-3/#stroke-width (§4.2.1) and #stroke-dasharray (§4.3.1): "Negative values are invalid."
const strokeLength = (v: string) =>
  negative(v) ? `negative values are invalid (fill-stroke-3 §4.2.1, §4.3.1)` : undefined;

// https://www.w3.org/TR/SVG2/paths.html#PathDataBNF (§9.3.9): path data is a moveto, then commands, each with at
// least one full group of numbers; arc flags are single 0 or 1 characters, so they need no separator. Empty is valid.
function pathData(d: string) {
  const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y,
    FLAG = /[01]/y,
    SEP = /\s*,?\s*/y,
    ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
  let i = 0;
  const eat = (r: RegExp) => ((r.lastIndex = i), r.test(d) && ((i = r.lastIndex), true));
  eat(SEP);
  if (i === d.length) return true;
  if (!/[Mm]/.test(d[i]!)) return false;
  while (i < d.length) {
    const n = ARGS[d[i++]!.toLowerCase()];
    if (n === undefined) return false;
    eat(SEP);
    if (n === 0) continue;
    do
      for (let k = 0; k < n; k++) {
        if (!eat(n === 7 && (k === 3 || k === 4) ? FLAG : NUMBER)) return false;
        eat(SEP);
      }
    while (i < d.length && !/[A-Za-z]/.test(d[i]!));
  }
  return true;
}

const openTypeTags = (v: string) => {
  const bad = strings(v).find((s) => !/^[\x20-\x7e]{4}$/.test(s));
  if (bad !== undefined)
    return `"${bad}" is not a four-character tag of U+20-7E (css-fonts-4 §6.12, §8.2)`;
};

const rules: Record<string, (v: string) => string | undefined> = {
  "grid-template-areas": gridAreas,
  "grid-template": gridAreas,
  grid: gridAreas,
  "grid-row": gridLine,
  "grid-column": gridLine,
  "grid-row-start": gridLine,
  "grid-row-end": gridLine,
  "grid-column-start": gridLine,
  "grid-column-end": gridLine,
  "grid-area": gridLine,
  "grid-template-rows": subgridAutoFill,
  "grid-template-columns": subgridAutoFill,
  "counter-reset": counterName,
  "counter-set": counterName,
  "counter-increment": counterName,
  // https://drafts.csswg.org/css-conditional-5/#container-name (§5.2): "The keywords none, and, not, and or are
  // excluded from this <custom-ident>."
  "container-name"(v) {
    const bad =
      v.trim().toLowerCase() !== "none" &&
      words(v).find((w) => ["none", "and", "not", "or"].includes(w));
    if (bad) return `"${bad}" cannot be a container name (css-conditional-5 §5.2)`;
  },
  // https://drafts.csswg.org/css-view-transitions-2/#view-transition-class-prop (§10.3): "none is an invalid
  // <custom-ident> for view-transition-class, even when combined with another <custom-ident>."
  "view-transition-class"(v) {
    if (v.trim().toLowerCase() !== "none" && words(v).includes("none"))
      return `"none" cannot be combined with another class (css-view-transitions-2 §10.3)`;
  },
  // https://drafts.csswg.org/css-color-adjust-1/#color-scheme-prop (§2.2): "The normal, light, dark, and only
  // keywords are not valid <custom-ident>s in color-scheme." So normal stands alone, and a second only, or one in the
  // middle of the schemes, is an ident.
  "color-scheme"(v) {
    const t = words(v);
    if (t.length > 1 && t.includes("normal"))
      return `"normal" cannot be combined with schemes (css-color-adjust-1 §2.2)`;
    if (
      t.some((w, i) => w === "only" && i > 0 && i < t.length - 1) ||
      t.filter((w) => w === "only").length > 1
    )
      return `"only" is a keyword, not a scheme name, and goes first or last (css-color-adjust-1 §2.2)`;
  },
  // https://drafts.csswg.org/css-fonts-4/#font-feature-settings-prop (§6.12) and #font-variation-settings-def (§8.2):
  // "Tag strings longer or shorter than four characters, or containing characters outside the U+20-7E codepoint range
  // are invalid."
  "font-feature-settings": openTypeTags,
  "font-variation-settings": openTypeTags,
  // https://drafts.csswg.org/css-fonts-4/#font-language-override-prop (§6.13): "single four-character
  // case-sensitive OpenType language system tag", shorter ones are padded, so a longer string is no tag.
  "font-language-override"(v) {
    const long = strings(v).find((s) => s.length > 4);
    if (long !== undefined)
      return `"${long}" is longer than an OpenType language system tag, four characters (css-fonts-4)`;
  },
  // the families of `font` are its last items: the ones after the first comma follow the font-family rule
  font: (v) => rules["font-family"]!(splitList(v).slice(1).join(", ")),
  r: svgRadius,
  rx: svgRadius,
  ry: svgRadius,
  // https://www.w3.org/TR/SVG2/painting.html#StrokeMiterlimitProperty (§13.5.5): "A negative value for
  // stroke-miterlimit must be treated as an illegal value."
  "stroke-miterlimit": (v) =>
    negative(v) ? `a negative miter limit is illegal (svg2 §13.5.5)` : undefined,
  "stroke-width": strokeLength,
  "stroke-dasharray": strokeLength,
  // https://drafts.csswg.org/css-transitions-1/#transition-shorthand-property (§2.5): "If there is more than one
  // <single-transition> in the shorthand, and any of the transitions has none as the <single-transition-property>,
  // then the declaration is invalid."
  transition(v) {
    const items = splitList(v);
    if (
      items.length > 1 &&
      items.some((t) =>
        t
          .replace(/\([^)]*\)/g, "")
          .split(/\s+/)
          .includes("none"),
      )
    )
      return `"none" is only valid when it is the only transition, this list has ${items.length} (css-transitions-1 §2.5)`;
    for (const item of items) {
      // §2.5: "the first value that can be parsed as a time is assigned to the transition-duration", and "A
      // negative value for transition-duration renders the declaration invalid" (§2.2). Chrome reads a lone
      // negative time as the delay; both readings reject two negative times (WPT transition-invalid.html "-1s -2s").
      const times = item
        .replace(/\([^)]*\)/g, "")
        .split(/\s+/)
        .filter((t) => matches("<time>", t));
      if (times.length === 2 && times.every((t) => t.startsWith("-")))
        return `one of the times in "${item}" is the duration, which cannot be negative (css-transitions-1 §2.2, §2.5)`;
      // https://drafts.csswg.org/css-values-4/#custom-idents (§4.2): "When parsing positionally-ambiguous keywords
      // in a property value, a <custom-ident> production can only claim the keyword if no other unfulfilled
      // production can claim it." So in `ease-in steps(2)` ease-in is the easing function, and steps(2) is left over.
      const taken = new Set<string>();
      for (const t of item.match(/[\w-]+\([^)]*\)|\S+/g) ?? []) {
        const slot = ["<easing-function>", "<transition-behavior-value>"].find((g) =>
          matches(g, t),
        );
        if (slot && !taken.has(slot)) taken.add(slot);
        else if (slot && (t.includes("(") || taken.has("ident")))
          return `"${t}" has no place left in "${item}": an earlier keyword took the ${slot} (css-values-4 §4.2)`;
        else if (t === "none" || matches("<single-transition-property>", t)) taken.add("ident");
      }
    }
  },
  // https://drafts.csswg.org/css-values-4/#custom-idents (§4.2), as in `transition`: the animation name is a
  // <custom-ident>, so `infinite` is the name only when no other production can claim it; a second keyword of a slot
  // that is already filled is the name, and a number or a function cannot be one.
  animation(v) {
    const slots = [
      "<easing-function>",
      "<single-animation-iteration-count>",
      "<single-animation-direction>",
      "<single-animation-fill-mode>",
      "<single-animation-play-state>",
    ];
    for (const item of splitList(v)) {
      const taken = new Set<string>();
      for (const t of item.match(/[\w-]+\([^)]*\)|\S+/g) ?? []) {
        const slot = slots.find((g) => matches(g, t));
        if (!slot) continue;
        if (!taken.has(slot)) taken.add(slot);
        else if (t.includes("(") || taken.has("name") || !matches("<keyframes-name>", t))
          return `"${t}" has no place left in "${item}": an earlier keyword took the ${slot} (css-values-4 §4.2)`;
        else taken.add("name");
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
      const bad = ids.find(
        (id) =>
          id.toLowerCase() === "default" ||
          CSS_WIDE.has(id.toLowerCase()) ||
          matches("<generic-family>", id.toLowerCase()),
      );
      if (bad)
        return `the keyword "${bad}" cannot be (part of) the unquoted family name "${item}", quote the name (css-fonts-4 §2.1.1)`;
    }
  },
};

// Rules about a function rather than a property: they run on every declaration.
const fnRules: ((p: string, v: string) => string | undefined)[] = [
  // https://drafts.csswg.org/filter-effects-1/#supported-filter-functions (§6.1): "Negative values are not allowed"
  // for the amount of grayscale(), sepia(), saturate(), opacity(), invert(), brightness(), contrast() and the radius of blur().
  (_, v) => {
    const m = /\b(grayscale|sepia|saturate|opacity|invert|brightness|contrast|blur)\(\s*-/.exec(v);
    if (m) return `${m[1]}() cannot take a negative value (filter-effects-1 §6.1)`;
  },
  // https://drafts.csswg.org/css-shapes-1/#funcdef-basic-shape-path (§3.1): the <string> of path() is SVG path data,
  // and "a path data string that does not conform to the grammar and parsing rules of SVG 1.1" is invalid.
  (_, v) => {
    for (const m of v.matchAll(
      /\bpath\(\s*(?:(?:nonzero|evenodd)\s*,\s*)?(?:"([^"]*)"|'([^']*)')/g,
    )) {
      const d = m[1] ?? m[2]!;
      if (!pathData(d)) return `"${d}" is not SVG path data (css-shapes-1 §3.1, svg2 §9.3.9)`;
    }
  },
  // https://drafts.csswg.org/css-easing-2/#step-easing-functions (§2.3): "If the <step-position> is jump-none,
  // the <integer> must be at least 2, or the function is invalid. Otherwise, the <integer> must be at least 1".
  (_, v) => {
    for (const [f, n, pos] of v.matchAll(/steps\(\s*([+-]?\d+)\s*(?:,\s*([a-z-]+)\s*)?\)/g)) {
      const min = pos === "jump-none" ? 2 : 1;
      if (Number(n) < min)
        return `${f} needs at least ${min} step${min > 1 ? "s" : ""} (css-easing-2 §2.3)`;
    }
  },
  // https://drafts.csswg.org/css-anchor-position-1/#anchor-size-fn (§5): anchor-size() "is only allowed in the
  // accepted @position-try properties (and is otherwise invalid)": sizing, inset and margin properties here.
  // flex-basis reaches it through <'width'>, and is not one of them.
  (p, v) => {
    if (
      v.includes("anchor-size(") &&
      !/^((min-|max-)?(width|height|block-size|inline-size)|top|left|right|bottom|inset(-.+)?|margin(-.+)?)$/.test(
        p,
      )
    )
      return `anchor-size() is only valid in sizing, inset and margin properties (css-anchor-position-1 §5)`;
  },
];

// Why the value is invalid by prose, or undefined. Plain core, also called by check.ts (one boundary per declaration).
export function violation(p: string, v: string): RuleError | undefined {
  let why = rules[p]?.(v);
  for (const f of fnRules) why ??= f(p, v);
  return why
    ? new RuleError({ message: `${p}: in "${v}", ${why}`, property: p, value: v, reason: why })
    : undefined;
}

// Once per declaration: fnUntraced, like `valid` in twin.ts.
export const checkRules = Effect.fnUntraced(function* (
  p: string,
  v: string,
): Effect.fn.Return<string, RuleError> {
  const error = violation(p, v);
  if (error) return yield* error;
  return v;
});
