import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.hover(css.pl("1rem")), css.p("0.5rem"));
export const ba = css.cn(css.p("0.5rem"), css.hover(css.pl("1rem")));
