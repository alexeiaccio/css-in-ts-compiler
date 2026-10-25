// What user code sees of scv(): props from the variants, a class string per slot, and what a variant value may be.
// `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
import * as css from "cssints" with { type: "cssints" };
import { bg, cn, color, fontSize, opacity, p, scv, width } from "cssints" with { type: "cssints" };
import type { ScvConfig, ScvValue, Style } from "cssints";

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
export const slots: { base: string; label: string; icon: string } = button({
  size: "lg",
  disabled: true,
});
export const base: string = button().base;
button();
button({});
button({ size: undefined });
// @ts-expect-error a typo in a variant name
button({ sizee: "lg" });
// @ts-expect-error a typo in a value
button({ size: "xl" });
// @ts-expect-error a boolean variant takes a boolean, not its key
button({ disabled: "true" });
// @ts-expect-error a slot that is not there
export const missing = button().labl;

// @ts-expect-error slots is required
scv({ variants: { size: { sm: p(1) } } });
// @ts-expect-error a slot is a style, not a CSS string
scv({ slots: { base: "padding: 1rem" } });
// @ts-expect-error a variant value is a style or a record by slot
scv({ slots: { base: p(2) }, variants: { size: { sm: "_abc" } } });
// @ts-expect-error a record names slots
scv({ slots: { base: p(2), label: p(1) }, variants: { size: { sm: { labl: p(1) } } } });
scv({
  slots: { base: p(2), label: p(1) },
  variants: { size: { lg: p(4) } },
  // @ts-expect-error a compound names slots too
  compoundVariants: [{ size: "lg", class: p(2), labl: p(1) }],
});
scv({
  slots: { base: p(2) },
  variants: { size: { lg: p(4) } },
  // @ts-expect-error a compound has a class
  compoundVariants: [{ size: "lg" }],
});
// @ts-expect-error a default is checked against the variants
scv({ slots: { base: p(2) }, variants: { size: { sm: p(1) } }, defaultVariants: { size: "lg" } });
scv({
  slots: { base: p(2) },
  variants: { size: { sm: p(1) } },
  // @ts-expect-error so is a compound's value
  compoundVariants: [{ size: "lg", class: p(2) }],
});
// @ts-expect-error a runtime string is not a build-time style
scv({ slots: { base: css.cn(p(1), "x") } });

// a record is partial, and a slot may be named by any of the slots
scv({ slots: { base: p(2), label: p(1) }, variants: { size: { sm: { label: p(1) } } } });
// a slot named base is not required: a record by slot needs none
scv({ slots: { trigger: p(2), content: p(1) }, variants: { open: { yes: { content: p(4) } } } });
// no variants at all: one slot, no props
export const plain = scv({ slots: { base: p(2) } });
export const only: string = plain().base;

// the groups have it, as they have cv()
css.scv({ slots: { base: css.p(2) } });
export const config: ScvConfig<Record<string, Style>> = { slots: { base: p(2) } };
export const value: ScvValue<{ base: Style }> = p(1);
