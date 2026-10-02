// Plugin members for the seams tests, written on the public helpers (cssints/plugin): contexts with a marker and a
// kernel, and a function that a configuration builds (a definition site, see seam-defs.ts).
import { context, method, style } from "cssints/plugin";

const atProperty = `@property --bx-w { syntax: "<length>"; inherits: false; initial-value: 1px }`;
const requires = [
  "css.at-rules.property",
  "css.at-rules.container.style_queries_for_custom_properties",
] as const;
const BOX = { key: "box@1", css: "._b{border:var(--bx-w) solid}", atProperty, requires: [...requires] };
const width = { width: method({ grammar: "<length>", emit: (v) => [["border-width", v]] }) };
export const box = context({ name: "box", marker: "_b", kernel: BOX, methods: width });
// same key, other css
export const boxOther = context({
  name: "box",
  marker: "_b",
  kernel: { key: "box@1", css: "._b{border:0}", atProperty },
  methods: width,
});
// another key that declares the same custom property
export const ring = context({
  name: "ring",
  marker: "_r",
  kernel: { key: "ring@1", css: "._r{outline:1px solid}", atProperty },
  methods: width,
});
// another key, its own custom property, that prints the marker of box
export const chip = context({
  name: "chip",
  marker: "_b",
  kernel: { key: "chip@1", css: "._c{--chip-r:4px}" },
  methods: width,
});
// a style member: a function a configuration builds
export const makeIcons = (config: Record<string, string>) =>
  style("home | star", (name) => ({
    decls: [["border-width", config[name]!]],
    markers: ["_b"],
    kernels: [BOX],
  }));
