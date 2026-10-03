import * as css from "cssints" with { type: "cssints" };

// a plain token, one that does not inherit, and a private one: oklch() is not parsed by every target (token-fallback.mjs)
export const named = css.token.color("oklch(0.62 0.19 259)", "tf-named");
export const flat = css.token.color("oklch(0.5 0.1 20)", { var: "tf-flat", inherit: false });
export const priv = css.token.color("oklch(0.5 0.1 20)");

export const t = css.createTokens({
  tf: {
    hue: { $type: "number", $value: 345 },
    color: {
      $type: "color",
      bg: { $value: "#ffffff" },
      // derived: its live value holds var(), which LightningCSS cannot lower
      accent: { $value: "oklch(0.6 0.2 {tf.hue})" },
      // an alias stays live: it needs no feature of its own
      link: { $value: "{tf.color.accent}" },
      // a literal that LightningCSS lowers
      brand: { $value: "oklch(0.7 0.1 30)" },
      // relative colour of the accent, which the runtime for older targets computes (token-fallback.mjs); a mix in a polar space it does not
      onAccent: {
        $value:
          "lab(from color(from {tf.color.accent} srgb-linear clamp(0, r, 1) clamp(0, g, 1) clamp(0, b, 1)) clamp(0, (49.4 - l) * 1e6, 100) 0 0)",
      },
      mixed: { $value: "color-mix(in oklch, {tf.color.accent}, black)" },
    },
  },
});
css.createGlobalTheme(t, ".dim", {
  tf: { color: { bg: "#111111", accent: "oklch(0.7 0.1 {tf.hue})", brand: "oklch(0.8 0.1 30)" } },
});
// a theme that sets a derived token to a literal: the runtime has to let go of it
css.createGlobalTheme(t, ".hc", { tf: { color: { accent: "#ff0000" } } });
