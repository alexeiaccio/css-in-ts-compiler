import * as css from "cssints" with { type: "cssints" };

export const gap = css.token.length("1rem", "gap-misuse");
// a length where a colour goes
export const bad = css.color(gap);
