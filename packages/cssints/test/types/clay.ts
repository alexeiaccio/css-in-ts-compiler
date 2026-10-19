// What the types of cssints/clay accept and reject (`@ts-expect-error` marks what must fail).
import * as css from "cssints/clay";

export const ok = css.cn(
  css.width(200),
  css.height("50%"),
  css.width("stretch"),
  css.p(4, "8px"),
  css.bg("oklch(0.7 0.15 50)"),
  css.border(1, "red"),
  css.flexDirection("column"),
  css.color("#fff"),
);
// @ts-expect-error a CSS length other than px
css.width("10rem");
// @ts-expect-error not a colour
css.bg("blu");
// @ts-expect-error Clay has no space-between
css.justifyContent("space-between");
// @ts-expect-error no such member: Clay draws no shadow
css.boxShadow("0 0 1px red");
// @ts-expect-error cn() takes styles only
css.cn("x");

const t = css.createTokens({ color: { $type: "color", bg: { $value: "#000" } } });
css.createGlobalTheme(t, "light", { color: { bg: "#fff" } });
// @ts-expect-error no token at this path
css.createGlobalTheme(t, "light", { color: { fg: "#fff" } });
// @ts-expect-error not a colour
css.createGlobalTheme(t, "light", { color: { bg: "blu" } });
const font = css.fonts("Roboto", "Mono");
export const states = css.cn(
  font.Mono,
  css.bg(t.color.bg),
  css.hover(css.bg("red")),
  css.active(css.p(2)),
  css.focus(css.border(1, "blue")),
);
// @ts-expect-error a font the list does not declare
css.cn(font.Serif);
// @ts-expect-error a state takes styles
css.hover("red");
// @ts-expect-error fonts() takes at least one name
css.fonts();
