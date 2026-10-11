import {
  bg,
  borderRadius,
  cn,
  color,
  cursor,
  cv,
  fontSize,
  hover,
  opacity,
  p,
} from "cssints" with { type: "cssints" };

// cv() takes css values and returns the function you call: the props are typed from the variants.
export const button = cv({
  base: cn(p(2), borderRadius("8px"), fontSize("1rem"), cursor("pointer"), color("white")),
  variants: {
    tone: {
      primary: cn(bg("#2563eb"), hover(bg("#1d4ed8"))),
      danger: cn(bg("#dc2626"), hover(bg("#b91c1c"))),
    },
    size: { sm: fontSize("0.875rem"), lg: cn(p(4), fontSize("1.25rem")) },
    disabled: { true: opacity(0.5), false: opacity(1) },
  },
  defaultVariants: { tone: "primary", size: "sm", disabled: false },
  compoundVariants: [{ tone: "danger", disabled: true, class: opacity(0.3) }],
});
