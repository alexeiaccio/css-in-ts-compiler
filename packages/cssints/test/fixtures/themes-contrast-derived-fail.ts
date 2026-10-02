import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  cdf: {
    bg: { $type: "color", $value: "#ffffff" },
    l: { $type: "number", $value: 0.2 },
    hi: { $type: "number", $value: 0.9 },
    fg: { $type: "color", $value: "oklch({cdf.l} 0 0)" },
  },
});
css.createGlobalTheme(t, ".x", { cdf: { l: 0.95 } });
css.createGlobalTheme(t, ".y", { cdf: { l: "{cdf.hi}" } });
css.check.contrast(t.cdf.fg, t.cdf.bg, { min: 4.5 });
