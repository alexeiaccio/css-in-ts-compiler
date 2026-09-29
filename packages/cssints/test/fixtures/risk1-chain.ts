import { css } from "cssints" with { type: "cssints" };

const center = css.alignItems("center");

export const a = css.p(4);
export const b = css.flex().direction("column").wrap("wrap").alignItems("center").justifyContent("space-between");
export const c = css.flex().gap(2).rowGap("1rem");
export const d = css.cn(css.flex(), center, css.p(2));
