import { cn, cv, p } from "cssints" with { type: "cssints" };

export const row = (on: boolean, props: { class?: string }) => cn(p(2), on && p(4), props.class);
export const button = cv({
  base: cn(p(2)),
  variants: { size: { sm: p(1), lg: p(4) } },
  defaultVariants: { size: "sm" },
});
