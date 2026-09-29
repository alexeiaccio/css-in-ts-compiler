import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };

export const blue = css.token.color("blue", "color-primary");
export const gap = css.token.length("16px", { var: "gap", inherit: false });
export const muted = css.token.color("#6b7280");

const md = css.media("(width >= 40rem)");

// In typed parts, a single-part property and a condition wrapper.
export const parts = css.border("1px solid", blue);
export const plain = css.cn(css.color(blue), css.gap(gap), css.color(muted));
export const wrapped = cx(css.p(2), md(css.color(blue)));
