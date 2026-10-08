import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ space: { $type: "dimension", sm: { $value: "8px" } } });

export const a = css.padding(css.var(t.space.sm, "red"));
