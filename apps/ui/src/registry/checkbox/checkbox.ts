// The checkbox skin, authored on cssints and compiled to checkbox.css by scripts/component-css.ts.
//
// The box is the border and the check its own background: two theme variables, no colour of its own,
// so a retheme moves it. `aria-checked` drives all three states, `mixed` included.
import { cn, css } from "cssints" with { type: "cssints" };

css.global(
  ".ui-checkbox",
  cn(
    css.boxSizing("border-box"),
    css.display("inline-flex"),
    css.alignItems("center"),
    css.gap("var(--space-2)"),
    css.width("max-content"),
    css.fontSize("var(--font-size)"),
    css.color("var(--color-text)"),
    css.cursor("pointer"),
    css.userSelect("none"),
  ),
);

css.global(
  ".ui-checkbox__box",
  cn(
    css.display("grid"),
    css.placeItems("center"),
    css.width("1.125rem"),
    css.height("1.125rem"),
    css.border("1px solid var(--color-border-hover)"),
    css.borderRadius("var(--radius-sm)"),
    css.background("var(--color-surface)"),
  ),
);

css.global(
  ".ui-checkbox__box::after",
  cn(
    css.content('""'),
    css.width("0.55rem"),
    css.height("0.3rem"),
    css.borderLeftWidth("2px"),
    css.borderLeftStyle("solid"),
    css.borderLeftColor("var(--color-on-highlight)"),
    css.borderBottomWidth("2px"),
    css.borderBottomStyle("solid"),
    css.borderBottomColor("var(--color-on-highlight)"),
    css.rotate("-45deg"),
    css.translate("0 -1px"),
    css.scale("0"),
  ),
);

const checkedBox = cn(
  css.borderColor("var(--color-highlight)"),
  css.background("var(--color-highlight)"),
);

css.global('.ui-checkbox[aria-checked="true"] .ui-checkbox__box', checkedBox);
css.global('.ui-checkbox[aria-checked="true"] .ui-checkbox__box::after', css.scale("1"));

// the tri-state: a dash, the check's border without the tall side
css.global('.ui-checkbox[aria-checked="mixed"] .ui-checkbox__box', checkedBox);
css.global(
  '.ui-checkbox[aria-checked="mixed"] .ui-checkbox__box::after',
  cn(
    css.width("0.55rem"),
    css.height("0"),
    css.borderLeftWidth("2px"),
    css.borderLeftStyle("solid"),
    css.borderLeftColor("var(--color-on-highlight)"),
    css.borderBottomWidth("0"),
    css.rotate("0deg"),
    css.translate("0 0"),
    css.scale("1"),
  ),
);

css.global(
  '.ui-checkbox[aria-disabled="true"]',
  cn(css.color("var(--color-text-disabled)"), css.cursor("not-allowed")),
);

css.global(
  '.ui-checkbox[aria-disabled="true"] .ui-checkbox__box',
  cn(
    css.borderColor("var(--color-border-disabled)"),
    css.background("var(--color-button-background)"),
  ),
);

css.global(
  ".ui-checkbox:focus-visible",
  cn(
    css.outline("2px solid var(--color-focus-ring)"),
    css.outlineOffset("2px"),
    css.borderRadius("var(--radius-sm)"),
  ),
);
