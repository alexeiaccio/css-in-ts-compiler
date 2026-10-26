// The radio skin, authored on cssints and compiled to radio.css by scripts/component-css.ts.
//
// The circle is the border and the dot the highlight; `aria-checked` drives both, so a retheme moves
// the selected radio. The ring is on the group for `aria-activedescendant` and on the radio for
// roving focus.
import { cn, css } from "cssints" with { type: "cssints" };

const ring = cn(
  css.outline("2px solid var(--color-focus-ring)"),
  css.outlineOffset("2px"),
  css.borderRadius("var(--radius-sm)"),
);

css.global(
  ".ui-radiogroup",
  cn(
    css.display("flex"),
    css.flexDirection("column"),
    css.gap("var(--space-2)"),
    css.fontSize("var(--font-size)"),
    css.color("var(--color-text)"),
  ),
);

css.global(
  '.ui-radiogroup[aria-orientation="horizontal"]',
  cn(css.flexDirection("row"), css.gap("var(--space-4)")),
);

css.global(
  ".ui-radio",
  cn(
    css.display("inline-flex"),
    css.alignItems("center"),
    css.gap("var(--space-2)"),
    css.width("max-content"),
    css.cursor("pointer"),
    css.userSelect("none"),
  ),
);

css.global(
  ".ui-radio__circle",
  cn(
    css.display("grid"),
    css.placeItems("center"),
    css.boxSizing("border-box"),
    css.width("1.125rem"),
    css.height("1.125rem"),
    css.border("1px solid var(--color-border-hover)"),
    css.borderRadius("999px"),
    css.background("var(--color-surface)"),
  ),
);

css.global(
  ".ui-radio__circle::after",
  cn(
    css.content('""'),
    css.width("0.5rem"),
    css.height("0.5rem"),
    css.borderRadius("999px"),
    css.background("var(--color-on-highlight)"),
    css.scale("0"),
  ),
);

css.global(
  '.ui-radio[aria-checked="true"] .ui-radio__circle',
  cn(css.borderColor("var(--color-highlight)"), css.background("var(--color-highlight)")),
);

css.global('.ui-radio[aria-checked="true"] .ui-radio__circle::after', css.scale("1"));

css.global(
  '.ui-radio[aria-disabled="true"]',
  cn(css.color("var(--color-text-disabled)"), css.cursor("not-allowed")),
);

css.global(
  '.ui-radio[aria-disabled="true"] .ui-radio__circle',
  cn(
    css.borderColor("var(--color-border-disabled)"),
    css.background("var(--color-button-background)"),
  ),
);

css.global(".ui-radio:focus-visible", ring);
css.global(".ui-radiogroup:focus-visible", ring);
