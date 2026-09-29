import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  color: { $type: "color", a: { $value: "{color.b}" }, b: { $value: "{color.c}" }, c: { $value: "{color.a}" } },
});
