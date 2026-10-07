import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  th: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    accent: { $value: "#2563eb" },
    link: { $value: "{th.accent}" },
    linkHover: { $value: "{th.link}" },
  },
  gap: { $type: "dimension", md: { $value: "16px" } },
});

// A media theme sets two tokens; a class theme sets the one the aliases follow, so they are declared again there.
const dark = css.media("(prefers-color-scheme: dark)");
css.createGlobalTheme(t, dark, { th: { bg: "#0b0b0f", fg: "#f3f4f6" } });
css.createGlobalTheme(t, ".light", {
  th: { accent: { colorSpace: "srgb", components: [0.1, 0.4, 0.9] } },
});
css.createGlobalTheme(t, css.container("card (width < 30rem)"), {
  gap: { md: { value: 8, unit: "px" } },
});
css.createGlobalTheme(t, "[data-tight]", { gap: { md: "4px" } });

export const box = cx(
  css.color(t.th.fg()),
  css.bg(t.th.bg()),
  css.padding(t.gap.md()),
  css.borderColor(t.th.linkHover()),
);
