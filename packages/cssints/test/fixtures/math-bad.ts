import { css } from "cssints" with { type: "cssints" };

// Types accept a math function's inside as balanced tokens; the twin checks the calc type at build time.
export const a = css.width("calc(1px + 2s)");
