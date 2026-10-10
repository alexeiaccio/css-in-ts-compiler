import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };

const wide = css.media("(width >= 40rem)");

const base: Style = css.cn(
  css.flex().alignItems("center").gap(2),
  css.p(3),
  css.bg("rebeccapurple"),
  css.color("white"),
  css.hover(css.bg("#3178c6")),
);

export const button = css.cv({ base, variants: { size: { lg: wide(css.p(5)) } } });
