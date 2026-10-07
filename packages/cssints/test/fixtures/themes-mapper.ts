import * as css from "cssints" with { type: "cssints" };

// A mapper names the variable of a path.
export const t = css.createTokens(
  { size: { $type: "dimension", small: { $value: "12px" }, large: { $value: "24px" } } },
  (path) => `ds-${path.join("-")}`,
);
export const box = css.fontSize(t.size.large);
