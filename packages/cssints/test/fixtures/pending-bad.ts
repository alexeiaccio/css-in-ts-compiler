import { css } from "cssints" with { type: "cssints" };

// Types see the var() as any value and red as a length-percentage, the build does too
export const a = css.padding("var(--a)", "red");
