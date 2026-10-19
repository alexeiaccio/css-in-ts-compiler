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
