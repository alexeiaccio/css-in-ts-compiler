import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  space: { $type: "dimension", md: { $value: "16px" } },
  time: { $type: "duration", fast: { $value: "100ms" } },
});

export const a = css.width(css.calc(t.space.md, "+", t.time.fast));
