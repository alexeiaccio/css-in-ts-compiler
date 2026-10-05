import { scope } from "cssints/plugin";

export const plugin = scope("ring", {
  width: "<length [0,∞]> | thin | thick",
  "#core": {
    css: `& { outline: var(--_w) solid var(--_c); outline-offset: 2px }`,
    atProperty: `@property --_w { syntax: "<length>"; inherits: false; initial-value: 2px; }`,
    requires: ["css.at-rules.property"],
  },
  "#noOutline": { props: ["outline", /^outline-/], message: "ring() sets the outline: use its methods" },
  ring: {
    uses: ["core", "noOutline"],
    chain: {
      width: { args: "<width>", spacing: true, emit: (v) => [["--_w", v]] },
      color: { args: "<color>", emit: (v) => [["--_c", v]] },
    },
  },
});
export const { ring } = plugin.export();
