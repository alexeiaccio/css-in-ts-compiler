import * as css from "cssints" with { type: "cssints" };

// The tokens of themes-tokens.ts written as values: under a $type a leaf is the value itself, as a theme's overrides take it.
// The names differ (`--bare-…`), so both files can be in one build: the sheet, with the names put back, is the same.
export const t = css.createTokens(
  {
    color: {
      $type: "color",
      bg: "#ffffff",
      fg: "#111827",
      accent: { $value: { colorSpace: "oklch", components: [0.62, 0.19, 259] } },
      link: "{color.accent}",
      linkHover: "{color.link}",
    },
    space: { $type: "dimension", md: "16px", sm: { $value: { value: 8, unit: "px" } } },
    motion: { fast: { $type: "duration", $value: { value: 150, unit: "ms" } } },
    font: { $type: "fontWeight", strong: "bold" },
  },
  (path) => `bare-${path.map((p) => p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)).join("-")}`,
);

export const box = css.cn(
  css.color(t.color.link),
  css.bg(t.color.bg),
  css.padding(t.space.md),
  css.transitionDuration(t.motion.fast),
  css.fontWeight(t.font.strong),
);
