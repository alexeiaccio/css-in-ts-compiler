import * as css from "cssints" with { type: "cssints" };

export const bad = css.within(css.media("(width >= 40rem)"))(css.color("red"));
