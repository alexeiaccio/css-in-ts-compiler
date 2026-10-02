import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.textDecoration("underline dotted red"), css.textDecorationLine("line-through"));
export const ba = css.cn(css.textDecorationLine("line-through"), css.textDecoration("underline dotted red"));
