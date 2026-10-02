import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.hover(css.color("red")), css.hover(css.color("blue")));
export const ba = css.cn(css.hover(css.color("blue")), css.hover(css.color("red")));
