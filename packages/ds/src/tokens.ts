/**
 * The DS's token data, kept apart from the theme so a build-time generator can read it without the cssints plugin: the
 * semantic colours, the spacing steps, the radii and the type scale.
 */
export const lightTokens = {
  color: {
    $type: "color",
    page: { $value: "oklch(0.985 0 0)" },
    surface: { $value: "oklch(1 0 0)" },
    text: { $value: "oklch(0.24 0 0)" },
    muted: { $value: "oklch(0.48 0 0)" },
    line: { $value: "oklch(0.87 0 0)" },
    accent: { $value: "oklch(0.5 0.16 262)" },
    onAccent: { $value: "oklch(0.99 0 0)" },
    danger: { $value: "oklch(0.48 0.18 27)" },
    focusRing: { $value: "oklch(0.5 0.16 262)" },
  },
  space: {
    $type: "dimension",
    xs: { $value: "2px" },
    sm: { $value: "4px" },
    md: { $value: "8px" },
    lg: { $value: "12px" },
    xl: { $value: "16px" },
  },
  radius: {
    $type: "dimension",
    sm: { $value: "4px" },
    md: { $value: "8px" },
    pill: { $value: "999px" },
  },
  font: {
    $type: "dimension",
    sizeSm: { $value: "0.8125rem" },
    size: { $value: "0.9375rem" },
    sizeLg: { $value: "1.125rem" },
  },
  line: { $type: "number", height: { $value: "1.5" } },
};

/**
 * The dark mode: the same names with the text light and the page dark, and the accent one step lighter, so a component that
 * reads a token follows `prefers-color-scheme` with no prop and no second skin.
 */
export const darkTokens = {
  color: {
    page: { $value: "oklch(0.19 0 0)" },
    surface: { $value: "oklch(0.24 0 0)" },
    text: { $value: "oklch(0.96 0 0)" },
    muted: { $value: "oklch(0.74 0 0)" },
    line: { $value: "oklch(0.33 0 0)" },
    accent: { $value: "oklch(0.72 0.13 262)" },
    onAccent: { $value: "oklch(0.18 0 0)" },
    danger: { $value: "oklch(0.72 0.16 27)" },
    focusRing: { $value: "oklch(0.72 0.13 262)" },
  },
};
