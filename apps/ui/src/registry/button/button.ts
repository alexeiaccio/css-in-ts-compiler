// The button skin, authored on cssints and compiled to button.css by scripts/component-css.ts.
//
// Every value is a theme custom property. A pressed toggle is the highlight; a disabled button keeps
// the text colour of a control and only loses its cursor, because `aria-disabled` leaves it focusable.
import { cn, css } from "cssints" with { type: "cssints" };

css.global(
  ".ui-button",
  cn(
    css.boxSizing("border-box"),
    css.display("inline-flex"),
    css.alignItems("center"),
    css.justifyContent("center"),
    css.gap("var(--space-2)"),
    css.width("max-content"),
    css.padding("var(--space-2) var(--space-4)"),
    css.border("1px solid var(--color-border)"),
    css.borderRadius("var(--radius-md)"),
    css.background("var(--color-button-background)"),
    css.font("inherit"),
    css.fontSize("var(--font-size)"),
    css.color("var(--color-text)"),
    css.cursor("pointer"),
  ),
);

css.global(
  ".ui-button:hover",
  cn(
    css.background("var(--color-button-background-pressed)"),
    css.borderColor("var(--color-border-hover)"),
  ),
);

css.global(".ui-button:active", css.background("var(--color-tint-300)"));

css.global(
  '.ui-button[aria-pressed="true"]',
  cn(
    css.background("var(--color-highlight)"),
    css.borderColor("var(--color-highlight)"),
    css.color("var(--color-on-highlight)"),
  ),
);

css.global(
  '.ui-button[aria-pressed="true"]:hover',
  cn(
    css.background("var(--color-highlight-pressed)"),
    css.borderColor("var(--color-highlight-pressed)"),
  ),
);

css.global(
  '.ui-button[aria-disabled="true"]',
  cn(
    css.borderColor("var(--color-border-disabled)"),
    css.background("var(--color-button-background)"),
    css.color("var(--color-text-disabled)"),
    css.cursor("not-allowed"),
  ),
);

css.global(
  ".ui-button:focus-visible",
  cn(css.outline("2px solid var(--color-focus-ring)"), css.outlineOffset("2px")),
);
