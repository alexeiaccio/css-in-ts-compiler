import { scope } from "cssints/plugin";

// A plugin is the members of a scope(): a table (kernels, syntax names, members) and the code that builds them.
export const { ring } = scope("ring", {
  // a syntax name of this scope: `<width>` in a grammar below
  width: "<length [0,∞]> | thin | thick",
  // a kernel: global CSS, once. `&` is the class the engine mints for it, `--_w` is the custom property `--ring-w`
  "#core": {
    css: "& { outline: var(--_w) solid var(--_c); outline-offset: 2px }",
    atProperty: '@property --_w { syntax: "<length>"; inherits: false; initial-value: 2px; }',
    requires: ["css.at-rules.property"],
  },
  "#noOutline": {
    props: ["outline", /^outline-/],
    message: "ring() sets the outline: use its methods",
  },
  // a chain member, like flex(): a call gives the marker and the kernel, each method emits custom properties
  ring: {
    uses: ["core", "noOutline"],
    chain: {
      width: { args: "<width>", spacing: true, emit: (v) => [["--_w", v]] },
      color: { args: "<color>", emit: (v) => [["--_c", v]] },
    },
  },
}).export();
