import { css } from "cssints" with { type: "cssints" };

const pad = css.p(4);
const gap = css.gap(2);

export const folded = css.cn(pad, gap);
export const runtime = (on: boolean) => css.cn(css.p(4), on && css.m(2));
