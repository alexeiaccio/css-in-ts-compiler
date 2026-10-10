import {
  alignItems,
  backgroundImage,
  bg,
  border,
  borderBottom,
  borderColor,
  borderRadius,
  borderTop,
  boxShadow,
  color,
  display,
  flexDirection,
  flexWrap,
  fontFamily,
  fontSize,
  fontWeight,
  gap,
  global,
  gridTemplateColumns,
  justifyContent,
  letterSpacing,
  lineHeight,
  listStyle,
  margin,
  marginInline,
  marginTop,
  maxWidth,
  minWidth,
  outline,
  outlineOffset,
  overflow,
  overflowWrap,
  overflowX,
  padding,
  paddingBlock,
  paddingInline,
  paddingTop,
  tabSize,
  textAlign,
  textDecoration,
  textWrap,
  transition,
  whiteSpace,
} from "cssints" with { type: "cssints" };

import { gtSidebar } from "./layout.ts" with { type: "cssints" };
import { mono } from "./prose.ts" with { type: "cssints" };
import { t } from "./theme.ts" with { type: "cssints" };

// The landing page is html made at build time (plugin/landing.ts), so these are global rules under .landing, as prose.ts does
// for the markdown: the same tokens, in the sheet's layer _.k.
const l = ".landing";

global(
  l,
  maxWidth("1120px"),
  marginInline("auto"),
  padding(t.space._3xl, t.space.lg),
  display("flex"),
  flexDirection("column"),
  gap("clamp(48px, 10vw, 96px)"),
  lineHeight(t.lineHeight.relaxed),
);
global(`${l} section`, minWidth("0"));
global(`${l} h1, ${l} h2, ${l} h3`, margin("0"), lineHeight(t.lineHeight.tight));
global(`${l} h2`, fontSize(t.fontSize._2xl), letterSpacing("-0.01em"));
global(`${l} h3`, fontSize(t.fontSize.lg), fontWeight(t.fontWeight.semiBold));
global(`${l} p`, margin("0"), color(t.color.textMedium));
global(
  `${l} code`,
  fontFamily(mono),
  fontSize("0.875em"),
  bg(t.color.bgMuted),
  padding("0.15em 0.4em"),
  borderRadius(t.radius.xs),
);

// the hero: logo, pitch, install line and two ways in, on a glow of the accent
global(
  `${l} .hero`,
  display("flex"),
  flexDirection("column"),
  alignItems("center"),
  gap(t.space.lg),
  textAlign("center"),
  paddingBlock(t.space._2xl),
  backgroundImage(
    "radial-gradient(ellipse 60% 70% at 50% 0%, var(--color-accent-soft), transparent)",
  ),
);
global(`${l} .hero img`, borderRadius(t.radius.lg), boxShadow("0 8px 32px var(--color-shadow)"));
global(
  `${l} h1`,
  fontSize("clamp(32px, 7vw, 56px)"),
  fontWeight(t.fontWeight.bold),
  letterSpacing("-0.025em"),
  textWrap("balance"),
);
global(
  `${l} .lead`,
  maxWidth("40rem"),
  fontSize(t.fontSize.lg),
  color(t.color.textMedium),
  textWrap("balance"),
);
global(`${l} .install`, maxWidth("100%"), textAlign("left"));
global(`${l} .install pre`, paddingBlock(t.space.md), paddingInline(t.space.xl));

global(
  `${l} .actions`,
  display("flex"),
  flexWrap("wrap"),
  justifyContent("center"),
  gap(t.space.md),
);
global(
  `${l} .actions a`,
  padding(t.space.sm, t.space.xl),
  border(t.border.width, "solid", t.color.borderStrong),
  borderRadius(t.radius.md),
  bg(t.color.bgSubtle),
  color(t.color.text),
  fontWeight(t.fontWeight.semiBold),
  textDecoration("none"),
);
global(`${l} .actions a:hover`, borderColor(t.color.accent), bg(t.color.accentSoft));
global(
  `${l} .actions .primary`,
  bg(t.color.accent),
  borderColor(t.color.accent),
  color(t.color.onAccent),
);
global(`${l} .actions .primary:hover`, bg(t.color.accentStrong), color("white"));
global(`${l} a:focus-visible`, outline("2px solid", t.color.accent), outlineOffset("2px"));

// the showcase: the source on one side, what it compiled to on the other (stacked on a narrow screen)
global(
  `${l} .showcase`,
  display("flex"),
  flexDirection("column"),
  gap(t.space.lg),
  textAlign("center"),
);
global(
  `${l} .panels`,
  display("grid"),
  gridTemplateColumns("minmax(0, 1fr)"),
  gap(t.space.lg),
  alignItems("start"),
  marginTop(t.space.md),
  textAlign("left"),
  gtSidebar(gridTemplateColumns("minmax(0, 1.2fr) minmax(0, 1fr)")),
);
global(`${l} .outputs`, display("flex"), flexDirection("column"), gap(t.space.lg), minWidth("0"));
global(
  `${l} figure`,
  margin("0"),
  minWidth("0"),
  bg(t.color.bgSubtle),
  border(t.border.width, "solid", t.color.border),
  borderRadius(t.radius.lg),
  overflow("hidden"),
);
global(
  `${l} figcaption`,
  padding(t.space.sm, t.space.lg),
  bg(t.color.bgMuted),
  borderBottom(t.border.width, "solid", t.color.border),
  fontFamily(mono),
  fontSize(t.fontSize.xs),
  color(t.color.textMedium),
);
global(
  `${l} pre`,
  margin("0"),
  padding(t.space.lg),
  overflowX("auto"),
  bg(t.color.bgSubtle),
  border(t.border.width, "solid", t.color.border),
  borderRadius(t.radius.md),
  fontFamily(mono),
  fontSize(t.fontSize.sm),
  lineHeight(t.lineHeight.relaxed),
  tabSize(2),
);
global(`${l} figure pre`, border("0", "none"), borderRadius("0"), bg("transparent"));
// the long class strings of the compiled module wrap instead of scrolling
global(`${l} .outputs pre`, whiteSpace("pre-wrap"), overflowWrap("anywhere"));
global(`${l} pre code`, bg("transparent"), padding("0"), fontSize("inherit"));

// the features: a card each, the link at its foot
global(
  `${l} .features`,
  display("flex"),
  flexDirection("column"),
  gap(t.space.xl),
  textAlign("center"),
);
global(
  `${l} .features ul`,
  listStyle("none"),
  margin("0"),
  padding("0"),
  display("grid"),
  gridTemplateColumns("repeat(auto-fit, minmax(min(100%, 18rem), 1fr))"),
  gap(t.space.lg),
  textAlign("left"),
);
global(
  `${l} .features li`,
  display("flex"),
  flexDirection("column"),
  gap(t.space.sm),
  padding(t.space.xl),
  bg(t.color.bgSubtle),
  border(t.border.width, "solid", t.color.border),
  borderRadius(t.radius.lg),
  transition("border-color 0.15s"),
);
global(`${l} .features li:hover`, borderColor(t.color.accent));
global(
  `${l} .features li a`,
  marginTop("auto"),
  paddingTop(t.space.sm),
  color(t.color.link),
  fontWeight(t.fontWeight.medium),
);
global(
  `${l} pre.error`,
  bg(t.color.errorSoft),
  borderColor(t.color.error),
  color(t.color.error),
  whiteSpace("pre-wrap"),
  padding(t.space.md),
  fontSize(t.fontSize.xs),
);
global(`${l} pre.error code`, color("inherit"));

global(
  `${l} .closing`,
  display("flex"),
  flexDirection("column"),
  alignItems("center"),
  gap(t.space.xl),
  paddingBlock(t.space._2xl),
  borderTop(t.border.width, "solid", t.color.border),
  textAlign("center"),
);
