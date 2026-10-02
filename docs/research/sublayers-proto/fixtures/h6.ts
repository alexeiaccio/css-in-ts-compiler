import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
export const ab = css.cn(md(css.hover(css.p("1rem"))), md(css.pl("2rem")));
export const ba = css.cn(md(css.pl("2rem")), md(css.hover(css.p("1rem"))));
