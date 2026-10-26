// The tabs skin, authored on cssints and compiled to tabs.css by scripts/component-css.ts.
//
// The selected tab is the highlight rule under it, not a filled block: one variable changes when the
// selection moves, and the panels keep the page's surface. Vertical tabs move that rule to the start.
import { cn, css } from "cssints" with { type: "cssints" };

css.global(
  ".ui-tabs",
  cn(
    css.display("grid"),
    css.gap("var(--space-2)"),
    css.fontSize("var(--font-size)"),
    css.color("var(--color-text)"),
  ),
);

css.global(
  ".ui-tabs__list",
  cn(
    css.display("flex"),
    css.gap("var(--space-1)"),
    css.borderBlockEnd("1px solid var(--color-border)"),
  ),
);

css.global(
  '.ui-tabs__list[aria-orientation="vertical"]',
  cn(
    css.flexDirection("column"),
    css.borderBlockEndWidth("0"),
    css.borderInlineStartWidth("1px"),
    css.borderInlineStartStyle("solid"),
    css.borderInlineStartColor("var(--color-border)"),
  ),
);

css.global(
  ".ui-tabs__tab",
  cn(
    css.padding("var(--space-2) var(--space-3)"),
    css.border("0"),
    css.borderBottom("2px solid transparent"),
    css.background("transparent"),
    css.font("inherit"),
    css.color("var(--color-muted)"),
    css.cursor("pointer"),
  ),
);

css.global(
  ".ui-tabs__tab:hover",
  cn(css.color("var(--color-text)"), css.background("var(--color-button-background)")),
);

css.global(
  '.ui-tabs__tab[aria-selected="true"]',
  cn(css.borderBottomColor("var(--color-highlight)"), css.color("var(--color-text)")),
);

css.global(
  '.ui-tabs__list[aria-orientation="vertical"] .ui-tabs__tab',
  cn(
    css.borderBlockEndWidth("0"),
    css.borderInlineStartWidth("2px"),
    css.borderInlineStartStyle("solid"),
    css.borderInlineStartColor("transparent"),
  ),
);

css.global(
  '.ui-tabs__list[aria-orientation="vertical"] .ui-tabs__tab[aria-selected="true"]',
  css.borderInlineStartColor("var(--color-highlight)"),
);

css.global(
  '.ui-tabs__tab[aria-disabled="true"]',
  cn(css.color("var(--color-text-disabled)"), css.cursor("not-allowed")),
);

css.global(
  ".ui-tabs__tab:focus-visible",
  cn(
    css.outline("2px solid var(--color-focus-ring)"),
    css.outlineOffset("-2px"),
    css.borderRadius("var(--radius-sm)"),
  ),
);

css.global(".ui-tabs__panel", css.padding("var(--space-2) 0"));
css.global(".ui-tabs__panel[hidden]", css.display("none"));

css.global(
  ".ui-tabs__panel:focus-visible",
  cn(css.outline("2px solid var(--color-focus-ring)"), css.outlineOffset("2px")),
);
