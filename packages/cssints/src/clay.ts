// cssints/clay: the css.* members of a Clay layout (https://github.com/nicbarker/clay), for a native UI with no browser
// (the clay-test firmware of an ESP32-S3, a desktop renderer). Each builds a node of entries, `{ __clay }`, and the engine
// (macro.ts `replacementOf`, through `registry.clay`) replaces a site that holds one by an object literal shaped as Clay's
// own structs: `Clay_ElementDeclaration` and, under `text`, `Clay_TextElementConfig`. `header()` prints those literals
// as C initializers for a firmware that runs no JS. Plain code like tui.ts: user code calls the builders in expressions.
// Clay has no states and no themes: a state is an overlay of the literal (`":hover"`), a theme the colours it changes
// (`themes`), and header() prints each as a whole declaration of its own, so C picks one and merges nothing.
import { clampRgb, formatHex } from "culori/fn";
import { Formatter, Predicate } from "effect";

import { parseColor } from "./color.ts";
import { together, valueOf } from "./contrast.ts";
import { fail } from "./node.ts";
import { registry, type RegistryState } from "./registry.ts";
import { createGlobalTheme as webTheme, createTokens as webTokens, sets } from "./theme.ts";

// The tokens and themes of Clay: the web's createTokens and createGlobalTheme on tables of their own, as cssints/tui's.
const tables: NonNullable<RegistryState["clayTokens"]> = (registry.clayTokens ??= {
  properties: new Map(),
  defs: new Map(),
  themed: new Map(),
});
const inClay =
  <R>(f: (...args: unknown[]) => R) =>
  (...args: unknown[]): R => {
    const web = { properties: registry.properties, defs: registry.defs, themed: registry.themed };
    Object.assign(registry, tables);
    try {
      return f(...args);
    } finally {
      Object.assign(registry, web);
    }
  };
export const createTokens = inClay((...args) => {
  const root = webTokens(...args);
  sets.get(root as object)!.clay = true;
  return root;
});
const IDENT = /^[A-Za-z]\w*$/;
// A theme is named, not selected: the name ends the C names of its declarations (`units_light`).
export const createGlobalTheme = inClay((...args) => {
  if (args.length !== 3 || typeof args[1] !== "string" || !IDENT.test(args[1]))
    throw fail(
      `cssints: createGlobalTheme(tokens, name, overrides) of cssints/clay takes its tokens, a name that is a C identifier (header() names a themed declaration <style>_<name>) and the values to set, got the name ${say(args[1])}`,
    );
  return webTheme(...args);
});

type Value = string | number;
type State = "" | ":hover" | ":focus" | ":active";
const STATES = [":hover", ":focus", ":active"] as const;
type Entry = [key: string, value: Value, state: State];
interface ClayNode {
  __clay: Entry[];
}
const isClay = (v: unknown): v is ClayNode =>
  !!v && typeof v === "object" && Array.isArray((v as ClayNode).__clay) && !("__fonts" in v);
const node = (entries: Entry[]): ClayNode => ({ __clay: entries });
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
// A colour is kept as its text, tokens and all, and resolved at the site per theme (`rgba`); here it is only checked.
const VAR = /var\((--[\w-]+)\)/g;
const NOT_A_COLOUR =
  "is not a colour Clay can draw (a name, hex, rgb(), hsl(), oklch() or a colour token of the createTokens of cssints/clay; not currentColor or light-dark())";
// a token is a CSSTokenValue at build time, `var(--name)` as text
const colour = (prop: string, u: unknown): Value => {
  // oxlint-disable-next-line typescript/no-base-to-string -- a token's toString is its var()
  const v = String(u);
  for (const [, name] of v.matchAll(VAR)) {
    const def = tables.defs.get(name!);
    if (!def)
      throw fail(`cssints: ${prop}: ${name} is no token of the createTokens of cssints/clay`);
    if (def.kind !== "color" && v === `var(${name})`)
      throw fail(`cssints: ${prop}: ${def.path} is a ${def.kind} token, not a colour`);
  }
  if (!v.includes("var(")) rgba(prop, v);
  return v;
};

// ---------- members

type Build = (prop: string, parts: unknown[]) => [string, Value][];
const one =
  (key: string, read: (prop: string, v: unknown) => Value): Build =>
  (prop, parts) => {
    if (parts.length !== 1) throw fail(`cssints: ${prop} takes one value, got ${parts.length}`);
    return [[key, read(prop, parts[0])]];
  };
const COLOURS = new Set(["backgroundColor", "color", "borderColor", "shadowColor"]);
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
// A floating element (Clay_FloatingElementConfig): one object of options, each entry a flat key like the other members'
const POINTS = ["left", "center", "right"].flatMap((x) =>
  ["top", "center", "bottom"].map((y) => `${x} ${y}`),
);
const FLOAT_OPTIONS = ["attach", "parent", "root", "offset", "expand", "zIndex", "capture", "clip"];
const SIGNED = /^-?(?:\d+\.?\d*|\.\d+)(?:px)?$/;
const offset = (prop: string, v: unknown): number => {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string" && SIGNED.test(v)
        ? Number.parseFloat(v)
        : NaN;
  if (Number.isFinite(n)) return n;
  throw fail(
    `cssints: ${prop}: unexpected ${say(v)}, expected a number of pixels (a number or "Npx")`,
  );
};
// Clay__HashString(id, 0).id: a static initializer needs a constant, and CLAY_ID() is a call
const clayId = (id: string): number => {
  const h = Array.from(id, (ch) => ch.charCodeAt(0)).reduce((acc, byte) => {
    const sum = (acc + byte) >>> 0;
    const mixed = (sum + (sum << 10)) >>> 0;
    return (mixed ^ (mixed >>> 6)) >>> 0;
  }, 0);
  const a = (h + (h << 3)) >>> 0;
  const b = (a ^ (a >>> 11)) >>> 0;
  return (b + (b << 15) + 1) >>> 0;
};
const options = (prop: string, v: unknown, keys: string[]): Record<string, unknown> => {
  if (typeof v !== "object" || v === null || Array.isArray(v))
    throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected { ${keys.join(", ")} }`);
  const bad = Object.keys(v).find((k) => !keys.includes(k));
  if (bad !== undefined)
    throw fail(`cssints: ${prop}: unexpected ${say(bad)}, expected ${keys.join(" | ")}`);
  return v as Record<string, unknown>;
};
const upper = (v: Value) => String(v).toUpperCase().replace(" ", "_");
const floating: Build = (prop, parts) => {
  if (parts.length > 1)
    throw fail(`cssints: ${prop} takes one object of options, got ${parts.length} values`);
  const o = options(prop, parts[0] ?? {}, FLOAT_OPTIONS);
  // `float` only says the element floats: attachTo is an entry only when a parent or root is named, so that a cn() of
  // two floats does not reset the first one's
  const out: [string, Value][] = [["float", 1]];
  const set = (k: string, v: Value) => out.push([k, v]);
  if (o.parent !== undefined && o.root)
    throw fail(`cssints: ${prop}: parent and root are two places to attach to`);
  if (o.parent !== undefined) {
    // chars are signed on some targets and unsigned on others, so only ASCII hashes the same everywhere
    if (typeof o.parent !== "string" || !/^[\x20-\x7e]+$/.test(o.parent))
      throw fail(
        `cssints: ${prop}.parent: unexpected ${say(o.parent)}, expected the non-empty ASCII string of the parent's CLAY_ID()`,
      );
    set("floatTo", "ELEMENT_WITH_ID");
    set("floatParentId", clayId(o.parent));
  }
  if (o.root !== undefined && typeof o.root !== "boolean")
    throw fail(`cssints: ${prop}.root: unexpected ${say(o.root)}, expected true | false`);
  if (o.root) set("floatTo", "ROOT");
  if (o.attach !== undefined) {
    const a = options(`${prop}.attach`, o.attach, ["element", "parent"]);
    for (const k of ["element", "parent"])
      if (a[k] !== undefined)
        set(
          `float${k === "element" ? "Element" : "Parent"}`,
          upper(keyword(...POINTS)(`${prop}.attach.${k}`, a[k])),
        );
  }
  for (const [name, read] of [
    ["offset", offset],
    ["expand", px],
  ] as const) {
    if (o[name] === undefined) continue;
    const keys = name === "offset" ? ["x", "y"] : ["width", "height"];
    const v = options(`${prop}.${name}`, o[name], keys);
    for (const k of keys)
      if (v[k] !== undefined)
        set(
          `float${name === "offset" ? "Offset" : "Expand"}${k[0]!.toUpperCase()}${k.slice(1)}`,
          read(`${prop}.${name}.${k}`, v[k]),
        );
  }
  if (o.zIndex !== undefined) {
    if (!Number.isInteger(o.zIndex) || Math.abs(o.zIndex as number) > 32767)
      throw fail(
        `cssints: ${prop}.zIndex: unexpected ${say(o.zIndex)}, expected a whole number (Clay stores it as int16_t)`,
      );
    set("floatZIndex", o.zIndex as number);
  }
  if (o.capture !== undefined) {
    if (typeof o.capture !== "boolean")
      throw fail(`cssints: ${prop}.capture: unexpected ${say(o.capture)}, expected true | false`);
    set("floatCapture", o.capture ? "CAPTURE" : "PASSTHROUGH");
  }
  if (o.clip !== undefined)
    set(
      "floatClip",
      keyword("none", "parent")(`${prop}.clip`, o.clip) === "none" ? "NONE" : "ATTACHED_PARENT",
    );
  return out;
};

// An image (Clay_ImageElementConfig): Clay 1.0's config is a single `void *imageData`, which it passes through to the
// renderer untouched, so the path of the image travels there; older Clay also carried its sourceDimensions, and 1.0
// sizes the box instead (and an aspectRatio, which is where `fit` goes).
const IMAGE_OPTIONS = ["width", "height", "fit"];
const imageOf: Build = (prop, parts) => {
  if (parts.length < 1 || parts.length > 2)
    throw fail(
      `cssints: ${prop} takes the path of an image and its { width, height, fit }, got ${parts.length} values`,
    );
  const src = parts[0];
  if (typeof src !== "string" || !src || /\p{Cc}/u.test(src))
    throw fail(
      `cssints: ${prop}: unexpected ${say(src)}, expected the path of an image (a string, not empty, no control characters)`,
    );
  const o = options(prop, parts[1] ?? {}, IMAGE_OPTIONS);
  if (o.width === undefined || o.height === undefined)
    throw fail(
      `cssints: ${prop}: unexpected ${say(parts[1] ?? {})}, expected the image's width and height in pixels`,
    );
  const w = whole(`${prop}.width`, o.width);
  const h = whole(`${prop}.height`, o.height);
  if (!w || !h)
    throw fail(
      `cssints: ${prop}: unexpected ${say(w)}x${say(h)}, expected a positive whole number of pixels for each side`,
    );
  // the box starts at the image's own size, as sourceDimensions did; `contain` also sets Clay's aspectRatio, so a box
  // another style grows keeps the image's proportions and a renderer that fills it does not distort it. `fill` says 0,
  // which is Clay's own "no ratio": a later image in a cn() clears an earlier one's ratio.
  return [
    ["imageSrc", src],
    ["width", w],
    ["height", h],
    ["aspectRatio", keyword("fill", "contain")(`${prop}.fit`, o.fit ?? "fill") === "contain" ? w / h : 0],
  ];
};

// A shadow (css.shadow): Clay 1.0's declaration has no shadow field, so it travels beside the declaration as an image's
// path does — a sibling `shadow` key of the literal, which header() drops (the renderer owns the effect, keyed by the
// element's id) and whose fields a state's overlay merges one by one.
const SHADOW_OPTIONS = ["x", "y", "blur", "color"];
const SHADOW_FIELDS = ["shadowX", "shadowY", "shadowBlur", "shadowColor"];
const SHADOW_COLOUR = "rgb(0 0 0 / 0.4)";
const SHADOW_DEFAULT = { x: 0, y: 2, blur: 12, color: SHADOW_COLOUR };
const shadowOf: Build = (prop, parts) => {
  if (parts.length > 1)
    throw fail(`cssints: ${prop} takes one object of options, got ${parts.length} values`);
  const o = options(prop, parts[0] ?? {}, SHADOW_OPTIONS);
  // no options is the whole default shadow; some set only the fields they name, so a state's
  // css.hover(css.shadow({ blur: 20 })) keeps the base's x, y and colour
  const given = Object.keys(o).length ? o : SHADOW_DEFAULT;
  const out: [string, Value][] = [];
  if (given.x !== undefined) out.push(["shadowX", offset(`${prop}.x`, given.x)]);
  if (given.y !== undefined) out.push(["shadowY", offset(`${prop}.y`, given.y)]);
  if (given.blur !== undefined) out.push(["shadowBlur", px(`${prop}.blur`, given.blur)]);
  if (given.color !== undefined) out.push(["shadowColor", colour(`${prop}.color`, given.color)]);
  return out;
};

// A backdrop (css.backdrop): the pixels under the element, blurred before its own commands, so a translucent panel is
// glass over the content behind it. As a shadow, no Clay field holds one: a sibling `backdrop` key of the literal, which
// header() drops and the renderer reads by the element's id.
const BACKDROP_OPTIONS = ["blur"];
const BACKDROP_DEFAULT = 12;
const backdropOf: Build = (prop, parts) => {
  if (parts.length > 1)
    throw fail(`cssints: ${prop} takes one object of options, got ${parts.length} values`);
  const o = options(prop, parts[0] ?? {}, BACKDROP_OPTIONS);
  // the only field: an empty object is the default, as a bare call is
  return [["backdropBlur", px(`${prop}.blur`, o.blur ?? BACKDROP_DEFAULT)]];
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
  float: floating,
  image: imageOf,
  shadow: shadowOf,
  backdrop: backdropOf,
};

const member =
  (name: string, build: Build) =>
  (...parts: unknown[]): ClayNode => {
    if (parts.some(isClay)) throw fail(`cssints: ${name}: a style is not a value`);
    return node(build(name, parts).map(([k, v]): Entry => [k, v, ""]));
  };

const stylesOf = (what: string, styles: unknown[]): Entry[] => {
  const bad = styles.find((s) => !isClay(s));
  if (bad !== undefined || !styles.length)
    throw fail(
      `cssints: ${what} takes styles of cssints/clay, got ${bad === undefined ? "nothing" : say(bad)}`,
    );
  return (styles as ClayNode[]).flatMap((s) => s.__clay);
};

/**
 * Merges styles in argument order: a later prop wins.
 *
 * @returns {ClayNode} the merged style
 */
export const cn = (...styles: unknown[]): ClayNode => node(stylesOf("cn()", styles));

// Clay has no states: the page asks Clay_PointerOver() and the pointer, and picks `<name>_hover` or `<name>_active`.
const state =
  (s: Exclude<State, "">) =>
  (...styles: unknown[]): ClayNode =>
    node(
      stylesOf(s, styles).map(([k, v, inner]): Entry => {
        if (inner)
          throw fail(`cssints: ${s} wraps ${inner}: Clay states do not nest (one state per style)`);
        return [k, v, s];
      }),
    );
export const hover = state(":hover");
export const focus = state(":focus");
export const active = state(":active");

/**
 * The fonts of the app, in the order of its font array: `fonts("Roboto", "Mono").Mono` is a style that sets Clay's
 * `fontId` to 1, and header() prints the order as an enum, `<name>_Mono`.
 *
 * @returns {Record<string, unknown>} a style per font, by name, and the list
 */
export const fonts = (...names: unknown[]): Record<string, unknown> => {
  const bad = names.find((n) => typeof n !== "string" || !IDENT.test(n));
  if (bad !== undefined || !names.length)
    throw fail(
      `cssints: fonts() takes the names of the app's fonts in order, each a C identifier, got ${bad === undefined ? "nothing" : say(bad)}`,
    );
  const twice = names.find((n, i) => names.indexOf(n) !== i);
  if (twice !== undefined) throw fail(`cssints: fonts(): ${say(twice)} is there twice`);
  return {
    __clay: [],
    __fonts: names,
    ...Object.fromEntries(
      names.map((n, i): [string, ClayNode] => [String(n), node([["fontId", i, ""]])]),
    ),
  };
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
  float,
  image,
  shadow,
  backdrop,
} = members;

// ---------- the site: Clay's structs, field for field

type Shape = { [k: string]: number | string | Shape };
// Clay_Color: four floats, 0-255 by convention; each var() of the text resolved with the values of a theme
const rgba = (prop: string, text: string, values?: Map<string, string>): Shape => {
  const flat = text.replace(VAR, (m, n: string) => valueOf(tables, n, values) ?? m);
  const c = flat.includes("var(") ? undefined : parseColor(flat);
  if (!c)
    throw fail(
      `cssints: ${prop}: ${say(text)}${flat === text ? "" : ` (${say(flat)} here)`} ${NOT_A_COLOUR}`,
    );
  // through hex: clampRgb keeps the colour's own mode, formatHex converts it to sRGB
  const hex = formatHex(clampRgb(c));
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return { r: r!, g: g!, b: b!, a: Math.round((c.alpha ?? 1) * 255) };
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

const FLOATING = [
  "float",
  "floatTo",
  "floatElement",
  "floatParent",
  "floatParentId",
  "floatOffsetX",
  "floatOffsetY",
  "floatExpandWidth",
  "floatExpandHeight",
  "floatZIndex",
  "floatCapture",
  "floatClip",
];
// Clay_FloatingElementConfig in the order of the struct; a float that names no parent is attached to its own
const floatingOf = (p: Map<string, Value>): Shape => {
  const has = (...ks: string[]) => ks.some((k) => p.has(k));
  const to = p.get("floatTo") ?? "PARENT";
  if (to === "ROOT" && p.get("floatClip") === "ATTACHED_PARENT")
    throw fail(
      `cssints: float: clip "parent" does nothing on a float attached to the root (it has no clipping parent)`,
    );
  return {
    ...(has("floatOffsetX", "floatOffsetY") && {
      offset: { x: p.get("floatOffsetX") ?? 0, y: p.get("floatOffsetY") ?? 0 },
    }),
    ...(has("floatExpandWidth", "floatExpandHeight") && {
      expand: { width: p.get("floatExpandWidth") ?? 0, height: p.get("floatExpandHeight") ?? 0 },
    }),
    ...(to === "ELEMENT_WITH_ID" && { parentId: p.get("floatParentId")! }),
    ...(p.has("floatZIndex") && { zIndex: p.get("floatZIndex")! }),
    ...(has("floatElement", "floatParent") && {
      attachPoints: {
        element: p.get("floatElement") ?? "LEFT_TOP",
        parent: p.get("floatParent") ?? "LEFT_TOP",
      },
    }),
    ...(p.has("floatCapture") && { pointerCaptureMode: p.get("floatCapture")! }),
    attachTo: to,
    ...(p.has("floatClip") && { clipTo: p.get("floatClip")! }),
  };
};

const shapeOf = (entries: Entry[], values?: Map<string, string>): Shape => {
  const p = new Map(entries.map(([k, v]): [string, Value] => [k, v]));
  const colourOf = (k: string) => rgba(k, String(p.get(k)), values);
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
  if (p.has("flexDirection")) layout.layoutDirection = column ? "TOP_TO_BOTTOM" : "LEFT_TO_RIGHT";
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
  if (p.has("backgroundColor")) out.backgroundColor = colourOf("backgroundColor");
  if (RADIUS.some((k) => p.has(k)))
    out.cornerRadius = Object.fromEntries(RADIUS.map((k) => [k, get(k) ?? 0]));
  if (BORDER.some((k) => p.has(k)) || p.has("borderColor"))
    out.border = {
      ...(p.has("borderColor") && { color: colourOf("borderColor") }),
      width: {
        left: get("borderLeft") ?? 0,
        right: get("borderRight") ?? 0,
        top: get("borderTop") ?? 0,
        bottom: get("borderBottom") ?? 0,
      },
    };
  if (p.has("overflow")) out.clip = get("overflow") === "hidden" ? HIDDEN : VISIBLE;
  if (FLOATING.some((k) => p.has(k))) out.floating = floatingOf(p);
  if (p.has("imageSrc")) out.image = { imageData: get("imageSrc")! };
  if (p.get("aspectRatio")) out.aspectRatio = { aspectRatio: get("aspectRatio")! };
  // a shadow has no Clay field: its own key of the literal, for the renderer; unset fields take CSS's defaults
  if (SHADOW_FIELDS.some((k) => p.has(k)))
    out.shadow = {
      x: get("shadowX") ?? SHADOW_DEFAULT.x,
      y: get("shadowY") ?? SHADOW_DEFAULT.y,
      blur: get("shadowBlur") ?? SHADOW_DEFAULT.blur,
      color: rgba("shadow.color", String(get("shadowColor") ?? SHADOW_COLOUR), values),
    };
  // a backdrop has no Clay field either: its own key, for the renderer, one blur
  if (p.has("backdropBlur")) out.backdrop = { blur: get("backdropBlur")! };
  const text: Shape = {};
  if (p.has("color")) text.textColor = colourOf("color");
  for (const k of ["fontId", "fontSize", "letterSpacing", "lineHeight"])
    if (p.has(k)) text[k] = get(k)!;
  if (p.has("textAlign")) text.textAlignment = String(get("textAlign")).toUpperCase();
  const wrap = get("whiteSpace");
  if (wrap !== undefined)
    text.wrapMode = wrap === "nowrap" ? "NONE" : wrap === "pre-line" ? "NEWLINES" : "WORDS";
  if (Object.keys(text).length) out.text = text;
  return out;
};

const HIDDEN = { horizontal: 1, vertical: 1 };
const VISIBLE = { horizontal: 0, vertical: 0 };

// A leaf of the literal: a number, a keyword, a colour or a sizing axis (replaced whole, never merged field by field).
const isLeaf = (v: unknown): boolean =>
  typeof v !== "object" || Object.hasOwn(v as object, "r") || Object.hasOwn(v as object, "type");
// The fields of `full` that `mask` has
const pick = (full: Shape, mask: Shape): Shape =>
  Object.fromEntries(
    Object.keys(mask).map((k) => [
      k,
      isLeaf(mask[k]) ? full[k]! : pick(full[k] as Shape, mask[k] as Shape),
    ]),
  );
// The fields of `a` that differ from `b` (both of one key set: a theme changes colours only)
const diff = (a: Shape, b: Shape): Shape => {
  const out: Shape = {};
  for (const [k, v] of Object.entries(a)) {
    if (isLeaf(v)) {
      if (Formatter.formatJson(v) !== Formatter.formatJson(b[k])) out[k] = v;
    } else {
      const d = diff(v as Shape, b[k] as Shape);
      if (Object.keys(d).length) out[k] = d;
    }
  }
  return out;
};
const merge = (a: Shape, b: Shape): Shape => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b))
    out[k] = isLeaf(v) || out[k] === undefined ? v : merge(out[k] as Shape, v as Shape);
  return out;
};

// The literal of a style under one theme's values: the base, and per state the fields the state sets, at the values
// they take over the base (the direction of the base read with them: justify-content is y in a column).
const literalOf = (n: ClayNode, values?: Map<string, string>): Shape => {
  const base = n.__clay.filter((e) => !e[2]);
  const out = shapeOf(base, values);
  for (const s of STATES) {
    const own = n.__clay.filter((e) => e[2] === s);
    if (!own.length) continue;
    const mask = shapeOf([...base.filter((e) => e[0] === "flexDirection"), ...own], values);
    const overlay = pick(shapeOf([...base, ...own], values), mask);
    const layout = overlay.layout as Shape | undefined;
    if (layout && !own.some((e) => e[0] === "flexDirection")) {
      delete layout.layoutDirection;
      if (!Object.keys(layout).length) delete overlay.layout;
    }
    out[s] = overlay;
  }
  return out;
};
// ... and what each theme changes of it, by name
const replacement = (n: ClayNode): Shape => {
  const out = literalOf(n);
  if (!n.__clay.some(([k, v]) => COLOURS.has(k) && String(v).includes("var("))) return out;
  const themes: Shape = {};
  for (const { label, values } of together({ themed: tables.themed, layers: registry.layers })) {
    const d = diff(literalOf(n, values), out);
    if (Object.keys(d).length) themes[label] = d;
  }
  if (Object.keys(themes).length) out.themes = themes;
  return out;
};

registry.clay = (v) => {
  if (Predicate.hasProperty(v, "__fonts")) return `(${Formatter.formatJson({ fonts: v.__fonts })})`;
  return isClay(v) ? `(${Formatter.formatJson(replacement(v))})` : undefined;
};

// ---------- C

const ENUM: Record<string, (v: string) => string> = {
  type: (v) => `CLAY__SIZING_TYPE_${v}`,
  layoutDirection: (v) => `CLAY_${v}`,
  x: (v) => `CLAY_ALIGN_X_${v}`,
  y: (v) => `CLAY_ALIGN_Y_${v}`,
  textAlignment: (v) => `CLAY_TEXT_ALIGN_${v}`,
  wrapMode: (v) => `CLAY_TEXT_WRAP_${v}`,
  element: (v) => `CLAY_ATTACH_POINT_${v}`,
  parent: (v) => `CLAY_ATTACH_POINT_${v}`,
  pointerCaptureMode: (v) => `CLAY_POINTER_CAPTURE_MODE_${v}`,
  attachTo: (v) => `CLAY_ATTACH_TO_${v}`,
  clipTo: (v) => `CLAY_CLIP_TO_${v}`,
};
// a C string literal: the path of an image, as imageData (a void *, the renderer's to read)
const cString = (s: string) => `"${s.replace(/[\\"]/g, "\\$&")}"`;
const c = (key: string, v: number | string | Shape): string => {
  // parentId is a uint32_t: a hash over INT_MAX needs its suffix where int is 32 bits
  if (typeof v === "number") return key === "parentId" ? `${v}u` : String(v);
  if (typeof v === "string")
    return key === "imageData" ? `(void *)${cString(v)}` : ENUM[key]!(v);
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

// A style's literal, or undefined for another export (the tokens of createTokens: their leaves are var() text)
const SHAPE = new Set([
  "layout",
  "backgroundColor",
  "cornerRadius",
  "border",
  "clip",
  "floating",
  "image",
  "shadow",
  "backdrop",
  "aspectRatio",
  "text",
  "themes",
  ...STATES,
]);
const isShape = (v: unknown): v is Shape =>
  !!v &&
  typeof v === "object" &&
  Object.keys(v).every((k) => SHAPE.has(k)) &&
  !Formatter.formatJson(v).includes('"var(');

/**
 * The styles of a module as C: a `Clay_ElementDeclaration` per export, and a `Clay_TextElementConfig` named
 * `<name>_text` for one that sets text props, for `CLAY(id, name)` and `CLAY_TEXT(s, name_text)`. A state is a whole
 * declaration of its own, `<name>_hover` (`_focus`, `_active`, and `<name>_hover_text`); a theme is a whole set of
 * them again, its name last (`<name>_<theme>`, `<name>_hover_<theme>`, `<name>_text_<theme>`), for every style once
 * the module has a theme, so a page picks a theme by appending its name. The fonts of `fonts()` are an enum, `<name>_<font>`, in their order.
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
  const print = (name: string, all: Shape, theme = "") => {
    const { themes: _, ...v } = all;
    const base = Object.fromEntries(
      Object.entries(v).filter(([k]) => !(STATES as readonly string[]).includes(k)),
    );
    for (const [suffix, shape] of [
      ["", base],
      ...STATES.flatMap((s) => (v[s] ? [[`_${s.slice(1)}`, merge(base, v[s] as Shape)]] : [])),
    ] as [string, Shape][]) {
      // a shadow or a backdrop is no Clay field (clay.h 1.0 has none): the declaration keeps its layout, the renderer
      // its effect
      const { text, ...decl } = shape;
      delete decl.shadow;
      delete decl.backdrop;
      if (Object.keys(decl).length)
        lines.push(
          `static const Clay_ElementDeclaration ${name}${suffix}${theme} = ${c("", decl)};`,
        );
      if (text)
        lines.push(
          `static const Clay_TextElementConfig ${name}${suffix}_text${theme} = ${c("", text)};`,
        );
    }
  };
  const shapes = Object.entries(styles).filter((e): e is [string, Shape] => isShape(e[1]));
  for (const [name, v] of Object.entries(styles))
    if (Predicate.hasProperty(v, "fonts") && Array.isArray(v.fonts) && Object.keys(v).length === 1)
      lines.push(`enum { ${v.fonts.map((f, i) => `${name}_${String(f)} = ${i}`).join(", ")} };`);
  for (const [name, v] of shapes) print(name, v);
  const names = [...new Set(shapes.flatMap(([, v]) => Object.keys((v.themes ?? {}) as Shape)))];
  for (const theme of names) {
    lines.push("", `// theme ${theme}`);
    for (const [name, v] of shapes)
      print(name, merge(v, ((v.themes as Shape | undefined)?.[theme] ?? {}) as Shape), `_${theme}`);
  }
  return `${lines.join("\n")}\n`;
};
