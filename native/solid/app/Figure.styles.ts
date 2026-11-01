// The Figure page's palette and styles, in a module of its own so the focus's roles are tokens of the same
// `createTokens` the rest of the native pages use. Every colour a figure draws is a role: `ink` for the data's text,
// `muted` for its source and its arrows, `accent` for a bar's fill, `line` for the empty part of a track, and
// `problem`/`good` for a focus's tone. `probe` is the same two roles as a style with nothing else in it, which
// solid/figure.test.ts reads in both themes: a focus style that followed a literal colour would not change with the
// theme, and the probe's would (the token assertion).
import * as css from "cssints/clay" with { type: "cssints" };

const DARK = {
  page: "rgb(16 19 22)",
  panel: "rgb(27 32 38)",
  ink: "rgb(230 233 236)",
  muted: "rgb(139 152 165)",
  accent: "rgb(59 156 240)",
  line: "rgb(45 51 61)",
  problem: "rgb(230 60 60)",
  good: "rgb(90 190 120)",
} as const;
const LIGHT = {
  page: "rgb(243 245 247)",
  panel: "rgb(255 255 255)",
  ink: "rgb(15 20 25)",
  muted: "rgb(86 99 111)",
  accent: "rgb(17 112 207)",
  line: "rgb(213 220 228)",
  problem: "rgb(190 30 40)",
  good: "rgb(20 130 70)",
} as const;

export const t = css.createTokens({
  color: {
    $type: "color",
    page: { $value: DARK.page },
    panel: { $value: DARK.panel },
    ink: { $value: DARK.ink },
    muted: { $value: DARK.muted },
    accent: { $value: DARK.accent },
    line: { $value: DARK.line },
    problem: { $value: DARK.problem },
    good: { $value: DARK.good },
  },
});
css.createGlobalTheme(t, "light", { color: { ...LIGHT } });
export const font = css.fonts("Roboto");

// the text roles: one style a paint, so a focus moves a row's colour and never its geometry (a style is a literal, so
// each is written out: cssints evaluates a `.styles.ts` module once and a helper's parameter is not a value it can fold)
const title = css.cn(
  font.Roboto,
  css.color(t.color.ink),
  css.fontSize(16),
  css.lineHeight(16),
  css.whiteSpace("nowrap"),
);
const muted = css.cn(
  font.Roboto,
  css.color(t.color.muted),
  css.fontSize(12),
  css.lineHeight(16),
  css.whiteSpace("nowrap"),
);
const ink = css.cn(
  font.Roboto,
  css.color(t.color.ink),
  css.fontSize(13),
  css.lineHeight(16),
  css.whiteSpace("nowrap"),
);
const problem = css.cn(
  font.Roboto,
  css.color(t.color.problem),
  css.fontSize(13),
  css.lineHeight(16),
  css.whiteSpace("nowrap"),
);
const good = css.cn(
  font.Roboto,
  css.color(t.color.good),
  css.fontSize(13),
  css.lineHeight(16),
  css.whiteSpace("nowrap"),
);

// the root: the window, the page's fill and the figure's two cells of side padding and one row above and below
const root = css.cn(
  css.width("stretch"),
  css.height("stretch"),
  css.p(16, 16),
  css.flexDirection("column"),
  css.bg(t.color.page),
);
// a line: one row of the cell grid, and no gap, so a line is 16px and a bar lands on a row
const line = css.cn(css.width("stretch"), css.height(16), css.flexDirection("row"));
// a cell: a box whose width the page writes (the layout's cells), and its text at the left of it
const cell = css.cn(css.height(16), css.flexDirection("row"), css.alignItems("center"));
// a flow's box: the panel's fill and one cell of left padding, so its label starts a cell in
const box = css.cn(cell, css.bg(t.color.panel), css.paddingLeft(8));
// a bar's track: the empty part of the scale, at the line role; its fill is a child, and its width is the value's
const track = css.cn(css.height(16), css.bg(t.color.line));
const fill = {
  plain: css.cn(css.height(16), css.bg(t.color.accent)),
  problem: css.cn(css.height(16), css.bg(t.color.problem)),
  good: css.cn(css.height(16), css.bg(t.color.good)),
};
const text = { title, muted, ink, problem, good };

// the token probe the invariant test reads: the two focus roles with nothing else, in both themes
export const probe = {
  problem: css.cn(css.color(t.color.problem)),
  good: css.cn(css.color(t.color.good)),
  ink: css.cn(css.color(t.color.ink)),
};

export const s = { t, font, root, line, cell, box, track, fill, text };
