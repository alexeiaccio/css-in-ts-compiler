import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  shadow: { $type: "shadow", bad: { $value: { color: "#000", offsetX: "0", offsetY: "1px" } } },
});
