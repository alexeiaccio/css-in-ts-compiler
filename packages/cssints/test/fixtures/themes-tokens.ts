import * as css from "cssints" with { type: "cssints" };

// $type is inherited through groups; a leaf may set its own. link and hover are aliases.
export const t = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    accent: { $value: { colorSpace: "oklch", components: [0.62, 0.19, 259] } },
    link: { $value: "{color.accent}" },
    linkHover: { $value: "{color.link}" },
  },
  space: { $type: "dimension", md: { $value: "16px" }, sm: { $value: { value: 8, unit: "px" } } },
  motion: { fast: { $type: "duration", $value: { value: 150, unit: "ms" } } },
  font: { $type: "fontWeight", strong: { $value: "bold" } },
});

export const box = css.cn(
  css.color(t.color.link()),
  css.bg(t.color.bg()),
  css.padding(t.space.md()),
  css.transitionDuration(t.motion.fast()),
  css.fontWeight(t.font.strong()),
);
