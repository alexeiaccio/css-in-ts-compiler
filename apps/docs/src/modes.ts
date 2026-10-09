import tokens from "./tokens.json" with { type: "json" };

// Plain data, so that a node test can read it (test/contrast.mjs) as theme.ts does.
// Dark and dim share the accent steps below, which read hue.accent, so the hue of the settings panel moves them in every mode.
export const dark = {
  color: {
    bg: "#0c0f15",
    bgSubtle: "#12161e",
    bgMuted: "#1b212c",
    border: "#252c39",
    borderStrong: "#384254",
    textLow: "#8f99ad",
    textMedium: "#aeb6c6",
    text: "#e9ecf3",
    accent: "oklch(0.661 0.18 {hue.accent})",
    accentSoft: "oklch(0.276 0.083 {hue.accent})",
    accentStrong: "oklch(0.821 0.09 {hue.accent})",
    link: "oklch(0.775 0.115 {hue.accent})",
    shadow: "oklch(0 0 0 / 0.5)",
    error: "#f2b8b5",
    errorSoft: "#3a1512",
  },
};
// dim is dark with a lifted background: the page has both classes (settings.ts), so shiki, color-scheme and the rest
// that follow `.dark` stay the same, and this theme, later in the sheet, only moves the neutrals.
export const dim = {
  color: {
    ...dark.color,
    bg: "#1a1f2b",
    bgSubtle: "#202635",
    bgMuted: "#2a3144",
    border: "#343c50",
    borderStrong: "#49546d",
    textLow: "#9ba5ba",
    textMedium: "#b9c1d2",
    text: "#eef0f6",
  },
};
// light again, for a page that asks for light while the system is dark: the values of tokens.json
export const light = {
  color: Object.fromEntries(
    Object.keys(dark.color).map((k) => [
      k,
      (tokens.color as unknown as Record<string, { $value: string }>)[k]!.$value,
    ]),
  ) as Record<keyof typeof dark.color, string>,
};
