import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.border("1px solid red"), css.borderColor("green"));
export const ba = css.cn(css.borderColor("green"), css.border("1px solid red"));
