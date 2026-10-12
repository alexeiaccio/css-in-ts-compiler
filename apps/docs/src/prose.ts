import {
  bg,
  border,
  borderBottom,
  borderCollapse,
  borderRadius,
  boxShadow,
  color,
  cursor,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  gap,
  global,
  height,
  justifyContent,
  lineHeight,
  margin,
  marginTop,
  maxHeight,
  maxWidth,
  media,
  opacity,
  outline,
  outlineOffset,
  overflow,
  overflowWrap,
  overflowX,
  padding,
  paddingBottom,
  paddingLeft,
  position,
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

// the panel of a page's example (plugin/markdown.ts): the tabs Result and Code are radio inputs, so they work without scripts (the
// input comes first, the label that shows it, then the panes that follow it); the Result is the sandboxed frame of the rendered
// project (plugin/examples.ts), the Code a file of the project, highlighted at build time, with a switcher when there are several
const e = `${p} .example`;
const files = [1, 2, 3, 4, 5, 6];
// one rule for each set of declarations, over the selectors that share it (a site that is not a call of global() would stay in the
// entry's code as a class string)
const pick = (i: number, state: string, rest: string) =>
  `${e} .pane-code > input:nth-of-type(${i}):${state} ~ ${rest}:nth-of-type(${i})`;
global(
  e,
  position("relative"),
  border(t.border.width, "solid", t.color.border),
  borderRadius(t.radius.md),
  overflow("hidden"),
);
global(
  `${e} > input, ${e} .pane-code > input`,
  position("absolute"),
  opacity("0"),
  width("1px"),
  height("1px"),
);
global(`${e} .pane-code, ${e} .pane-code > pre`, display("none"));
global(
  [`${e} > .tab-code:checked ~ .pane-code`, ...files.map((i) => pick(i, "checked", "pre"))].join(
    ", ",
  ),
  display("block"),
);
global(`${e} > .tab-code:checked ~ .pane-result`, display("none"));
global(`${e} > p > span`, display("flex"), gap(t.space.xs));
global(
  `${e} > p > span label, ${e} .pane-code > div label`,
  padding(t.space.xs, t.space.md),
  borderRadius(t.radius.sm),
  color(t.color.textMedium),
  cursor("pointer"),
);
global(`${e} > p > span label`, fontWeight(t.fontWeight.semiBold));
// an example that is only its code (the Install page's): the one label is the tab that is on
global(
  `${e}.code-only > p > span label`,
  bg(t.color.accentSoft),
  color(t.color.accentStrong),
  cursor("default"),
);
global(`${e} .pane-code > div label`, fontFamily(mono));
global(
  [
    `${e} > .tab-result:checked ~ p label:first-child`,
    `${e} > .tab-code:checked ~ p label:last-child`,
    ...files.map((i) => pick(i, "checked", "div label")),
  ].join(", "),
  bg(t.color.accentSoft),
  color(t.color.accentStrong),
);
global(
  [
    `${e} > .tab-result:focus-visible ~ p label:first-child`,
    `${e} > .tab-code:focus-visible ~ p label:last-child`,
    ...files.map((i) => pick(i, "focus-visible", "div label")),
  ].join(", "),
  outline("2px solid", t.color.accent),
  outlineOffset("1px"),
);
global(
  `${e} .pane-code > div`,
  display("flex"),
  gap(t.space.xs),
  padding(t.space.xs, t.space.md),
  borderBottom(t.border.width, "solid", t.color.border),
  fontSize(t.fontSize.sm),
);
global(
  `${e} pre`,
  margin("0"),
  padding(t.space.lg),
  maxHeight("18rem"),
  overflow("auto"),
  bg(t.color.bgSubtle),
  fontSize(t.fontSize.sm),
  lineHeight(t.lineHeight.relaxed),
  tabSize(2),
);
global(`${e} pre code`, bg("transparent"), padding("0"), fontSize("inherit"));
global(
  `${e} > p`,
  margin("0"),
  display("flex"),
  justifyContent("space-between"),
  padding(t.space.sm, t.space.md),
  bg(t.color.bgSubtle),
  borderBottom(t.border.width, "solid", t.color.border),
  fontSize(t.fontSize.sm),
);
global(
  `${e} iframe`,
  display("block"),
  width("100%"),
  height("18rem"),
  bg(t.color.bg),
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
