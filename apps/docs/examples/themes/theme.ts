import * as css from "cssints" with { type: "cssints" };

// Tokens from a DTCG-shaped object; every leaf is a token. {color.accent} is an alias.
export const t = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    accent: { $value: "oklch(62% 0.19 259)" },
    link: { $value: "{color.accent}" },
    hover: { $value: "color-mix(in oklab, {color.accent}, black 15%)" },
  },
  space: { $type: "dimension", md: { $value: "16px" } },
});

// a theme sets tokens again: under a condition, or under a selector
css.createGlobalTheme(t, css.media("(prefers-color-scheme: dark)"), {
  color: { bg: "#0b0b0f", fg: "#f3f4f6" },
});
css.createGlobalTheme(t, ".brand", { color: { accent: "#db2777" } });
css.createGlobalTheme(t, ".light", { color: { bg: "#ffffff", fg: "#111827" } });

css.check.contrast(t.color.fg, t.color.bg, { min: 4.5 });
