import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
export const ab = css.cn(css.hover(css.p("1rem")), md(css.pl("2rem")));
export const ba = css.cn(md(css.pl("2rem")), css.hover(css.p("1rem")));
