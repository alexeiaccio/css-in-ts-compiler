// The playground's styles. A module of their own: Playground.tsx imports the class strings (no site there), so the build's
// evaluation of these does not load the editor.
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };

import { gtSidebar } from "../layout.ts" with { type: "cssints" };
import { mono } from "../prose.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };

// The page is one screen: the editor on the left, the result on the right (stacked below 900 px).
export const page: Style = css.cn(
  css.display("grid"),
  css.gridTemplateRows("auto minmax(0, 1fr)"),
  css.minWidth("0"),
  css.height("calc(100dvh - var(--layout-header-height))"),
  css.padding(t.space.md, t.space.lg, t.space.lg),
  css.gap(t.space.md),
  gtSidebar(css.gridColumn("2 / -1")),
);
export const bar: Style = css.cn(css.flex().alignItems("center").gap(3), css.flexWrap("wrap"));
export const heading: Style = css.cn(
  css.margin("0"),
  css.fontSize(t.fontSize.lg),
  css.fontWeight(t.fontWeight.bold),
);
export const status: Style = css.cn(
  css.marginRight("auto"),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.textLow),
);
export const button: Style = css.cn(
  css.padding(t.space.xs, t.space.md),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.bgSubtle),
  css.color(t.color.text),
  css.fontSize(t.fontSize.sm),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.bgMuted)),
  css.focusVisible(css.outline("2px solid", t.color.accent), css.outlineOffset("2px")),
);
export const split: Style = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("minmax(0, 1fr)"),
  css.gridTemplateRows("minmax(0, 1fr) minmax(0, 1fr)"),
  css.gap(t.space.md),
  css.minHeight("0"),
  gtSidebar(
    css.gridTemplateColumns("minmax(0, 1fr) minmax(0, 1fr)"),
    css.gridTemplateRows("minmax(0, 1fr)"),
  ),
);
export const column: Style = css.cn(
  css.display("grid"),
  css.gridTemplateRows("auto minmax(0, 1fr) auto"),
  css.minHeight("0"),
  css.minWidth("0"),
  css.gap(t.space.sm),
);
export const pane: Style = css.cn(
  css.minHeight("0"),
  css.minWidth("0"),
  css.overflow("auto"),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.bgSubtle),
);
export const editor: Style = css.cn(
  css.minHeight("0"),
  css.overflow("hidden"),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.md),
);
export const result: Style = css.cn(
  css.display("grid"),
  css.gridTemplateRows("auto minmax(0, 1fr)"),
  css.minHeight("0"),
  css.minWidth("0"),
  css.gap(t.space.sm),
);
export const tabs: Style = css.cn(css.flex().gap(1), css.flexWrap("wrap"));
export const tab = css.cv({
  base: css.cn(
    css.padding(t.space.xs, t.space.md),
    css.border("0", "none"),
    css.borderRadius(t.radius.sm),
    css.bg("transparent"),
    css.color(t.color.textMedium),
    css.fontSize(t.fontSize.sm),
    css.cursor("pointer"),
    css.hover(css.bg(t.color.bgMuted)),
    css.focusVisible(css.outline("2px solid", t.color.accent)),
  ),
  variants: {
    on: {
      true: css.cn(
        css.bg(t.color.accentSoft),
        css.color(t.color.accentStrong),
        css.fontWeight(t.fontWeight.semiBold),
      ),
    },
  },
});
export const base: Style = css.cn(
  css.marginLeft("auto"),
  css.alignSelf("center"),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.textMedium),
  css.cursor("pointer"),
);
export const code: Style = css.cn(
  css.margin("0"),
  css.padding(t.space.md),
  css.fontFamily(mono),
  css.fontSize(t.fontSize.xs),
  css.lineHeight(t.lineHeight.snug),
  css.whiteSpace("pre"),
  css.tabSize(2),
);
export const frameBox: Style = css.cn(
  css.display("block"),
  css.width("100%"),
  css.height("100%"),
  css.border("0", "none"),
  css.bg("white"),
);
export const notes: Style = css.cn(
  css.maxHeight("40%"),
  css.overflow("auto"),
  css.fontSize(t.fontSize.sm),
);
export const error: Style = css.cn(
  css.margin("0"),
  css.marginBottom(t.space.sm),
  css.padding(t.space.sm, t.space.md),
  css.bg(t.color.errorSoft),
  css.color(t.color.error),
  css.borderRadius(t.radius.sm),
  css.fontFamily(mono),
  css.fontSize(t.fontSize.xs),
  css.whiteSpace("pre-wrap"),
);
export const warning: Style = css.cn(error, css.bg(t.color.bgMuted), css.color(t.color.textMedium));
