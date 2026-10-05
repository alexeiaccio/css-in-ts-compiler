import { member } from "cssints/plugin";

const length = "<length [0,∞]>";
export const ring = member({
  name: "ring",
  emit: {
    kernel: {
      css: "& { outline: var(--_w) solid var(--_c); }",
      conflicts: { props: ["outline", /^outline-/], message: "ring() sets the outline" },
    },
  },
  then: {
    width: { args: length, emit: (v) => ({ decls: { "--_w": v } }) },
    color: { args: "<color>", emit: (v) => ({ decls: { "--_c": v } }) },
  },
});

export const a = ring().width("2px").color("red");
export const b = ring().width("2px");
// @ts-expect-error used once
export const twice = ring().width("1px").width("2px");
// @ts-expect-error not a length
export const wrong = ring().width("red");
// @ts-expect-error not a colour
export const wrong2 = ring().color("1px");
