import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
export const ab = css.cn(css.border("1px solid red"), css.borderInline("3px dashed blue"), css.borderColor("green"), css.borderInlineStartColor("orange"));
export const ba = css.cn(css.borderInlineStartColor("orange"), css.borderColor("green"), css.borderInline("3px dashed blue"), css.border("1px solid red"));
