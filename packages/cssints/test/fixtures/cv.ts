import { _cv } from "cssints";
import { cn, cv, flex, fontSize, p } from "cssints" with { type: "cssints" };

// base and variant values are css values: cn(...), a flex() chain, or one property.
export const button = _cv(
  cv({
    base: cn(p(2), fontSize("1rem")),
    variants: { size: { sm: p(1), lg: cn(p(4), fontSize("1.25rem")) }, layout: { row: flex().gap(2) } },
    defaultVariants: { size: "sm" },
  }),
);
