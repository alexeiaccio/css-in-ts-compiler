// The accordion skin, authored on cssints and compiled to accordion.css by scripts/component-css.ts.
//
// The trigger is the disclosure's sibling: a chevron turned by `aria-expanded`; the heading is a real
// `h3` and keeps the page's type. Every colour is a theme variable.
import { cn, css } from "cssints" with { type: "cssints" };

css.global(
  ".ui-accordion",
  cn(css.display("grid"), css.fontSize("var(--font-size)"), css.color("var(--color-text)")),
);

css.global(
  ".ui-accordion__heading",
  cn(css.margin("0"), css.fontSize("inherit"), css.fontWeight("inherit")),
);

css.global(
  ".ui-accordion__trigger",
  cn(
    css.display("flex"),
    css.alignItems("center"),
    css.gap("var(--space-2)"),
    css.width("100%"),
    css.padding("var(--space-2) var(--space-3)"),
    css.border("0"),
    css.borderRadius("var(--radius-md)"),
    css.background("transparent"),
    css.font("inherit"),
    css.fontWeight("600"),
    css.color("inherit"),
    css.textAlign("start"),
    css.cursor("pointer"),
  ),
);

css.global(".ui-accordion__trigger:hover", css.background("var(--color-button-background)"));

css.global(
  ".ui-accordion__trigger:focus-visible",
  cn(css.outline("2px solid var(--color-focus-ring)"), css.outlineOffset("2px")),
);

css.global(
  '.ui-accordion__trigger[aria-disabled="true"]',
  cn(css.color("var(--color-text-disabled)"), css.cursor("not-allowed")),
);

css.global(
  ".ui-accordion__chevron",
  cn(
    css.width("0"),
    css.height("0"),
    css.borderBlockWidth("0.3rem"),
    css.borderBlockStyle("solid"),
    css.borderBlockColor("transparent"),
    css.borderInlineStartWidth("0.4rem"),
    css.borderInlineStartStyle("solid"),
    css.borderInlineStartColor("currentColor"),
    css.transition("rotate 120ms ease"),
  ),
);

css.global(
  '.ui-accordion__trigger[aria-expanded="true"] .ui-accordion__chevron',
  css.rotate("90deg"),
);

css.global(
  ".ui-accordion__panel",
  cn(
    css.padding("var(--space-2) var(--space-3) var(--space-4)"),
    css.borderRadius("var(--radius-sm)"),
    css.color("var(--color-muted)"),
  ),
);

css.global(".ui-accordion__panel[hidden]", css.display("none"));

css.global(
  ".ui-accordion__panel:focus-visible",
  cn(css.outline("2px solid var(--color-focus-ring)"), css.outlineOffset("2px")),
);
