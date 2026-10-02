import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
export const ab = css.cn(css.mask("linear-gradient(red, blue) no-repeat"), css.maskBorder("linear-gradient(red, blue) 30 / 10px"));
export const ba = css.cn(css.maskBorder("linear-gradient(red, blue) 30 / 10px"), css.mask("linear-gradient(red, blue) no-repeat"));
