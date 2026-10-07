import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  cpass: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    accent: { $value: "oklch(45% 0.19 259)" },
    link: { $value: "{cpass.accent}" },
  },
});
css.createGlobalTheme(t, css.media("(prefers-color-scheme: dark)"), {
  cpass: { bg: "#0b0b0f", fg: "#f3f4f6", accent: "oklch(80% 0.12 259)" },
});
// the theme comes after the checks that it affects
css.check.contrast(t.cpass.fg(), t.cpass.bg(), { min: 7 });
css.check.contrast(t.cpass.link(), t.cpass.bg(), { min: 4.5 });
