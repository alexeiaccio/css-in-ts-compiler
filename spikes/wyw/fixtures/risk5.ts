import { css, cx } from "cssints";

const pad = css.p(4);
const gap = css.gap(2);

export const folded = css.cn(pad, gap);
export const runtime = (on: boolean) => cx(css.p(4), on && css.m(2));
