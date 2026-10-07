import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ unc: { $type: "color", bg: { $value: "#fff" } } });
export const a = css.color(t.unc.bg());
export const b = css.color(t.unc.bg);
