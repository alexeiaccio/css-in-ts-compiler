import { css } from "cssints" with { type: "cssints" };

// Valid by the grammar. The first is a support warning for the default targets, the second breaks a prose rule.
export const a = css.textTransform("full-width");
export const b = css.transition("none, opacity 1s");
