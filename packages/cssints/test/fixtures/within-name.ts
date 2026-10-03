import * as css from "cssints" with { type: "cssints" };

export const bad = css.within(css.hover, "a b")(css.color("red"));
