// Test-only members of the seams (no public helper yet): raw style nodes with a marker and a kernel, and a function
// that a configuration builds (a definition site, see seam-defs.ts).
const at = `@property --bx-w { syntax: "<length>"; inherits: false; initial-value: 1px }`;
const requires = [
  "css.at-rules.property",
  "css.at-rules.container.style_queries_for_custom_properties",
];
export const BOX = { key: "box@1", css: "._b{border:var(--bx-w) solid}", atProperty: at, requires };
// same key, other css
export const BOX_OTHER = { key: "box@1", css: "._b{border:0}", atProperty: at };
// another key that declares the same custom property
export const RING = { key: "ring@1", css: "._r{outline:1px solid}", atProperty: at };
// another key, its own custom property
export const CHIP = { key: "chip@1", css: "._c{--chip-r:4px}" };

const node = (kernel: object, marker: string, w: string) => ({
  __cssints: [["border-width", w]],
  markers: [[marker, (kernel as { key: string }).key]],
  kernels: [kernel],
});
export const box = (w: string) => node(BOX, "_b", w);
export const boxOther = () => node(BOX_OTHER, "_b", "1px");
export const ring = () => node(RING, "_r", "1px");
// another key that prints the marker of box
export const chip = () => node(CHIP, "_b", "1px");
export const makeIcons = (config: Record<string, string>) => (name: string) => box(config[name]!);
