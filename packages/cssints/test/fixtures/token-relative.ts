import * as css from "cssints" with { type: "cssints" };

export const gap = css.token.length("1rem", "gap-relative");
export const wide = css.token.length("calc(1.5rem + 2ch)", { var: "wide-relative", inherit: false });
export const box = css.cn(css.gap(gap), css.width(wide));
