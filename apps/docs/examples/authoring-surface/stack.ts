import * as css from "cssints" with { type: "cssints" };

// Styles can live in a module of their own: import it with the attribute, as cssints itself.
export const stack = css.flex().direction("column").gap(3);
export const row = css.flex().alignItems("center").gap(3);
export const page = css.cn(css.flex().direction("column").gap(6), css.p(6));
