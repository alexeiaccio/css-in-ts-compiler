import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
export const ab = css.cn(css.borderBlock("1px solid red"), css.borderBlockEnd("3px dashed blue"));
export const ba = css.cn(css.borderBlockEnd("3px dashed blue"), css.borderBlock("1px solid red"));
