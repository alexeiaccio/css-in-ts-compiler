// Plain data, so that a node test can read it as theme.ts does. A mode is a theme of the colour tokens that points each one at
// the same name in the palette group of that mode (`pal.dark.bg`); the palette themes (palettes.ts, theme.ts) set those values,
// so a palette and a mode change independently, whatever the system or a class asks for.
const ref = <K extends string>(mode: string, keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, `{pal.${mode}.${k}}`])) as Record<K, string>;

const NEUTRALS = [
  "bg",
  "bgSubtle",
  "bgMuted",
  "border",
  "borderStrong",
  "textLow",
  "textMedium",
  "text",
] as const;
const PALETTE = [...NEUTRALS, "accent", "accentSoft", "accentStrong", "link", "onAccent"] as const;

export const light = {
  color: {
    ...ref("light", PALETTE),
    shadow: "oklch(0.2 0.02 270 / 0.14)",
    error: "#b3261e",
    errorSoft: "#fdecea",
  },
};
export const dark = {
  color: {
    ...ref("dark", PALETTE),
    shadow: "oklch(0 0 0 / 0.5)",
    error: "#f2b8b5",
    errorSoft: "#3a1512",
  },
};
// dim is dark with lifted neutrals: the page has both classes (settings.ts), so shiki, color-scheme and the rest that follow
// `.dark` stay the same, and this theme, later in the sheet, moves the neutrals (the accents are the dark ones, stated again so
// that css.check.contrast reads the theme whole).
export const dim = { color: { ...dark.color, ...ref("dim", NEUTRALS) } };
