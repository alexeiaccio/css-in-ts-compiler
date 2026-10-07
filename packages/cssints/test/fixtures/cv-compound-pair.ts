import { bg, color, cv, p } from "cssints" with { type: "cssints" };

// two compounds that can be active together (no key with different values) and both set color
export const bad = cv({
  variants: { size: { lg: p(4) }, tone: { loud: bg("red") } },
  compoundVariants: [
    { size: "lg", class: color("green") },
    { tone: "loud", class: color("pink") },
  ],
});
