import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.borderTop("3px dashed blue"), css.borderColor("green"));
export const ba = css.cn(css.borderColor("green"), css.borderTop("3px dashed blue"));
