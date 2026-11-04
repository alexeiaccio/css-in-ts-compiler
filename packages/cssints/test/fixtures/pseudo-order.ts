import * as css from "cssints" with { type: "cssints" };

// A pseudo-element is the innermost condition: `.k:hover::before`, never `.k::before:hover`.
export const wrong = css.cn(css.before(css.hover(css.bg("#eee"))));
