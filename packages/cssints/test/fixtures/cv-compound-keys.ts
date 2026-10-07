import { color, cv, p } from "cssints" with { type: "cssints" };

// the compound is active with any value of `tone`, and both set color: nothing says which wins
export const bad = cv({
  variants: { size: { lg: p(4) }, tone: { loud: color("blue") } },
  compoundVariants: [{ size: "lg", class: color("green") }],
});
