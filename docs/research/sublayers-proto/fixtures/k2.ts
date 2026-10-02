import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
export const ab = css.cn(css.mask("linear-gradient(red, blue) no-repeat"), css.maskImage("linear-gradient(green, blue)"));
export const ba = css.cn(css.maskImage("linear-gradient(green, blue)"), css.mask("linear-gradient(red, blue) no-repeat"));
