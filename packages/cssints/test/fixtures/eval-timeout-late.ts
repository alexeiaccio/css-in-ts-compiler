import * as css from "cssints" with { type: "cssints" };

// imported after the wait: loaded only if the evaluation that timed out goes on
export const late = css.token.color("red", "color-late");
