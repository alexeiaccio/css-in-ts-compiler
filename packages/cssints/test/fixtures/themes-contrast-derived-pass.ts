import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  cdp: {
    bg: { $type: "color", $value: "#ffffff" },
    l: { $type: "number", $value: 0.2 },
    k: { $type: "number", $value: 0.05 },
    fg: { $type: "color", $value: "oklch({cdp.l} 0 0)" },
  },
});
css.createGlobalTheme(t, ".x", { cdp: { l: 0.1 } });
css.createGlobalTheme(t, ".z", { cdp: { l: "{cdp.k}" } });
css.check.contrast(t.cdp.fg(), t.cdp.bg(), { min: 4.5 });
