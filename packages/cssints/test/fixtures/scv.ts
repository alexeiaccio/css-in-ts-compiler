import { bg, cn, color, fontSize, opacity, p, scv, width } from "cssints" with { type: "cssints" };

// one function, a class string per slot: a style styles the base slot, a record by slot styles the slots it names
export const button = scv({
  slots: { base: cn(p(2), color("white")), label: fontSize("1rem"), icon: width("1rem") },
  variants: {
    size: { sm: p(1), lg: { base: p(4), label: fontSize("1.25rem") } },
    tone: { quiet: color("gray"), loud: { base: color("black"), icon: color("red") } },
    disabled: { true: opacity(0.5), false: opacity(1) },
  },
  defaultVariants: { size: "sm", disabled: false },
  compoundVariants: [
    { size: "lg", tone: "loud", class: p(6) },
    { size: "lg", class: bg("crimson"), label: color("blue") },
  ],
});

// at the top of a module: calling the function works while the module is evaluated
export const classes = button({ size: "lg" });

// in a function: the config is a site of its own, and calling what scv() gives works there
export const badge = (props: { size: "sm" | "lg" }) => {
  const kit = scv({
    slots: { base: p(1), label: fontSize("0.75rem") },
    variants: { size: { sm: p(1), lg: p(2) } },
    defaultVariants: { size: "sm" },
  });
  return kit(props);
};
