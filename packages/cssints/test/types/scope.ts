import { CSSColorValue } from "@cssints/css-grammar/values";
import { color, width } from "cssints";
import { scope, arg, fn, type GlobalRule } from "cssints/plugin";

import type { CheckIn } from "../../src/parts.ts";

type Err<M extends string> = { readonly $error: M };

const plugin = scope("ring", {
  width: "<length [0,∞]> | thin | thick",
  "#core": {
    css: `& { outline: var(--_w) solid var(--_c); outline-offset: 2px }`,
    atProperty: `@property --_w { syntax: "<length>"; inherits: false; initial-value: 2px; }`,
    requires: ["css.at-rules.property"],
  },
  "#noOutline": {
    props: ["outline", /^outline-/],
    message: "ring() sets the outline: use its methods",
  },
  ring: {
    uses: ["core", "noOutline"],
    chain: {
      width: { args: "<width>", spacing: true, emit: (v) => [["--_w", v]] },
      color: { args: "<color>", emit: (v) => [["--_c", v]] },
    },
  },
});
export const { ring } = plugin.export();
export const a: string = ring().width("2px").color("red");
export const b = ring().color("red");
// @ts-expect-error not a width
ring().width("red");
// @ts-expect-error used once
ring().width("1px").width("2px");
// @ts-expect-error no such method
ring().height("1px");

// ─── embedded scopes and token sets, private aliases, typed properties, value members, call members
import { createTokens } from "cssints";

const theme = createTokens({
  color: { accent: { $value: "#0af", $type: "color" } },
  space: { md: { $value: "8px", $type: "dimension" } },
});

const x = scope("x", {
  ring: plugin, // a scope as a module: <ring.width>
  brand: { tokens: theme }, // a token set as a module: <brand.color.accent>
  "#tone": "<brand.color.accent> | <color>",
  "-webkit-font-smoothing": "auto | none | antialiased",
  core: { css: "& { color: var(--_c) }" },
  styled: { css: (css) => css.color("var(--_c)") },
  // conditions inside a kernel written as styles
  lively: {
    css: (css) => [
      css.color("var(--_c)"),
      css.hover(css.color("red")),
      css.media("(width >= 40rem)")(css.padding("1rem")),
      css.attr("aria-current", "page")(css.color("blue")),
      // other elements, custom properties (a keyframes() name among the values)
      css.nest("& > * + *")(css.marginTop("var(--_gap)")),
      css.nest("&>:last-child")(css.hover(css.color("red"))),
      css.vars({ "--_gap": "1rem", "--_n": 1, "--_kf": css.keyframes({ from: css.opacity(0) }) }),
      // @ts-expect-error -- a nest() selector starts with & and a combinator
      css.nest(":hover")(css.color("red")),
      // @ts-expect-error -- vars() takes custom properties
      css.vars({ gap: "1rem" }),
    ],
  },
  tint: {
    args: "<color> <percentage>",
    value: ([c, p]) => `color-mix(in oklab, ${c}, black ${p})`,
  },
  badge: {
    uses: ["core"],
    chain: {
      tone: { args: "<tone>", emit: (v) => [["--_c", v]] },
      gap: { args: "<ring.width>", spacing: true, emit: (v) => [["gap", v]] },
      plain: { args: "", excludes: ["tone"], emit: () => [] },
    },
  },
  // positional: a colour, a token set, values for its paths, then an object of options
  pick: {
    args: ["<color>", "$tokens", "$overrides", { "size?": "<ring.width>", "on?": "<tone>" }],
    uses: ["core"],
  },
  one: { args: ["<tone>"] },
  lone: { args: arg<"a" | "b">() },
  rec: { args: [{ "size?": "<ring.width>", on: "<tone>" }] },
}).build({
  pick: (color, tokens, overrides, options) => {
    const t: object = tokens;
    const o: { readonly [group: string]: unknown } = overrides;
    const size: string | undefined = options.size;
    return {
      decls: [
        ["--_c", color],
        ["--_s", size ?? "0"],
      ],
      uses: ["core"],
      themes: [{ tokens: t, overrides: o, selector: ".x" }],
    };
  },
  one: (tone) => ({ decls: [["--_c", tone]] }),
  lone: (v) => ({ decls: [["--_c", v]] }),
  rec: ({ size, on }) => ({
    decls: [
      ["--_c", on],
      ["--_s", size ?? "0"],
    ],
  }),
});
export const { badge, webkitFontSmoothing, tint, pick, one, lone, rec, ring: nested } = x.export();

export const c: string = badge().tone("red").gap(2);
export const d: string = badge().tone("#0af");
export const e: string = webkitFontSmoothing("antialiased");
export const f = tint("red", "10%");
export const g: string = nested.ring().color("red");
export const h: string = pick("red", theme, { color: { accent: "blue" } });
export const i2: string = pick("red", theme, { color: { accent: "blue" } }, { size: "thin" });
export const j: string = one("red");
export const k: string = lone("a");
export const l: string = rec({ on: "red", size: "thin" });
// @ts-expect-error not a tone
badge().tone("1px");
// @ts-expect-error tone and plain exclude each other
badge().plain().tone("red");
// @ts-expect-error not a width (ring's alias, qualified)
badge().gap("red");
// @ts-expect-error not an antialiasing
webkitFontSmoothing("sharp");
// @ts-expect-error not a colour
pick("1px", theme, {});
// @ts-expect-error the overrides name a path the tokens do not have
pick("red", theme, { color: { nope: "blue" } });
// @ts-expect-error the override is not a colour
pick("red", theme, { color: { accent: "1px" } });
// @ts-expect-error size is thin or a length
pick("red", theme, {}, { size: "huge" });
// @ts-expect-error not a tone
one("1px");
// @ts-expect-error not a member of the type
lone("c");
// @ts-expect-error a missing required key
rec({ size: "thin" });
// @ts-expect-error size is thin or a length
rec({ on: "red", size: "huge" });

// @ts-expect-error `uses` names something that is not a kernel, global, runtime or conflicts
scope("bad", { a: { chain: {}, uses: ["nope"] } });
// @ts-expect-error a private entry (#core) of an embedded scope cannot be used
scope("bad2", { ring: plugin, a: { chain: {}, uses: ["ring.core"] } });
// @ts-expect-error a scope with call members has no export() until build()
scope("bad3", { a: { args: "<color>" } }).export();
// @ts-expect-error private entries are not exported
export const hiddenCore = x.export().core;
// @ts-expect-error build() takes a function for each call member
scope("bad4", { a: { args: "<color>" } }).build({});
// @ts-expect-error #trim and trim share a name (`uses` names both "trim")
scope("bad5", { "#trim": { css: "&{}" }, trim: { chain: {}, uses: ["trim"] } });

// the label of a message is `name.method`, with the grammar of the method; a number is a length only with `spacing`
type Bad = CheckIn<"ring.width", "<length [0,∞]>", false, ["red"]>;
export const message: Bad extends [infer M] ? M : never =
  'ring.width: unexpected "red" in "red", grammar <length [0,∞]>';
// @ts-expect-error a number is a spacing step only where the method says so
badge().tone(4);

// a grammar in a plain const (not `as const`) keeps its literal type, inline in a chain too
const plainGrammar = "<length [0,∞]>";
const { box } = scope("plain", {
  box: { chain: { size: { args: plainGrammar, emit: (v) => [["--_s", v]] } } },
}).export();
box().size(
  // @ts-expect-error not a length
  "red",
);
// @ts-expect-error a typed property needs a value
webkitFontSmoothing();

// value members: a Typed OM result keeps its type, a string is opaque
const { mix, quad } = scope("vals", {
  mix: {
    args: "<color> <color>",
    value: ([a, b]) => new CSSColorValue(`color-mix(in oklab, ${a}, ${b})`),
  },
  quad: { args: "<number>", value: ([n]) => `${Number(n) * 4}px` },
}).export();
export const m: string = color(mix("red", "blue"));
export const q: string = width(quad(2));
// @ts-expect-error not a color
mix("red", "solid");
// @ts-expect-error not a number
quad("red");
// @ts-expect-error a CSSColorValue is a <color>, not a <length>
width(mix("red", "blue"));
export const typed: CSSColorValue = mix("red", "blue");
export const opaque: string = quad(1);

// a value member with a tuple, through fn(): `value` gets the arguments as `build` would; `label` names it in messages
const { span } = scope("vargs", {
  span: fn({
    args: ["<length [0,∞]>", { "to?": "<length [0,∞]>", "zoom?": arg<boolean>() }],
    label: "span.it",
    value: ([a, { to, zoom }]) => {
      const t: string | undefined = to;
      const z: boolean | undefined = zoom;
      return new CSSColorValue(`${a}${t}${z}`);
    },
  }),
}).export();
export const sp: CSSColorValue = span("1px", { zoom: false });
export const sp2 = span("1px");
type SpanBad = Parameters<typeof span<["red"]>>[0];
export const spanMessage: SpanBad extends Err<infer M> ? M : never =
  'span.it: unexpected "red" in "red", grammar <length [0,∞]>';
// @ts-expect-error no such option
span("1px", { nope: "1px" });
// @ts-expect-error a boolean
span("1px", { zoom: "no" });
// @ts-expect-error a CSSColorValue is not a length
width(span("1px"));
// @ts-expect-error a tuple written in place, without fn(), would type `value` as a grammar's parts
scope("vbad", { v: { args: ["<color>", arg<boolean>()], value: () => "x" } });

// what a call member's build returns: globals by content, declared layers, themes over the tokens it was given
export const { looks } = scope("looks", {
  looks: { args: ["<custom-ident>", "$tokens"] },
})
  .build({
    looks: (name, tokens) => ({
      layers: ["app", "viewer"],
      globals: [{ css: `[data-mode="${name}"]{--k:1}`, layer: "app" }, { css: "a{--k:2}" }],
      themes: [
        {
          tokens,
          overrides: { color: { bg: "#000" } },
          selector: `.${name}`,
          layer: "viewer",
          scope: "main",
        },
      ],
    }),
  })
  .export();
// @ts-expect-error a global has no key: it is its content
export const keyed: GlobalRule = { key: "k", css: "a{}" };
scope("bad5", { a: { args: "<custom-ident>" } }).build({
  // @ts-expect-error `null` (a verbatim rule) is gone: declare the layers with `layers`
  a: () => ({ globals: [{ css: "@layer a, b;", layer: null }] }),
});
// layers before the engine's: a table entry, or what a build returns
scope("below", { "#l": { layers: ["reset"], before: true }, a: { args: "<custom-ident>" } }).build({
  a: () => ({ layers: { layers: ["reset", "base"], before: true }, uses: ["#l"] }),
});
scope("bad7", { a: { args: "<custom-ident>" } }).build({
  // @ts-expect-error `before` is a boolean
  a: () => ({ layers: { layers: ["reset"], before: "yes" } }),
});
scope("bad6", { a: { args: "<custom-ident>" } }).build({
  // @ts-expect-error a theme needs its tokens, overrides and selector
  a: () => ({ themes: [{ selector: ".a" }] }),
});
