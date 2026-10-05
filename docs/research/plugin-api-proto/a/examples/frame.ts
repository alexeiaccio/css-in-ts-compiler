import { scope } from "cssints/plugin";

export const { frame } = scope("frame", {
  length: "<length [0,∞]>",
  core: {
    css: `& { padding: var(--_p); margin: var(--_m); border: var(--_b) solid; border-radius: var(--_x) }`,
    atProperty: `@property --_r { syntax: "<length>"; inherits: false; initial-value: 0px; }`,
    requires: ["css.at-rules.property", "css.types.max"],
  },
  fallback: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "&", read: "--_i", write: "--_u", watch: "--_t" }],
    css: `:root[data-cssints-poly] & { --_u: calc(var(--_r) + var(--_m)) }`,
  },
  noBox: { props: [/^(padding|margin)(-|$)/, /^border(?!.*color)/], message: "frame() sets padding, margin, border-radius and the border: use its methods" },
  frame: {
    uses: ["core", "fallback", "noBox"],
    chain: {
      radius: { args: "<length>", emit: (v) => [["--_r", v]] },
      padding: { args: "<length>", spacing: true, emit: (v) => [["--_p", v]] },
      border: { args: "<length>", emit: (v) => [["--_b", v]] },
      margin: { args: "<length>", spacing: true, emit: (v) => [["--_m", v]] },
    },
  },
}).export();
