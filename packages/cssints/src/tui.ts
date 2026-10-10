// cssints/tui (docs/research/tui.md): the css.* members of a terminal. Each builds a node of entries, `{ __tui }`, and the
// engine (macro.ts `replacementOf`, through `registry.tui`) replaces a site that holds one by an object literal of props:
// cells for lengths, `#rrggbb` for colours, `:hover`, `:focus` and `:active` overlays, and the values each theme changes.
// Plain code like lib.ts: user code calls the builders in expressions; they throw a MacroError at the site.
import { clampRgb, formatHex, formatHex8 } from "culori/fn";
import { Formatter } from "effect";

import { parseColor as parse } from "./color.ts";
import { together, valueOf } from "./contrast.ts";
import { css as rgbOf, evaluate } from "./derived.ts";
import { fail } from "./node.ts";
import { registry } from "./registry.ts";

export { createGlobalTheme, createTokens } from "./theme.ts";

type State = "" | ":hover" | ":focus" | ":active";
type Value = string | number | boolean;
/** One prop: its key, its value (a colour is CSS text, resolved per theme at the site), and the state it is under. */
type Entry = [key: string, value: Value, state: State, colour?: true];
interface TuiNode {
  __tui: Entry[];
}

const isTui = (v: unknown): v is TuiNode =>
  !!v && typeof v === "object" && Array.isArray((v as TuiNode).__tui);
const node = (entries: Entry[]): TuiNode => ({ __tui: entries });
const say = (v: unknown) => (typeof v === "string" ? `"${v}"` : Formatter.formatJson(v));

// ---------- values

const PERCENT = /^-?(?:\d+\.?\d*|\.\d+)%$/;
const LENGTH = /^-?(?:\d+\.?\d*|\.\d+)[a-z]+$/i;

// A number of cells, `N%`, or `auto` where the property takes it.
const cells =
  (auto: boolean, percent = true) =>
  (prop: string, v: unknown): Value => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      if (percent && PERCENT.test(v)) return v;
      if (auto && v === "auto") return v;
      if (LENGTH.test(v))
        throw fail(`cssints: ${prop}: a terminal counts cells: write a number, not ${say(v)}`);
    }
    throw fail(
      `cssints: ${prop}: unexpected ${say(v)}, expected a number of cells${percent ? ", N%" : ""}${auto ? " or auto" : ""}`,
    );
  };
const number =
  (min: number, max = Infinity, integer = false) =>
  (prop: string, v: unknown): Value => {
    if (typeof v === "number" && v >= min && v <= max && (!integer || Number.isInteger(v)))
      return v;
    throw fail(
      `cssints: ${prop}: unexpected ${say(v)}, expected ${integer ? "an integer" : "a number"}${max < Infinity ? ` from ${min} to ${max}` : min > -Infinity ? ` of at least ${min}` : ""}`,
    );
  };
const keyword =
  (...words: string[]) =>
  (prop: string, v: unknown): Value => {
    if (typeof v === "string" && words.includes(v)) return v;
    throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected ${words.join(" | ")}`);
  };

// A colour as `#rrggbb` (`#rrggbbaa` when translucent), or undefined: culori reads names, hex, rgb(), hsl(), oklch(), ...;
// the evaluator of derived tokens reads color-mix() and relative colours.
const hexOf = (text: string): string | undefined => {
  let c = parse(text);
  if (!c && /\b(?:color-mix|from)\b/.test(text)) {
    let rgb: string | undefined;
    try {
      rgb = rgbOf(evaluate(text));
    } catch {
      rgb = undefined;
    }
    c = rgb === undefined ? undefined : parse(rgb);
  }
  if (!c) return undefined;
  const clipped = clampRgb(c);
  return (c.alpha ?? 1) < 1 ? formatHex8(clipped) : formatHex(clipped);
};
const VAR = /var\((--[\w-]+)\)/g;
const colour = (prop: string, v: unknown): Value => {
  const text = String(v);
  for (const [, name] of text.matchAll(VAR)) {
    const def = registry.defs.get(name!);
    if (!def) throw fail(`cssints: ${prop}: ${name} is no token of createTokens`);
    if (def.kind !== "color" && text === `var(${name})`)
      throw fail(`cssints: ${prop}: ${def.path} is a ${def.kind} token, not a colour`);
  }
  if (!text.includes("var(") && hexOf(text) === undefined)
    throw fail(
      `cssints: ${prop}: ${say(v)} is not a colour a terminal can show (a name, hex, rgb(), hsl(), oklch(), color-mix(); not currentColor, a system colour or light-dark())`,
    );
  return text;
};

// ---------- members

type Read = (prop: string, v: unknown) => Value;
const one =
  (key: string, read: Read, isColour = false) =>
  (prop: string, parts: unknown[]): Entry[] => {
    if (parts.length !== 1) throw fail(`cssints: ${prop} takes one value, got ${parts.length}`);
    return [isColour ? [key, read(prop, parts[0]), "", true] : [key, read(prop, parts[0]), ""]];
  };
// 1 to 4 values, as in CSS (top, right, bottom, left), or 1 to 2 for the inline or block pair.
const sides =
  (base: string, read: Read, which: readonly string[] = ["Top", "Right", "Bottom", "Left"]) =>
  (prop: string, parts: unknown[]): Entry[] => {
    const n = which.length === 4 ? 4 : 2;
    if (parts.length < 1 || parts.length > n)
      throw fail(`cssints: ${prop} takes 1 to ${n} values, got ${parts.length}`);
    const v = parts.map((p) => read(prop, p));
    const at =
      n === 4
        ? [v[0]!, v[1] ?? v[0]!, v[2] ?? v[0]!, v[3] ?? v[1] ?? v[0]!]
        : [v[0]!, v[1] ?? v[0]!];
    return which.map((s, i): Entry => [`${base}${s}`, at[i]!, ""]);
  };
const flags =
  (table: Record<string, Record<string, boolean>>, many = false) =>
  (prop: string, parts: unknown[]): Entry[] => {
    if (parts.length < 1 || (!many && parts.length > 1))
      throw fail(`cssints: ${prop} takes ${many ? "a value" : "one value"}, got ${parts.length}`);
    const out: Record<string, boolean> = {};
    for (const p of parts) {
      const set = typeof p === "string" ? table[p] : undefined;
      if (!set || (parts.length > 1 && p === "none"))
        throw fail(
          `cssints: ${prop}: unexpected ${say(p)}, expected ${Object.keys(table).join(" | ")}`,
        );
      for (const [k, b] of Object.entries(set)) out[k] = (parts.length > 1 && out[k]) || b;
    }
    return Object.entries(out).map(([k, b]): Entry => [k, b, ""]);
  };

const BORDER: Record<string, Entry[]> = {
  none: [["border", false, ""]],
  solid: [
    ["border", true, ""],
    ["borderStyle", "single", ""],
  ],
  double: [
    ["border", true, ""],
    ["borderStyle", "double", ""],
  ],
  rounded: [
    ["border", true, ""],
    ["borderStyle", "rounded", ""],
  ],
  heavy: [
    ["border", true, ""],
    ["borderStyle", "heavy", ""],
  ],
};
const borderStyleOf = (prop: string, v: unknown): Entry[] => {
  const e = typeof v === "string" ? BORDER[v] : undefined;
  if (!e)
    throw fail(
      `cssints: ${prop}: unexpected ${say(v)}, expected ${Object.keys(BORDER).join(" | ")}`,
    );
  return e;
};

const SIZE = cells(true);
const EDGE = cells(false);
const ALIGN = [
  "auto",
  "flex-start",
  "center",
  "flex-end",
  "stretch",
  "baseline",
  "space-between",
  "space-around",
  "space-evenly",
];
const JUSTIFY = [
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
  "space-evenly",
];
const CURSORS = [
  "auto",
  "default",
  "none",
  "context-menu",
  "help",
  "pointer",
  "progress",
  "wait",
  "cell",
  "crosshair",
  "text",
  "vertical-text",
  "alias",
  "copy",
  "move",
  "no-drop",
  "not-allowed",
  "grab",
  "grabbing",
  "all-scroll",
  "col-resize",
  "row-resize",
  "n-resize",
  "e-resize",
  "s-resize",
  "w-resize",
  "ne-resize",
  "nw-resize",
  "se-resize",
  "sw-resize",
  "ew-resize",
  "ns-resize",
  "nesw-resize",
  "nwse-resize",
  "zoom-in",
  "zoom-out",
];

const MEMBERS: Record<string, (prop: string, parts: unknown[]) => Entry[]> = {
  color: one("color", colour, true),
  backgroundColor: one("backgroundColor", colour, true),
  bg: one("backgroundColor", colour, true),
  borderColor: one("borderColor", colour, true),
  caretColor: one("caretColor", colour, true),
  fontWeight: flags({
    bold: { bold: true, dim: false },
    normal: { bold: false, dim: false },
    lighter: { bold: false, dim: true },
  }),
  fontStyle: flags({ italic: { italic: true }, normal: { italic: false } }),
  textDecoration: flags(
    {
      underline: { underline: true, strikethrough: false },
      "line-through": { underline: false, strikethrough: true },
      none: { underline: false, strikethrough: false },
    },
    true,
  ),
  textAlign: one("textAlign", keyword("left", "center", "right")),
  borderStyle: (prop, parts) => {
    if (parts.length !== 1) throw fail(`cssints: ${prop} takes one value, got ${parts.length}`);
    return borderStyleOf(prop, parts[0]);
  },
  border: (prop, parts) => {
    if (parts.length < 1 || parts.length > 2)
      throw fail(
        `cssints: ${prop} takes a style and an optional colour, got ${parts.length} values`,
      );
    const style = borderStyleOf(prop, parts[0]);
    if (parts.length === 2 && parts[0] === "none")
      throw fail(`cssints: ${prop}: a colour of no border`);
    return parts.length === 2
      ? [...style, ["borderColor", colour(prop, parts[1]), "", true]]
      : style;
  },
  padding: sides("padding", EDGE),
  p: sides("padding", EDGE),
  paddingInline: sides("padding", EDGE, ["Left", "Right"]),
  paddingBlock: sides("padding", EDGE, ["Top", "Bottom"]),
  margin: sides("margin", SIZE),
  m: sides("margin", SIZE),
  marginInline: sides("margin", SIZE, ["Left", "Right"]),
  marginBlock: sides("margin", SIZE, ["Top", "Bottom"]),
  ...Object.fromEntries(
    (["Top", "Right", "Bottom", "Left"] as const).flatMap((s) => [
      [`padding${s}`, one(`padding${s}`, EDGE)],
      [`p${s[0]!.toLowerCase()}`, one(`padding${s}`, EDGE)],
      [`margin${s}`, one(`margin${s}`, SIZE)],
      [`m${s[0]!.toLowerCase()}`, one(`margin${s}`, SIZE)],
      [s.toLowerCase(), one(s.toLowerCase(), SIZE)],
    ]),
  ),
  gap: one("gap", EDGE),
  rowGap: one("rowGap", EDGE),
  columnGap: one("columnGap", EDGE),
  ...Object.fromEntries(
    ["width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "flexBasis"].map((k) => [
      k,
      one(k, SIZE),
    ]),
  ),
  flexDirection: one("flexDirection", keyword("row", "column", "row-reverse", "column-reverse")),
  flexWrap: one("flexWrap", keyword("nowrap", "wrap", "wrap-reverse")),
  justifyContent: one("justifyContent", keyword(...JUSTIFY)),
  alignItems: one("alignItems", keyword(...ALIGN)),
  alignSelf: one("alignSelf", keyword(...ALIGN)),
  flexGrow: one("flexGrow", number(0)),
  flexShrink: one("flexShrink", number(0)),
  position: one("position", keyword("relative", "absolute")),
  overflow: one("overflow", keyword("visible", "hidden", "scroll")),
  display: (prop, parts) => {
    const [d] = one("visible", keyword("flex", "none"))(prop, parts);
    return [["visible", d![1] === "flex", ""]];
  },
  opacity: one("opacity", number(0, 1)),
  zIndex: one("zIndex", number(-Infinity, Infinity, true)),
  cursor: one("cursor", keyword(...CURSORS)),
  caretShape: one("caretShape", keyword("auto", "bar", "block", "underscore")),
  caretAnimation: one("caretAnimation", keyword("auto", "manual")),
};
MEMBERS.textDecorationLine = MEMBERS.textDecoration!;

const member =
  (name: string, build: (prop: string, parts: unknown[]) => Entry[]) =>
  (...parts: unknown[]): TuiNode => {
    if (parts.some(isTui)) throw fail(`cssints: ${name}: a style is not a value`);
    return node(build(name, parts));
  };

const stylesOf = (what: string, styles: unknown[]): Entry[] => {
  const bad = styles.find((s) => !isTui(s));
  if (bad !== undefined || !styles.length)
    throw fail(
      `cssints: ${what} takes styles of cssints/tui, got ${bad === undefined ? "nothing" : say(bad)}`,
    );
  return (styles as TuiNode[]).flatMap((s) => s.__tui);
};

/**
 * Merges styles in argument order: a later prop wins.
 *
 * @returns {TuiNode} the merged style
 */
export const cn = (...styles: unknown[]): TuiNode => node(stylesOf("cn()", styles));

const state =
  (s: Exclude<State, "">) =>
  (...styles: unknown[]): TuiNode =>
    node(
      stylesOf(s, styles).map(([k, v, inner, c]): Entry => {
        if (inner)
          throw fail(
            `cssints: ${s} wraps ${inner}: terminal states do not nest (one state per style)`,
          );
        return c ? [k, v, s, c] : [k, v, s];
      }),
    );
export const hover = state(":hover");
export const focus = state(":focus");
export const active = state(":active");

const members = Object.fromEntries(Object.entries(MEMBERS).map(([k, b]) => [k, member(k, b)]));
export const {
  color,
  backgroundColor,
  bg,
  borderColor,
  caretColor,
  fontWeight,
  fontStyle,
  textDecoration,
  textDecorationLine,
  textAlign,
  borderStyle,
  border,
  padding,
  p,
  paddingInline,
  paddingBlock,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  pt,
  pr,
  pb,
  pl,
  margin,
  m,
  marginInline,
  marginBlock,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  mt,
  mr,
  mb,
  ml,
  top,
  right,
  bottom,
  left,
  gap,
  rowGap,
  columnGap,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  flexBasis,
  flexDirection,
  flexWrap,
  justifyContent,
  alignItems,
  alignSelf,
  flexGrow,
  flexShrink,
  position,
  overflow,
  display,
  opacity,
  zIndex,
  cursor,
  caretShape,
  caretAnimation,
} = members;

// ---------- the site

type Props = Record<string, Value | Record<string, Value>>;
const put = (out: Props, state: State, key: string, value: Value) => {
  if (!state) out[key] = value;
  else ((out[state] ??= {}) as Record<string, Value>)[key] = value;
};

// The colour of an entry where `values` (a theme's) sets some tokens: each var() resolved, then read as hex.
const resolved = (text: string, values?: Map<string, string>): string => {
  const flat = text.replace(VAR, (m, n: string) => valueOf(registry, n, values) ?? m);
  const hex = hexOf(flat);
  if (hex === undefined)
    throw fail(`cssints: ${say(text)} is ${say(flat)} here, not a colour a terminal can show`);
  return hex;
};

// The object literal of a site: the props (the later entry of a key wins), its state overlays, and per theme (a theme
// of a selector, by its name; one of a media query has no meaning here) what it changes.
const replacement = (n: TuiNode): string => {
  const out: Props = {};
  for (const [k, v, s, c] of n.__tui) put(out, s, k, c ? resolved(String(v)) : v);
  const tokens = n.__tui.filter((e) => e[3] && String(e[1]).includes("var("));
  if (tokens.length) {
    const themes: Record<string, Props> = {};
    for (const { label, values } of together(registry)) {
      if (label.startsWith("@")) continue;
      const overlay: Props = {};
      for (const [k, v, s] of tokens) {
        const was = s ? (out[s] as Record<string, Value>)[k] : out[k];
        const now = resolved(String(v), values);
        if (now !== was) put(overlay, s, k, now);
      }
      if (Object.keys(overlay).length) themes[label] = overlay;
    }
    if (Object.keys(themes).length) out.themes = themes as unknown as Record<string, Value>;
  }
  return `(${Formatter.formatJson(out)})`; // parenthesized: an arrow function may return it
};

registry.tui = (v) => (isTui(v) ? replacement(v) : undefined);
