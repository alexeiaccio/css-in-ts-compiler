import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  space: { $type: "dimension", md: { $value: "16px" } },
});

export const a = css.color(css.oklch(0.7, 0.1, 200, "/", "banana"));
