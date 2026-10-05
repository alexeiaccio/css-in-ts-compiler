// Plugin members for the seams tests, written on scope() (cssints/plugin): a scope with a marker and a kernel, scopes whose
// kernels clash, and a function that a configuration builds (a definition site, see seam-defs.ts).
import { scope } from "cssints/plugin";

const atProperty = `@property --bx-w { syntax: "<length>"; inherits: false; initial-value: 1px }`;
const requires = [
  "css.at-rules.property",
  "css.at-rules.container.style_queries_for_custom_properties",
] as const;
const width = {
  width: { args: "<length>", emit: (v: string): [string, string][] => [["border-width", v]] },
} as const;

const boxScope = scope("box", {
  core: { css: "&{border:var(--bx-w) solid}", atProperty, requires: [...requires] },
  box: { uses: ["core"], chain: width },
});
export const box = boxScope.export().box;
// another scope that declares the same custom property
export const ring = scope("ring", {
  core: { css: "&{outline:var(--bx-w) solid}", atProperty },
  ring: { uses: ["core"], chain: width },
}).export().ring;
// two scopes whose kernels print the same marker: _chip-a-b
export const chip = scope("chip", {
  "a-b": { css: "&{--chip-r:4px}" },
  chip: { uses: ["a-b"], chain: width },
}).export().chip;
export const chipA = scope("chip-a", {
  b: { css: "&{--chip-a-r:4px}" },
  chipA: { uses: ["b"], chain: width },
}).export().chipA;
// a call member a configuration builds, over the kernel of box
export const makeIcons = (config: Record<string, string>) =>
  scope("seam-icons", {
    box: boxScope,
    icon: { args: "home | star", uses: ["box.core"] },
  })
    .build({ icon: (name) => ({ decls: [["border-width", config[name]!]] }) })
    .export().icon;
