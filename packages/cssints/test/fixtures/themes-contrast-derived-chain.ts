import * as css from "cssints" with { type: "cssints" };

// fg is derived from l, which is derived from d: the theme sets the last link of the chain
const t = css.createTokens({
  cdc: {
    bg: { $type: "color", $value: "#ffffff" },
    d: { $type: "number", $value: 2 },
    l: { $type: "number", $value: "0.{cdc.d}" },
    fg: { $type: "color", $value: "oklch({cdc.l} 0 0)" },
  },
});
css.createGlobalTheme(t, ".x", { cdc: { d: 9 } });
css.check.contrast(t.cdc.fg, t.cdc.bg, { min: 4.5 });
