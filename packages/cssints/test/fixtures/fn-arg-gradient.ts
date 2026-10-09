import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  space: { $type: "dimension", md: { $value: "16px" } },
});

export const a = css.color(css.linearGradient("red", "blue", "banana 50%", "green"));
