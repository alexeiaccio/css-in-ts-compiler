import { scope } from "cssints/plugin";

const pivot = "(0.5636 - l) * 1e6";
export const { surface } = scope("surface", {
  step: "<number [0,1]>",
  core: {
    css: `& { --_k: initial; --_d: 0; background-color: var(--_s) }`,
    atProperty: `@property --_e { syntax: "<color>"; inherits: true; initial-value: canvas; }`,
    requires: ["css.at-rules.property", { key: "css.types.color.oklch.relative_syntax", exact: true }],
  },
  fallback: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "&", read: "--_v", write: "--_u", watch: "--_t" }],
  },
  noBackground: { props: ["background", "background-color"], message: "surface() sets the background colour: use its methods" },
  surface: {
    uses: ["core", "fallback", "noBackground"],
    chain: {
      color: { args: "<color>", emit: (v) => [["--_k", v]] },
      lighten: { args: "<step>", excludes: ["darken", "contrast"], emit: (v) => [["--_d", v]] },
      darken: { args: "<step>", excludes: ["lighten", "contrast"], emit: (v) => [["--_d", `calc(${v} * -1)`]] },
      contrast: { args: "<step>", excludes: ["lighten", "darken"], emit: (v) => [["--_d", `calc(${v} * clamp(-1, ${pivot}, 1))`]] },
      ink: { args: "", emit: () => [["color", `oklch(from var(--_s) clamp(0, ${pivot}, 1) 0 0)`]] },
    },
  },
}).export();
