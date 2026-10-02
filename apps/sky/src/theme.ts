import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

import tokens from "./tokens.json" with { type: "json" };

// light is tokens.json; the colour is the default of every token and the page follows the system (see "system" below).
export const t = createTokens(tokens);

// useGutters: 12, 20 and 28 from 800 px
createGlobalTheme(t, media("(width >= 800px)"), {
  gutter: { compact: "12px", base: "20px", wide: "28px" },
});

// Dim and dark change the neutrals and the four accent steps that differ between themes. The accent steps refer to
// hue.accent, so the hue slider moves them in every theme.
const dim = {
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
const dark = {
  color: {
    ...dim.color,
    bg: "#000000",
    bgSubtle: "#141414",
    bgMuted: "#212121",
    border: "#2a2a2a",
  },
};
// light again, for a page that asks for light while the system is dark: the values of tokens.json
const light = {
  color: Object.fromEntries(
    Object.keys(dim.color).map((k) => [
      k,
      (tokens.color as unknown as Record<string, { $value: string }>)[k]!.$value,
    ]),
  ) as Record<keyof typeof dim.color, string>,
};

// The mode is a class on <html>: none is "system", which follows prefers-color-scheme. A selector theme beats a
// condition theme on the same element, so a class always wins over the system.
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), dark);
createGlobalTheme(t, ".light", light);
createGlobalTheme(t, ".dim", dim);
createGlobalTheme(t, ".dark", dark);

check.contrast(t.color.text, t.color.bg, { min: 7 });
check.contrast(t.color.textMedium, t.color.bg, { min: 4.5 });
check.contrast(t.color.accentStrong, t.color.accentSoft, { min: 4.5 });
// Mu's pink on white is 3.9: enough for large text, icons and links that are also underlined, not for body text
check.contrast(t.color.accent, t.color.bg, { min: 3 });
check.contrast(t.color.onAccent, t.color.accent, { min: 3 });
