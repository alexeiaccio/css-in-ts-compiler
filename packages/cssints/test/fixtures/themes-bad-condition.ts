import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ badcond: { $type: "color", bg: { $value: "#fff" } } });
css.createGlobalTheme(t, css.hover, { badcond: { bg: "#000" } });
