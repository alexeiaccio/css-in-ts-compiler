import * as css from "cssints/tui" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// a button: a rounded border, a pointer, a hover and a pressed state
export const button = css.cn(
  css.border("rounded", "#585b70"),
  css.p(0, 1),
  css.width(12),
  css.height(3),
  css.bg(t.color.bg),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.hover), css.borderColor(t.color.accent)),
  css.active(css.borderStyle("double")),
);
export const label = css.cn(
  css.color(t.color.fg),
  css.fontWeight("bold"),
  css.textDecoration("underline"),
);
export const field = css.cn(
  css.caretShape("bar"),
  css.caretColor("#f5e0dc"),
  css.caretAnimation("manual"),
  css.focus(css.bg("#45475a")),
);
export const layout = css.cn(
  css.flexDirection("row"),
  css.gap(1),
  css.width("50%"),
  css.m("auto", 2),
  css.display("none"),
  css.zIndex(2),
  css.opacity(0.5),
);
// a site in a function: an arrow returns the literal
export const lit = () => css.color("oklch(0.7 0.15 30)");
