import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ uncc: { $type: "color", bg: { $value: "#fff" }, fg: { $value: "#000" } } });
css.check.contrast(t.uncc.fg, t.uncc.bg(), { min: 4.5 });
