import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

import tokens from "./tokens.json" with { type: "json" };

// tokens.json is the light theme and the default of every token; the page follows the system (see "system" below).
export const t = createTokens(tokens);

const dark = {
  color: {
    bg: "#0c0f15",
    bgSubtle: "#12161e",
    bgMuted: "#1b212c",
    border: "#252c39",
    borderStrong: "#384254",
    textLow: "#8f99ad",
    textMedium: "#aeb6c6",
    text: "#e9ecf3",
    accent: "#6f86ff",
    accentSoft: "#1a2350",
    accentStrong: "#b4c0ff",
    onAccent: "#0c0f15",
    link: "#9fb0ff",
    shadow: "oklch(0 0 0 / 0.5)",
    error: "#f2b8b5",
    errorSoft: "#3a1512",
  },
};
// light again, for a page that asks for light while the system is dark: the values of tokens.json
const light = {
  color: Object.fromEntries(
    Object.keys(dark.color).map((k) => [
      k,
      (tokens.color as unknown as Record<string, { $value: string }>)[k]!.$value,
    ]),
  ) as Record<keyof typeof dark.color, string>,
};

// The mode is a class on <html>: none is "system", which follows prefers-color-scheme. A selector theme beats a condition
// theme on the same element, so a class always wins over the system.
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), dark);
createGlobalTheme(t, ".light", light);
createGlobalTheme(t, ".dark", dark);

// Text on the backgrounds it sits on, in the default values and in every theme above.
for (const bg of [t.color.bg, t.color.bgSubtle, t.color.bgMuted]) {
  check.contrast(t.color.text, bg, { min: 7 });
  check.contrast(t.color.textMedium, bg, { min: 4.5 });
}
for (const bg of [t.color.bg, t.color.bgSubtle]) check.contrast(t.color.textLow, bg, { min: 4.5 });
check.contrast(t.color.link, t.color.bg, { min: 4.5 });
check.contrast(t.color.link, t.color.bgSubtle, { min: 4.5 });
check.contrast(t.color.accentStrong, t.color.accentSoft, { min: 4.5 });
check.contrast(t.color.accent, t.color.bg, { min: 4.5 });
check.contrast(t.color.onAccent, t.color.accent, { min: 4.5 });
check.contrast(t.color.error, t.color.errorSoft, { min: 4.5 });
