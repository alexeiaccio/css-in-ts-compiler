import { css } from "cssints" with { type: "cssints" };

css.token.length("1px", "a");

// Types see the var() as any value and red as a length-percentage, the build does too
export const a = css.padding("var(--a)", "red");
