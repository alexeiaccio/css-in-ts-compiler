import * as css from "cssints/clay" with { type: "cssints" };

export const pill = css.cn(
  css.width(200),
  css.height("38px"),
  css.justifyContent("center"),
  css.alignItems("center"),
  css.bg("rgb(36 40 52)"),
  css.borderRadius(19),
  css.border(1, "#969baa"),
);
export const page = css.cn(
  css.width("stretch"),
  css.height("100%"),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.justifyContent("flex-start"),
  css.p(64, 24, 0),
  css.gap(6),
  css.overflow("hidden"),
);
export const label = css.cn(
  css.color("oklch(0.7 0.15 50 / 50%)"),
  css.fontSize(14),
  css.textAlign("center"),
  css.whiteSpace("nowrap"),
);
