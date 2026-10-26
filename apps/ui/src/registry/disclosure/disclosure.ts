// The disclosure skin, authored on cssints and compiled to disclosure.css by scripts/component-css.ts.
//
// The panel is a frame inside the card that holds the disclosure: a small radius of its own, ready
// for a host that sets the inner one. Every colour is a theme custom property.
import { cn, css } from "cssints" with { type: "cssints" };

css.global(
  ".ui-disclosure",
  cn(
    css.display("grid"),
    css.gap("var(--space-2)"),
    css.fontSize("var(--font-size)"),
    css.color("var(--color-text)"),
  ),
);

css.global(
  ".ui-disclosure__trigger",
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
    css.color("inherit"),
    css.textAlign("start"),
    css.cursor("pointer"),
  ),
);

css.global(".ui-disclosure__trigger:hover", css.background("var(--color-button-background)"));

css.global(
  ".ui-disclosure__trigger:focus-visible",
  cn(css.outline("2px solid var(--color-focus-ring)"), css.outlineOffset("2px")),
);

css.global(
  ".ui-disclosure__chevron",
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
  '.ui-disclosure__trigger[aria-expanded="true"] .ui-disclosure__chevron',
  css.rotate("90deg"),
);

css.global(
  ".ui-disclosure__panel",
  cn(
    css.padding("var(--space-2) var(--space-3)"),
    css.borderRadius("var(--radius-sm)"),
    css.color("var(--color-muted)"),
  ),
);

css.global(".ui-disclosure__panel[hidden]", css.display("none"));
