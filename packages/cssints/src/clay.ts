// cssints/clay: the css.* members of a Clay layout (https://github.com/nicbarker/clay), for a native UI with no browser
// (the clay-test firmware of an ESP32-S3, a desktop renderer). Each builds a node of entries, `{ __clay }`, and the engine
// (macro.ts `replacementOf`, through `registry.clay`) replaces a site that holds one by an object literal shaped as Clay's
// own structs: `Clay_ElementDeclaration` and, under `text`, `Clay_TextElementConfig`. `header()` prints those literals
// as C initializers for a firmware that runs no JS. Plain code like tui.ts: user code calls the builders in expressions.
import { clampRgb, formatHex } from "culori/fn";
import { Formatter } from "effect";

import { parseColor } from "./color.ts";
import { fail } from "./node.ts";
import { registry } from "./registry.ts";

type Value = string | number;
interface ClayNode {
  __clay: [key: string, value: Value][];
}
const isClay = (v: unknown): v is ClayNode =>
  !!v && typeof v === "object" && Array.isArray((v as ClayNode).__clay);
const say = (v: unknown) => (typeof v === "string" ? `"${v}"` : Formatter.formatJson(v));

// ---------- values

const PX = /^(\d+\.?\d*|\.\d+)(px)?$/;
const PERCENT = /^(\d+\.?\d*|\.\d+)%$/;
const px = (prop: string, v: unknown): number => {
  const m = typeof v === "string" ? PX.exec(v) : null;
  const n = typeof v === "number" ? v : m ? Number(m[1]) : NaN;
  if (Number.isFinite(n) && n >= 0) return n;
  throw fail(
    `cssints: ${prop}: unexpected ${say(v)}, expected a number of pixels (a number or "Npx", not negative)`,
  );
};
// padding, gap and border widths are uint16_t in Clay
const whole = (prop: string, v: unknown): number => {
  const n = px(prop, v);
  if (Number.isInteger(n) && n <= 65535) return n;
  throw fail(
    `cssints: ${prop}: ${say(v)} is not a whole number of pixels (Clay stores it as uint16_t)`,
  );
};
const size = (prop: string, v: unknown): Value => {
  if (v === "auto" || v === "stretch") return v;
  if (typeof v === "string" && PERCENT.test(v)) return v;
  return px(prop, v);
};
const keyword =
  (...words: string[]) =>
  (prop: string, v: unknown): Value => {
    if (typeof v === "string" && words.includes(v)) return v;
    throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected ${words.join(" | ")}`);
  };
// A colour as `r g b a`, 0-255 each (Clay_Color is four floats, 0-255 by convention).
const colour = (prop: string, v: unknown): Value => {
  const c = typeof v === "string" && !v.includes("var(") ? parseColor(v) : undefined;
  if (!c)
    throw fail(
      `cssints: ${prop}: ${say(v)} is not a colour Clay can draw (a name, hex, rgb(), hsl(), oklch(); not a token, currentColor or light-dark())`,
    );
  // through hex: clampRgb keeps the colour's own mode, formatHex converts it to sRGB
  const hex = formatHex(clampRgb(c));
  const rgb = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return [...rgb, Math.round((c.alpha ?? 1) * 255)].join(" ");
};

// ---------- members

type Build = (prop: string, parts: unknown[]) => [string, Value][];
const one =
  (key: string, read: (prop: string, v: unknown) => Value): Build =>
  (prop, parts) => {
    if (parts.length !== 1) throw fail(`cssints: ${prop} takes one value, got ${parts.length}`);
    return [[key, read(prop, parts[0])]];
  };
// 1 to 4 values in CSS order, spread over `keys`
const sides =
  (keys: readonly string[], read: (prop: string, v: unknown) => Value): Build =>
  (prop, parts) => {
    if (parts.length < 1 || parts.length > 4)
      throw fail(`cssints: ${prop} takes 1 to 4 values, got ${parts.length}`);
    const v = parts.map((p) => read(prop, p));
    const at = [v[0]!, v[1] ?? v[0]!, v[2] ?? v[0]!, v[3] ?? v[1] ?? v[0]!];
    return keys.map((k, i) => [k, at[i]!]);
  };
// 1 or 2 values: the start and end of the inline or block axis
const pair =
  (start: string, end: string): Build =>
  (prop, parts) => {
    if (parts.length < 1 || parts.length > 2)
      throw fail(`cssints: ${prop} takes 1 or 2 values, got ${parts.length}`);
    const v = parts.map((x) => whole(prop, x));
    return [
      [start, v[0]!],
      [end, v[1] ?? v[0]!],
    ];
  };
const PADDING = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];
const BORDER = ["borderTop", "borderRight", "borderBottom", "borderLeft"];
const RADIUS = ["topLeft", "topRight", "bottomRight", "bottomLeft"];
const ALIGN = ["flex-start", "start", "center", "flex-end", "end"];

const MEMBERS: Record<string, Build> = {
  backgroundColor: one("backgroundColor", colour),
  bg: one("backgroundColor", colour),
  color: one("color", colour),
  borderColor: one("borderColor", colour),
  width: one("width", size),
  height: one("height", size),
  padding: sides(PADDING, whole),
  p: sides(PADDING, whole),
  paddingInline: pair("paddingLeft", "paddingRight"),
  paddingBlock: pair("paddingTop", "paddingBottom"),
  ...Object.fromEntries(
    (["Top", "Right", "Bottom", "Left"] as const).flatMap((s) => [
      [`padding${s}`, one(`padding${s}`, whole)],
      [`p${s[0]!.toLowerCase()}`, one(`padding${s}`, whole)],
    ]),
  ),
  gap: one("gap", whole),
  flexDirection: one("flexDirection", keyword("row", "column")),
  justifyContent: one("justifyContent", keyword(...ALIGN)),
  alignItems: one("alignItems", keyword(...ALIGN)),
  borderRadius: sides(RADIUS, px),
  borderWidth: sides(BORDER, whole),
  border: (prop, parts) => {
    if (parts.length !== 2)
      throw fail(`cssints: ${prop} takes a width and a colour, got ${parts.length} values`);
    const w = whole(prop, parts[0]);
    return [...BORDER.map((k): [string, Value] => [k, w]), ["borderColor", colour(prop, parts[1])]];
  },
  overflow: one("overflow", keyword("visible", "hidden")),
  fontSize: one("fontSize", whole),
  letterSpacing: one("letterSpacing", whole),
  lineHeight: one("lineHeight", whole),
  textAlign: one("textAlign", keyword("left", "center", "right")),
  whiteSpace: one("whiteSpace", keyword("normal", "pre-line", "nowrap")),
};

const member =
  (name: string, build: Build) =>
  (...parts: unknown[]): ClayNode => {
    if (parts.some(isClay)) throw fail(`cssints: ${name}: a style is not a value`);
    return { __clay: build(name, parts) };
  };

/**
 * Merges styles in argument order: a later prop wins.
 *
 * @returns {ClayNode} the merged style
 */
export const cn = (...styles: unknown[]): ClayNode => {
  const bad = styles.find((s) => !isClay(s));
  if (bad !== undefined || !styles.length)
    throw fail(
      `cssints: cn() takes styles of cssints/clay, got ${bad === undefined ? "nothing" : say(bad)}`,
    );
  return { __clay: (styles as ClayNode[]).flatMap((s) => s.__clay) };
};

const members = Object.fromEntries(Object.entries(MEMBERS).map(([k, b]) => [k, member(k, b)]));
export const {
  backgroundColor,
  bg,
  color,
  borderColor,
  width,
  height,
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
  gap,
  flexDirection,
  justifyContent,
  alignItems,
  borderRadius,
  borderWidth,
  border,
  overflow,
  fontSize,
  letterSpacing,
  lineHeight,
  textAlign,
  whiteSpace,
} = members;

// ---------- the site: Clay's structs, field for field

type Shape = { [k: string]: number | string | Shape };
const rgba = (v: Value): Shape => {
  const [r, g, b, a] = String(v).split(" ").map(Number);
  return { r: r!, g: g!, b: b!, a: a! };
};
const axis = (v: Value): Shape =>
  v === "auto"
    ? { type: "FIT" }
    : v === "stretch"
      ? { type: "GROW" }
      : typeof v === "string"
        ? { type: "PERCENT", percent: Number.parseFloat(v) / 100 }
        : { type: "FIXED", min: v, max: v };
// flex-start on the main axis is Clay's left (a row) or top (a column), and so on
const X = { start: "LEFT", center: "CENTER", end: "RIGHT" } as const;
const Y = { start: "TOP", center: "CENTER", end: "BOTTOM" } as const;
const edge = (v: Value) =>
  v === "center" ? "center" : String(v).endsWith("end") ? "end" : "start";

const shapeOf = (n: ClayNode): Shape => {
  const p = new Map(n.__clay);
  const out: Shape = {};
  const layout: Shape = {};
  const get = (k: string) => p.get(k);
  if (get("width") !== undefined || get("height") !== undefined)
    layout.sizing = {
      ...(get("width") !== undefined && { width: axis(get("width")!) }),
      ...(get("height") !== undefined && { height: axis(get("height")!) }),
    };
  if (PADDING.some((k) => p.has(k)))
    layout.padding = {
      left: get("paddingLeft") ?? 0,
      right: get("paddingRight") ?? 0,
      top: get("paddingTop") ?? 0,
      bottom: get("paddingBottom") ?? 0,
    };
  if (p.has("gap")) layout.childGap = get("gap")!;
  const column = get("flexDirection") === "column";
  if (column) layout.layoutDirection = "TOP_TO_BOTTOM";
  const main = get("justifyContent"),
    cross = get("alignItems");
  if (main !== undefined || cross !== undefined) {
    const [x, y] = column ? [cross, main] : [main, cross];
    layout.childAlignment = {
      ...(x !== undefined && { x: X[edge(x)] }),
      ...(y !== undefined && { y: Y[edge(y)] }),
    };
  }
  if (Object.keys(layout).length) out.layout = layout;
  if (p.has("backgroundColor")) out.backgroundColor = rgba(get("backgroundColor")!);
  if (RADIUS.some((k) => p.has(k)))
    out.cornerRadius = Object.fromEntries(RADIUS.map((k) => [k, get(k) ?? 0]));
  if (BORDER.some((k) => p.has(k)) || p.has("borderColor"))
    out.border = {
      ...(p.has("borderColor") && { color: rgba(get("borderColor")!) }),
      width: {
        left: get("borderLeft") ?? 0,
        right: get("borderRight") ?? 0,
        top: get("borderTop") ?? 0,
        bottom: get("borderBottom") ?? 0,
      },
    };
  if (get("overflow") === "hidden") out.clip = { horizontal: 1, vertical: 1 };
  const text: Shape = {};
  if (p.has("color")) text.textColor = rgba(get("color")!);
  for (const k of ["fontSize", "letterSpacing", "lineHeight"]) if (p.has(k)) text[k] = get(k)!;
  if (p.has("textAlign")) text.textAlignment = String(get("textAlign")).toUpperCase();
  const wrap = get("whiteSpace");
  if (wrap !== undefined)
    text.wrapMode = wrap === "nowrap" ? "NONE" : wrap === "pre-line" ? "NEWLINES" : "WORDS";
  if (Object.keys(text).length) out.text = text;
  return out;
};

registry.clay = (v) => (isClay(v) ? `(${Formatter.formatJson(shapeOf(v))})` : undefined);

// ---------- C

const ENUM: Record<string, (v: string) => string> = {
  type: (v) => `CLAY__SIZING_TYPE_${v}`,
  layoutDirection: (v) => `CLAY_${v}`,
  x: (v) => `CLAY_ALIGN_X_${v}`,
  y: (v) => `CLAY_ALIGN_Y_${v}`,
  textAlignment: (v) => `CLAY_TEXT_ALIGN_${v}`,
  wrapMode: (v) => `CLAY_TEXT_WRAP_${v}`,
};
const c = (key: string, v: number | string | Shape): string => {
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return ENUM[key]!(v);
  // a sizing axis: Clay's union, as CLAY_SIZING_FIXED() and its kin write it
  if (v.type !== undefined) {
    const size =
      v.percent !== undefined
        ? `.percent = ${c("", v.percent)}`
        : `.minMax = { ${c("", v.min ?? 0)}, ${c("", v.max ?? 0)} }`;
    return `{ .size = { ${size} }, .type = ${c("type", v.type)} }`;
  }
  return `{ ${Object.entries(v)
    .map(([k, x]) => `.${k} = ${c(k, x)}`)
    .join(", ")} }`;
};

/**
 * The styles of a module as C: a `Clay_ElementDeclaration` per export, and a `Clay_TextElementConfig` named
 * `<name>_text` for one that sets text props, for `CLAY(id, name)` and `CLAY_TEXT(s, name_text)`.
 *
 * @param {Record<string, unknown>} styles the exports of a built module of cssints/clay styles
 * @returns {string} a C header that includes clay.h
 */
export const header = (styles: Record<string, unknown>): string => {
  const lines = [
    "// Generated by cssints/clay. Do not edit.",
    "#pragma once",
    "",
    '#include "clay.h"',
    "",
  ];
  for (const [name, v] of Object.entries(styles)) {
    if (!v || typeof v !== "object") continue;
    const { text, ...decl } = v as Shape;
    if (Object.keys(decl).length)
      lines.push(`static const Clay_ElementDeclaration ${name} = ${c("", decl)};`);
    if (text) lines.push(`static const Clay_TextElementConfig ${name}_text = ${c("", text)};`);
  }
  return `${lines.join("\n")}\n`;
};
