// The switch skin, authored on cssints and compiled to switch.css by scripts/component-css.ts.
//
// Selectors are the contract here, not hashed classes: a copied component keeps `class="ui-switch"`
// from its markup, so the rules are written with `css.global(selector, …)` and the build checks each
// declaration against the CSS grammar. Every value is a theme custom property — a retheme moves the
// switch, and nothing here names a colour of its own.
import { cn, css } from "cssints" with { type: "cssints" };

const base = cn(
  css.boxSizing("border-box"),
  css.display("flex"),
  css.alignItems("center"),
  css.gap("var(--space-2)"),
  css.width("max-content"),
  css.padding("var(--space-1)"),
  css.borderRadius("999px"),
  css.background("var(--color-border)"),
  css.fontSize("var(--font-size)"),
  css.color("var(--color-text)"),
  css.cursor("pointer"),
);

css.global(".ui-switch", base);

css.global(
  '.ui-switch[aria-checked="true"]',
  cn(
    css.background("var(--color-highlight)"),
    css.color("var(--color-on-highlight)"),
    css.justifyContent("flex-end"),
  ),
);

css.global('.ui-switch[aria-disabled="true"]', css.cursor("not-allowed"));

css.global(
  ".ui-switch:focus-visible",
  cn(css.outline("2px solid var(--color-focus-ring)"), css.outlineOffset("2px")),
);

css.global(
  ".ui-switch__thumb",
  cn(
    css.display("block"),
    css.width("1.25rem"),
    css.height("1.25rem"),
    css.borderRadius("999px"),
    css.background("var(--color-surface)"),
  ),
);

css.global(".ui-switch__label", css.paddingInline("var(--space-2)"));
