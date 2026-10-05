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
  // conflicts of a kernel written as styles are derived (ring: outline and outline-offset); an entry of the list replaces them
  onlyOutline: { props: ["outline"], message: "loose() sets the outline shorthand" },
  // conditions inside a kernel, printed under its class in the order of the sheet
  live: {
    css: (css) => [
      css.hover(css.color("red")),
      css.color("var(--_c)"),
      css.media("(width >= 40rem)")(css.padding("1rem")),
      css.attr("aria-current", "page")(css.color("blue")),
      css.container("(width > 20rem)")(css.margin("1px")),
      css.supports("(display: grid)")(css.display("grid")),
      css.within(css.focus)(css.paddingTop("2px")),
      css.padding("2px"),
    ],
  },
  edge: { css: (css) => css.borderColor("var(--_c)") },
  grid: { rule: ".sk-global { --_g: 1 }" },
  order: { layers: ["app", "viewer"] },
  ring: {
    uses: ["core", "extra", "fallback"],
    chain: {
      width: { args: "<width>", spacing: true, emit: (v) => [["--_w", v]] },
      color: { args: "<tone>", emit: (v) => [["--_c", v]] },
      plain: { args: "", excludes: ["color"], emit: () => [["--_c", "currentColor"]] },
    },
  },
  loose: { uses: ["core", "onlyOutline"], chain: { color: { args: "<tone>", emit: (v) => [["--_c", v]] } } },
  alive: { uses: ["live"], chain: { color: { args: "<tone>", emit: (v) => [["--_c", v]] } } },
  edged: { uses: ["edge"], chain: { color: { args: "<tone>", emit: (v) => [["--_c", v]] } } },
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
export const { ring, loose, alive, edged, tint, look, icon, fail, webkitFontSmoothing } =
  kit.export();
