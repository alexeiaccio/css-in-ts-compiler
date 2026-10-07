import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({ dg: { $type: "dimension", "2xs": { $value: "2px" }, x: { $value: "{dg.2xs}" } } });
export const a = css.gap(t.dg._2xs);
css.createGlobalTheme(t, ".dg", { dg: { _2xs: "3px" } });
