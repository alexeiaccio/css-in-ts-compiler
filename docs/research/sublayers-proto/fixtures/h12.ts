import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(lg(css.pl("0.5rem")), md(css.p("1rem")));
export const ba = css.cn(md(css.p("1rem")), lg(css.pl("0.5rem")));
