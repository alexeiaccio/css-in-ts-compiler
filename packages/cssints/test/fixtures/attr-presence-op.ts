import * as css from "cssints" with { type: "cssints" };

export const bad = css.attr("a", undefined, "=")(css.color("red"));
