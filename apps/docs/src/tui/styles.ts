// The TUI page's styles. A module of their own, as the playground's: Tui.tsx imports the class strings, so the build's
// evaluation of these does not load the terminal.
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };

import { gtSidebar } from "../layout.ts" with { type: "cssints" };
import { mono } from "../prose.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };

export const page: Style = css.cn(
  css.display("grid"),
  css.alignContent("start"),
  css.minWidth("0"),
  css.padding(t.space.md, t.space.lg, t.space.lg),
  css.gap(t.space.md),
  gtSidebar(css.gridColumn("2 / -1")),
);
export const heading: Style = css.cn(
  css.margin("0"),
  css.fontSize(t.fontSize.xl),
  css.fontWeight(t.fontWeight.bold),
);
export const text: Style = css.cn(
  css.margin("0"),
  css.maxWidth("75ch"),
  css.color(t.color.textMedium),
  css.lineHeight(t.lineHeight.relaxed),
);
export const screen: Style = css.cn(
  css.height("34rem"),
  css.minWidth("0"),
  css.overflow("hidden"),
  css.padding(t.space.sm),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.bg),
  css.fontFamily(mono),
);
export const status: Style = css.cn(css.fontSize(t.fontSize.sm), css.color(t.color.textLow));
