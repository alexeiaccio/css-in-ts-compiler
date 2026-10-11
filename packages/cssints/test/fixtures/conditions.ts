import * as css from "cssints" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
const [tablet, wide] = css.media("(width >= 40rem)", "(width >= 60rem)");
const { lg } = css.media({ md: "(width >= 40rem)", lg: "(width >= 60rem)" });
const narrow = css.container("sidebar (width < 30rem)");
const grid = css.supports("(display: grid)");

// Nesting: hover inside md is two conditions, layer _.c.
export const nested = css.cn(
  css.p(2),
  md(css.pl("8ch"), css.pt(4)),
  css.hover(css.bg("#eee")),
  md(css.hover(css.bg("#ddd"))),
  lg(css.p(8)),
);
export const forms = css.cn(tablet(css.p(1)), wide(css.p(3)), narrow(css.m(0)), grid(css.display("grid")));
