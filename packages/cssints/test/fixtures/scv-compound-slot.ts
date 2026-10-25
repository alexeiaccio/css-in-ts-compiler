import { color, p, scv } from "cssints" with { type: "cssints" };

// a compound names slots beside `class`: `labl` is a typo, and it would style nothing
export const bad = scv({
  slots: { base: p(2), label: p(1) },
  variants: { size: { lg: p(4) } },
  compoundVariants: [{ size: "lg", class: color("red"), labl: p(6) }],
});
