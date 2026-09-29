import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  color: { $type: "color", brand: { $value: "#2563eb" } },
  space: { $type: "dimension", gap: { $value: "{color.brand}" } },
});
