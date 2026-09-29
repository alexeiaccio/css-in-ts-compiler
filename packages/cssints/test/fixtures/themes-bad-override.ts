import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ badval: { $type: "color", bg: { $value: "#fff" } } });
css.createGlobalTheme(t, ".x", { badval: { bg: "blu" } });
