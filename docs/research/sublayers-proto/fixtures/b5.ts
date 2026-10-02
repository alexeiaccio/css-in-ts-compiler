import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.borderInline("1px solid red"), css.borderInlineStart("3px dashed blue"));
export const ba = css.cn(css.borderInlineStart("3px dashed blue"), css.borderInline("1px solid red"));
