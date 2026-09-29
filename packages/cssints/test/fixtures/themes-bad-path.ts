import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ badpath: { $type: "color", bg: { $value: "#fff" } } });
css.createGlobalTheme(t, ".x", { badpath: { nope: "#000" } });
