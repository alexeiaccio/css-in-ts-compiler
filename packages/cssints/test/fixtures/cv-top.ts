import { _cv } from "cssints";
import { cn, cv, fontSize, p } from "cssints" with { type: "cssints" };

const button = _cv(
  cv({
    base: cn(p(2), fontSize("1rem")),
    variants: { size: { sm: p(1), lg: p(4) } },
    defaultVariants: { size: "sm" },
  }),
);
export const classes = button({ size: "lg" });
