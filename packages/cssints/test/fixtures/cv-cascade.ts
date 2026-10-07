import {
  bg,
  border,
  borderBottom,
  borderBottomColor,
  cn,
  color,
  cv,
  hover,
  opacity,
  p,
  pl,
} from "cssints" with { type: "cssints" };

// a variant that sets what the base sets replaces it: the base class is dropped while the value is active
export const same = cv({
  base: color("red"),
  variants: { tone: { blue: color("blue"), plain: bg("white") } },
});
// a shorthand over the base's longhand replaces it; a longhand inside the base's shorthand stays (the sheet puts it after)
export const covers = cv({
  base: pl(2),
  variants: { size: { lg: p(4) } },
});
export const inside = cv({
  base: border("1px solid red"),
  variants: { active: { yes: borderBottomColor("blue") } },
});
// under another condition they are in other layers: nothing to drop
export const layered = cv({
  base: color("red"),
  variants: { tone: { blue: hover(color("blue")) } },
});
// the contained pair of two keys stays too, and so does the same property in one key
export const peers = cv({
  base: borderBottom("1px solid red"),
  variants: { a: { x: p(1), y: pl(1) }, b: { x: borderBottomColor("blue") } },
});
// boolean variants, and compound variants: a compound is added when all its values are active, and wins over the
// base and the variants it combines (their classes for what it sets again are dropped)
export const compound = cv({
  base: cn(p(2), color("black")),
  variants: {
    size: { sm: p(1), lg: p(4) },
    tone: { quiet: color("gray"), loud: cn(color("white"), bg("red")) },
    disabled: { true: opacity(0.5), false: opacity(1) },
  },
  defaultVariants: { size: "sm", tone: "quiet", disabled: false },
  compoundVariants: [
    { size: "lg", tone: "loud", class: cn(p(6), bg("crimson")) },
    { disabled: true, tone: "loud", class: opacity(0.3) },
  ],
});
