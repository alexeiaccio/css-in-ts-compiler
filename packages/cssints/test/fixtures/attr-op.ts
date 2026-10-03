import * as css from "cssints" with { type: "cssints" };

export const bad = css.attr("a", "x", "!=")(css.color("red"));
