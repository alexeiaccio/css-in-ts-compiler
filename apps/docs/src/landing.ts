import * as css from "cssints" with { type: "cssints" };

import { gtSidebar } from "./layout.ts" with { type: "cssints" };
import { mono } from "./prose.ts" with { type: "cssints" };
import { t } from "./theme.ts" with { type: "cssints" };

// The landing page is html made at build time (plugin/landing.ts), so these are global rules under .landing, as prose.ts does
// for the markdown: the same tokens, in the sheet's layer _.k.
const l = ".landing";

css.global(
  l,
  css.maxWidth("1120px"),
  css.marginInline("auto"),
  css.padding(t.space._3xl, t.space.lg),
  css.display("flex"),
  css.flexDirection("column"),
  css.gap("clamp(48px, 10vw, 96px)"),
  css.lineHeight(t.lineHeight.relaxed),
);
css.global(`${l} section`, css.minWidth("0"));
css.global(`${l} h1, ${l} h2, ${l} h3`, css.margin("0"), css.lineHeight(t.lineHeight.tight));
css.global(`${l} h2`, css.fontSize(t.fontSize._2xl), css.letterSpacing("-0.01em"));
css.global(`${l} h3`, css.fontSize(t.fontSize.lg), css.fontWeight(t.fontWeight.semiBold));
css.global(`${l} p`, css.margin("0"), css.color(t.color.textMedium));
css.global(
  `${l} code`,
  css.fontFamily(mono),
  css.fontSize("0.875em"),
  css.bg(t.color.bgMuted),
  css.padding("0.15em 0.4em"),
  css.borderRadius(t.radius.xs),
);

// the hero: logo, pitch, install line and two ways in, on a glow of the accent
css.global(
  `${l} .hero`,
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.gap(t.space.lg),
  css.textAlign("center"),
  css.paddingBlock(t.space._2xl),
  css.backgroundImage(
    "radial-gradient(ellipse 60% 70% at 50% 0%, var(--color-accent-soft), transparent)",
  ),
);
css.global(
  `${l} .hero img`,
  css.borderRadius(t.radius.lg),
  css.boxShadow("0 8px 32px var(--color-shadow)"),
);
css.global(
  `${l} h1`,
  css.fontSize("clamp(32px, 7vw, 56px)"),
  css.fontWeight(t.fontWeight.bold),
  css.letterSpacing("-0.025em"),
  css.textWrap("balance"),
);
css.global(
  `${l} .lead`,
  css.maxWidth("40rem"),
  css.fontSize(t.fontSize.lg),
  css.color(t.color.textMedium),
  css.textWrap("balance"),
);
css.global(`${l} .install`, css.maxWidth("100%"), css.textAlign("left"));
css.global(`${l} .install pre`, css.paddingBlock(t.space.md), css.paddingInline(t.space.xl));

css.global(
  `${l} .actions`,
  css.display("flex"),
  css.flexWrap("wrap"),
  css.justifyContent("center"),
  css.gap(t.space.md),
);
css.global(
  `${l} .actions a`,
  css.padding(t.space.sm, t.space.xl),
  css.border(t.border.width, "solid", t.color.borderStrong),
  css.borderRadius(t.radius.md),
  css.bg(t.color.bgSubtle),
  css.color(t.color.text),
  css.fontWeight(t.fontWeight.semiBold),
  css.textDecoration("none"),
);
css.global(`${l} .actions a:hover`, css.borderColor(t.color.accent), css.bg(t.color.accentSoft));
css.global(
  `${l} .actions .primary`,
  css.bg(t.color.accent),
  css.borderColor(t.color.accent),
  css.color(t.color.onAccent),
);
css.global(`${l} .actions .primary:hover`, css.bg(t.color.accentStrong), css.color("white"));
css.global(
  `${l} a:focus-visible`,
  css.outline("2px solid", t.color.accent),
  css.outlineOffset("2px"),
);

// the showcase: the source on one side, what it compiled to on the other (stacked on a narrow screen)
css.global(
  `${l} .showcase`,
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.lg),
  css.textAlign("center"),
);
css.global(
  `${l} .panels`,
  css.display("grid"),
  css.gridTemplateColumns("minmax(0, 1fr)"),
  css.gap(t.space.lg),
  css.alignItems("start"),
  css.marginTop(t.space.md),
  css.textAlign("left"),
  gtSidebar(css.gridTemplateColumns("minmax(0, 1.2fr) minmax(0, 1fr)")),
);
css.global(
  `${l} .outputs`,
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.lg),
  css.minWidth("0"),
);
css.global(
  `${l} figure`,
  css.margin("0"),
  css.minWidth("0"),
  css.bg(t.color.bgSubtle),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.overflow("hidden"),
);
css.global(
  `${l} figcaption`,
  css.padding(t.space.sm, t.space.lg),
  css.bg(t.color.bgMuted),
  css.borderBottom(t.border.width, "solid", t.color.border),
  css.fontFamily(mono),
  css.fontSize(t.fontSize.xs),
  css.color(t.color.textMedium),
);
css.global(
  `${l} pre`,
  css.margin("0"),
  css.padding(t.space.lg),
  css.overflowX("auto"),
  css.bg(t.color.bgSubtle),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.fontFamily(mono),
  css.fontSize(t.fontSize.sm),
  css.lineHeight(t.lineHeight.relaxed),
  css.tabSize(2),
);
css.global(
  `${l} figure pre`,
  css.border("0", "none"),
  css.borderRadius("0"),
  css.bg("transparent"),
);
// the long class strings of the compiled module wrap instead of scrolling
css.global(`${l} .outputs pre`, css.whiteSpace("pre-wrap"), css.overflowWrap("anywhere"));
css.global(`${l} pre code`, css.bg("transparent"), css.padding("0"), css.fontSize("inherit"));

// the features: a card each, the link at its foot
css.global(
  `${l} .features`,
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.xl),
  css.textAlign("center"),
);
css.global(
  `${l} .features ul`,
  css.listStyle("none"),
  css.margin("0"),
  css.padding("0"),
  css.display("grid"),
  css.gridTemplateColumns("repeat(auto-fit, minmax(min(100%, 18rem), 1fr))"),
  css.gap(t.space.lg),
  css.textAlign("left"),
);
css.global(
  `${l} .features li`,
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.sm),
  css.padding(t.space.xl),
  css.bg(t.color.bgSubtle),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.transition("border-color 0.15s"),
);
css.global(`${l} .features li:hover`, css.borderColor(t.color.accent));
css.global(
  `${l} .features li a`,
  css.marginTop("auto"),
  css.paddingTop(t.space.sm),
  css.color(t.color.link),
  css.fontWeight(t.fontWeight.medium),
);
css.global(
  `${l} pre.error`,
  css.bg(t.color.errorSoft),
  css.borderColor(t.color.error),
  css.color(t.color.error),
  css.whiteSpace("pre-wrap"),
  css.padding(t.space.md),
  css.fontSize(t.fontSize.xs),
);
css.global(`${l} pre.error code`, css.color("inherit"));

css.global(
  `${l} .closing`,
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.gap(t.space.xl),
  css.paddingBlock(t.space._2xl),
  css.borderTop(t.border.width, "solid", t.color.border),
  css.textAlign("center"),
);
