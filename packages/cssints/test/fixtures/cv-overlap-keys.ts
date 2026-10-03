import { borderBottom, borderColor, cv } from "cssints" with { type: "cssints" };

// two keys can be active together: border-bottom and border-color overlap without containment
export const bad = cv({
  variants: { a: { x: borderBottom("1px solid red") }, b: { x: borderColor("blue") } },
});
