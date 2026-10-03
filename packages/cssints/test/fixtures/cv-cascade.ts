import { _cv } from "cssints";
import {
  bg,
  border,
  borderBottom,
  borderBottomColor,
  color,
  cv,
  hover,
  p,
  pl,
} from "cssints" with { type: "cssints" };

// a variant that sets what the base sets replaces it: the base class is dropped while the value is active
export const same = _cv(
  cv({
    base: color("red"),
    variants: { tone: { blue: color("blue"), plain: bg("white") } },
  }),
);
// a shorthand over the base's longhand replaces it; a longhand inside the base's shorthand stays (the sheet puts it after)
export const covers = _cv(
  cv({
    base: pl(2),
    variants: { size: { lg: p(4) } },
  }),
);
export const inside = _cv(
  cv({
    base: border("1px solid red"),
    variants: { active: { yes: borderBottomColor("blue") } },
  }),
);
// under another condition they are in other layers: nothing to drop
export const layered = _cv(
  cv({
    base: color("red"),
    variants: { tone: { blue: hover(color("blue")) } },
  }),
);
// the contained pair of two keys stays too, and so does the same property in one key
export const peers = _cv(
  cv({
    base: borderBottom("1px solid red"),
    variants: { a: { x: p(1), y: pl(1) }, b: { x: borderBottomColor("blue") } },
  }),
);
