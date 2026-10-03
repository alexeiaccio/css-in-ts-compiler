import { color, cv } from "cssints" with { type: "cssints" };

// two keys can be active together and both set color: nothing says which wins
export const bad = cv({
  variants: { a: { x: color("red") }, b: { x: color("blue") } },
});
