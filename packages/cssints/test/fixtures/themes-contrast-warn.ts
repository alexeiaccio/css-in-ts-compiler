import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  cwarn: {
    $type: "color",
    bg: { $value: "#ffffff" },
    mixed: { $value: "color-mix(in oklab, #000, #222 30%)" },
    glass: { $value: "rgb(0 0 0 / 50%)" },
    plain: { $value: "#000000" },
  },
});
css.createGlobalTheme(t, ".x", { cwarn: { plain: "currentColor" } });
css.check.contrast(t.cwarn.mixed, t.cwarn.bg, { min: 4.5 });
css.check.contrast(t.cwarn.glass, t.cwarn.bg, { min: 4.5 });
css.check.contrast(t.cwarn.plain, t.cwarn.bg, { min: 4.5 });
