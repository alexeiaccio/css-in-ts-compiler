import { cn, p, scv } from "cssints/widely-available" with { type: "cssints" };

// an export group has scv(), as it has cv()
export const box = scv({
  slots: { base: cn(p(2)), label: p(1) },
  variants: { size: { sm: p(1), lg: { base: p(4), label: p(2) } } },
  defaultVariants: { size: "sm" },
});
