// A plugin on scope(): aliases (public and private), an embedded scope and a token set, kernels as raw CSS and as styles,
// a runtime and conflicts, a global and layers, chain, call and value members, and a typed property.
import { createTokens } from "cssints" with { type: "cssints" };
import { arg, scope } from "cssints/plugin";

export const brand = createTokens({ color: { accent: { $type: "color", $value: "#0af" } } });

const base = scope("sk-base", {
  mark: { css: "& { --_m: 1 }" },
  gap: "<length [0,∞]>",
});

export const kit = scope("sk", {
  base,
  tokens: { tokens: brand },
  width: "<length [0,∞]> | thin | thick",
  "#tone": "<tokens.color.accent> | <color>",
  "-webkit-font-smoothing": "auto | none | antialiased",
  // a kernel written as styles: checked like a user's declarations, printed as `&{...}`
  core: { css: (css) => [css.outline("var(--_w)", "solid", "var(--_c)"), css.outlineOffset("2px")] },
  // raw CSS, with a custom property of the scope and the class of a kernel of the embedded scope
  extra: {
    css: "& { --_x: 1 } &(base.mark) > & { --_y: 2 }",
    atProperty: '@property --_w { syntax: "<length>"; inherits: false; initial-value: 2px; }',
    requires: ["css.at-rules.property"],
  },
  fallback: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "&", read: "--_r", write: "--_w2" }],
    css: ":root[data-cssints-poly] & { --_fb: 1 }",
  },
  noOutline: { props: ["outline", /^outline-/], message: "ring() sets the outline: use its methods" },
  grid: { rule: ".sk-global { --_g: 1 }" },
  order: { layers: ["app", "viewer"] },
  ring: {
    uses: ["core", "extra", "fallback", "noOutline"],
    chain: {
      width: { args: "<width>", spacing: true, emit: (v) => [["--_w", v]] },
      color: { args: "<tone>", emit: (v) => [["--_c", v]] },
      plain: { args: "", excludes: ["color"], emit: () => [["--_c", "currentColor"]] },
    },
  },
  tint: { args: "<color> <percentage>", value: ([c, p]) => `color-mix(in oklab, ${c}, black ${p})` },
  // positional: a colour, a token set, values for its paths, an object of options
  look: {
    args: ["<color>", "$tokens", "$overrides", { "size?": "<base.gap>", "in?": "app | viewer" }],
    uses: ["order", "grid"],
  },
  icon: { args: arg<"home" | "star">() },
  fail: { args: "<color>" },
}).build({
  look: (color, tokens, overrides, { size, in: source }) => ({
    decls: [
      ["--_c", color],
      ["--_s", size ?? "0"],
    ],
    uses: ["base.mark"],
    themes: [{ tokens, overrides, selector: ":root", layer: source ?? "app" }],
  }),
  icon: (name) => ({ decls: [["--_icon", name]] }),
  fail: () => {
    throw new Error("cssints: sk: no luck");
  },
});
export const { ring, tint, look, icon, fail, webkitFontSmoothing } = kit.export();
