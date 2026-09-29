import * as css from "cssints" with { type: "cssints" };

// same name and initial value as tokens-clash-a.ts, but it does not inherit
export const c = css.token.color("red", { var: "color-clash", inherit: false });
