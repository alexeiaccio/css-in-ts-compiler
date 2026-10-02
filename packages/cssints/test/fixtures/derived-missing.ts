import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  color: { $type: "color", hover: { $value: "color-mix(in oklab, {color.nope}, black 15%)" } },
});
