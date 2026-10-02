import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(md(css.pl("0.5rem")), lg(css.p("1rem")));
export const ba = css.cn(lg(css.p("1rem")), md(css.pl("0.5rem")));
