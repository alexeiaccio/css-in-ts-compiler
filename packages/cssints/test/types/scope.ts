import { scope, arg } from "cssints/plugin";

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
