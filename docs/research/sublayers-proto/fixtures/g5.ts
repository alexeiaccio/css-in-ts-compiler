import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
const lg = css.media("(width >= 60rem)");
export const ab = css.cn(css.grid("auto-flow / 100px 200px"), css.gridTemplate("none / 10px 20px"));
export const ba = css.cn(css.gridTemplate("none / 10px 20px"), css.grid("auto-flow / 100px 200px"));
