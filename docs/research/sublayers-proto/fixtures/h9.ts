import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.hover(css.p("1rem")), css.focus(css.pl("2rem")));
export const ba = css.cn(css.focus(css.pl("2rem")), css.hover(css.p("1rem")));
