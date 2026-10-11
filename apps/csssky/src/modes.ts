import tokens from "./tokens.json" with { type: "json" };

// Dim and dark change the neutrals and the four accent steps that differ between themes. The accent steps refer to
// hue.accent, so the hue slider moves them in every theme.
export const dim = {
  color: {
    bg: "#1a1a1a",
    bgSubtle: "#1c1c1c",
    bgMuted: "#1f1f1f",
    border: "#242424",
    borderStrong: "#353535",
    borderStronger: "#4b4a49",
    textLow: "#62615f",
    textMedium: "#abaaa6",
    textHigh: "#e0ded9",
    text: "#ffffff",
    positiveSoft: "#032a17",
    negativeSoft: "#430413",
    shadow: "oklch(0 0 0 / 0.4)",
    accentHover: "oklch(0.697 0.177 {hue.accent})",
    accentStrong: "oklch(0.755 0.152 {hue.accent})",
    accentSoft: "oklch(0.357 0.104 {hue.accent})",
    link: "oklch(0.697 0.177 {hue.accent})",
  },
};
export const dark = {
  color: {
    ...dim.color,
    bg: "#000000",
    bgSubtle: "#141414",
    bgMuted: "#212121",
    border: "#2a2a2a",
  },
};
// light again, for a page that asks for light while the system is dark: the values of tokens.json
export const light = {
  color: Object.fromEntries(
    Object.keys(dim.color).map((k) => [
      k,
      (tokens.color as unknown as Record<string, { $value: string }>)[k]!.$value,
    ]),
  ) as Record<keyof typeof dim.color, string>,
};
