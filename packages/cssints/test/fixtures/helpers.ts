import * as css from "cssints" with { type: "cssints" };

// A local helper module: imported with the attribute, its functions run at build time.
export const stack = (gap: number) => css.flex().direction("column").gap(gap);
export const surface = (bg: string) => css.cn(css.bg(bg), css.p(4), css.borderRadius("0.5rem"));
