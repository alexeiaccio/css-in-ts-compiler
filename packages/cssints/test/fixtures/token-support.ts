import * as css from "cssints" with { type: "cssints" };

// oklch() in every place a token value comes from; the targets of the test lack it (token-support.mjs)
export const named = css.token.color("oklch(0.62 0.19 259)", "ts-named");
export const priv = css.token.color("oklch(0.5 0.1 20)");
export const t = css.createTokens({
  ts: {
    $type: "color",
    accent: { $value: { colorSpace: "oklch", components: [0.62, 0.19, 259] } },
    plain: { $value: "#2563eb" },
    twice: { $value: "#fff" },
  },
});
// a theme value is a custom property of the sheet, which LightningCSS lowers for the targets: no warning for these two
css.createGlobalTheme(t, ".brand", { ts: { plain: "oklch(0.7 0.1 30)" } });
// two oklch() in one value: one warning
css.createGlobalTheme(t, ".mix", { ts: { twice: "light-dark(oklch(0.9 0 0), oklch(0.2 0 0))" } });
// ... but not with a var() inside (a reference): LightningCSS leaves oklch(from ...) alone
css.createGlobalTheme(t, ".rel", { ts: { twice: "oklch(from {ts.plain} l c h)" } });
export const set = css.token.set(named, "oklch(0.7 0.1 30)");
