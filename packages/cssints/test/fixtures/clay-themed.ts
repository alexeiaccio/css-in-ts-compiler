import * as css from "cssints/clay" with { type: "cssints" };

// the tokens and the theme first: a style sees the themes declared before it
export const t = css.createTokens({
  color: { $type: "color", bg: { $value: "rgb(36 40 52)" }, ink: { $value: "#fff" } },
});
css.createGlobalTheme(t, "light", { color: { bg: "rgb(240 240 245)", ink: "black" } });

export const font = css.fonts("Roboto", "Mono");

export const button = css.cn(
  css.flexDirection("column"),
  css.width(200),
  css.bg(t.color.bg),
  css.p(4),
  css.hover(css.borderColor("red"), css.pt(8)),
  css.active(css.bg(t.color.ink), css.justifyContent("center")),
);
export const label = css.cn(font.Mono, css.color(t.color.ink), css.fontSize(14));
export const plain = css.cn(css.height(10), css.overflow("visible"));
