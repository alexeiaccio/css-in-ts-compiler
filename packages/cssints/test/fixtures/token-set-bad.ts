import * as css from "cssints" with { type: "cssints" };

const blue = css.token.color("blue", "color-set-bad");
export const bad = css.token.set(blue, "1rem");
