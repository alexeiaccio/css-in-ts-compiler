import {
  bg,
  border,
  borderBottom,
  borderCollapse,
  borderRadius,
  boxShadow,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  global,
  height,
  justifyContent,
  lineHeight,
  margin,
  marginTop,
  maxWidth,
  media,
  overflow,
  overflowWrap,
  overflowX,
  padding,
  paddingBottom,
  paddingLeft,
  resize,
  tabSize,
  textAlign,
  textDecoration,
  textDecorationThickness,
  textUnderlineOffset,
  transform,
  verticalAlign,
  whiteSpace,
  width,
} from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// The markdown pages are HTML strings made at build time, so their elements have no classes: these are global rules under
// .prose (layer _.k, below every class) that read the same tokens as the components.
export const sans =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const serif = 'Georgia, Cambria, "Times New Roman", Times, serif';
export const mono = '"SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const p = ".prose";

global(
  p,
  fontSize(t.fontSize.md),
  lineHeight(t.lineHeight.relaxed),
  color(t.color.text),
  overflowWrap("break-word"),
);
global(`${p} > *`, margin("0"));
global("h1 code", fontFamily(mono), fontSize("0.8em"), fontWeight(600));
global(`${p} > * + *`, marginTop(t.space.lg));

global(
  `${p} h2, ${p} h3, ${p} h4`,
  lineHeight(t.lineHeight.tight),
  fontWeight(t.fontWeight.semiBold),
);
global(`${p} > * + h2`, marginTop(t.space._3xl));
global(`${p} > * + h3, ${p} > * + h4`, marginTop(t.space.xl));
global(
  `${p} h2`,
  fontSize(t.fontSize.xl),
  paddingBottom(t.space.sm),
  borderBottom(t.border.width, "solid", t.color.border),
);
global(`${p} h3`, fontSize(t.fontSize.lg));
global(`${p} h4`, fontSize(t.fontSize.md));
global(`${p} strong`, fontWeight(t.fontWeight.semiBold));

global(
  `${p} a`,
  color(t.color.link),
  textDecoration("underline"),
  textDecorationThickness("1px"),
  textUnderlineOffset("0.2em"),
);
global(`${p} a:hover`, textDecorationThickness("2px"));

global(`${p} ul, ${p} ol`, paddingLeft(t.space.xl));
global(`${p} li + li`, marginTop(t.space.sm));
global(`${p} li > p`, margin("0"));
global(`${p} li > * + *`, marginTop(t.space.sm));
// the outline links to a term; the one that is open shows
global(
  `${p} li:target`,
  bg(t.color.accentSoft),
  borderRadius(t.radius.sm),
  boxShadow("0 0 0 6px var(--color-accent-soft)"),
);

global(
  `${p} code`,
  fontFamily(mono),
  fontSize("0.875em"),
  bg(t.color.bgMuted),
  padding("0.15em 0.4em"),
  borderRadius(t.radius.xs),
);
global(
  `${p} > pre`,
  bg(t.color.bgSubtle),
  border(t.border.width, "solid", t.color.border),
  borderRadius(t.radius.md),
  padding(t.space.lg),
  overflowX("auto"),
  fontSize(t.fontSize.sm),
  lineHeight(t.lineHeight.relaxed),
  tabSize(2),
);
global(`${p} > pre code`, bg("transparent"), padding("0"), fontSize("inherit"));

// the result of a page's example (plugin/examples.ts): its link, and the sandboxed frame of the rendered project
global(
  `${p} .example`,
  border(t.border.width, "solid", t.color.border),
  borderRadius(t.radius.md),
  overflow("hidden"),
);
global(
  `${p} .example > p`,
  margin("0"),
  display("flex"),
  justifyContent("space-between"),
  padding(t.space.sm, t.space.md),
  bg(t.color.bgSubtle),
  borderBottom(t.border.width, "solid", t.color.border),
  fontSize(t.fontSize.sm),
);
global(`${p} .example > p > span`, color(t.color.textMedium), fontWeight(t.fontWeight.semiBold));
global(
  `${p} .example iframe`,
  display("block"),
  width("100%"),
  height("18rem"),
  bg("white"),
  border("0", "none"),
  resize("vertical"),
);

global(`${p} table`, borderCollapse("collapse"), display("block"), overflowX("auto"));
global(
  `${p} th, ${p} td`,
  padding(t.space.sm, t.space.md),
  borderBottom(t.border.width, "solid", t.color.border),
  textAlign("left"),
  verticalAlign("top"),
);
global(`${p} th`, fontWeight(t.fontWeight.semiBold), color(t.color.textMedium));

// Shiki's dual themes: every token carries both colours as variables, and the mode picks one
global("[style*='--shiki-light']", color("var(--shiki-light)"));
global(":root.dark [style*='--shiki-light']", color("var(--shiki-dark)"));
global(
  ":root:not(.light) [style*='--shiki-light']",
  media("(prefers-color-scheme: dark)")(color("var(--shiki-dark)")),
);

// twoslash: the popups are placed by hovers.ts; the arrow would point at the wrong place
global(
  ".twoslash .twoslash-popup-container",
  transform("none"),
  fontFamily(mono),
  fontSize(t.fontSize.sm),
  maxWidth("min(90vw, 60rem)"),
  boxShadow("0 8px 24px var(--color-shadow)"),
  whiteSpace("pre-wrap"),
);
global(".twoslash .twoslash-popup-arrow", display("none"));
global(".twoslash .twoslash-popup-docs, .twoslash .twoslash-popup-error", fontFamily(sans));
global(".twoslash .twoslash-popup-code", bg("transparent"), fontSize("inherit"));
