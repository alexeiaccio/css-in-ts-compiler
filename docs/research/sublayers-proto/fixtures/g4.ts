import * as css from "cssints" with { type: "cssints" };
const md = css.media("(width >= 40rem)");
export const ab = css.cn(css.gridArea("1 / 2 / 3 / 4"), css.gridRow("5 / 6"), css.gridRowStart("7"));
export const ba = css.cn(css.gridRowStart("7"), css.gridRow("5 / 6"), css.gridArea("1 / 2 / 3 / 4"));
