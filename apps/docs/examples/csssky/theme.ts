import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

// csssky's tokens (apps/csssky/src/tokens.json and theme.ts), cut to what this slice reads: the Mu light theme, the dim and the
// dark one, and the hue the accent colours are made of.
export const t = createTokens({
  hue: { $type: "number", accent: { $value: 345 } },
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    bgSubtle: { $value: "#f7f7f2" },
    bgMuted: { $value: "#edebe5" },
    border: { $value: "#e0ded9" },
    borderStrong: { $value: "#c5c4bf" },
    textLow: { $value: "#92918e" },
    textMedium: { $value: "#4b4a49" },
    textHigh: { $value: "#2a2a2a" },
    text: { $value: "#000000" },
    accent: { $value: "oklch(0.637 0.203 {hue.accent})" },
    accentStrong: { $value: "oklch(0.47 0.164 {hue.accent})" },
    accentSoft: { $value: "oklch(0.926 0.056 {hue.accent})" },
    link: { $value: "{color.accentStrong}" },
  },
  space: {
    $type: "dimension",
    "2xs": { $value: "2px" },
    xs: { $value: "4px" },
    sm: { $value: "8px" },
    md: { $value: "12px" },
    lg: { $value: "16px" },
    xl: { $value: "20px" },
    "2xl": { $value: "24px" },
    "3xl": { $value: "28px" },
  },
  gutter: {
    $type: "dimension",
    compact: { $value: "{space.sm}" },
    base: { $value: "{space.lg}" },
  },
  radius: {
    $type: "dimension",
    sm: { $value: "8px" },
    lg: { $value: "16px" },
    xl: { $value: "20px" },
    full: { $value: "999px" },
    button: { $value: "{radius.full}" },
    avatar: { $value: "{radius.full}" },
    avatarSmall: { $value: "{radius.full}" },
  },
  fontSize: {
    $type: "dimension",
    xs: { $value: "11.3px" },
    sm: { $value: "13.1px" },
    md: { $value: "15px" },
    lg: { $value: "16.9px" },
    xl: { $value: "18.8px" },
    "2xl": { $value: "20.6px" },
  },
  lineHeight: {
    $type: "number",
    snug: { $value: 1.3 },
    relaxed: { $value: 1.5 },
  },
  fontWeight: {
    $type: "fontWeight",
    medium: { $value: 500 },
    semiBold: { $value: 600 },
    bold: { $value: 700 },
  },
  border: { $type: "dimension", width: { $value: "1px" } },
  avatar: { $type: "dimension", feed: { $value: "42px" } },
  layout: {
    $type: "dimension",
    centerWidth: { $value: "600px" },
    leftNavWidth: { $value: "240px" },
    leftNavMinimalWidth: { $value: "80px" },
    rightRailWidth: { $value: "300px" },
    rightRailNarrowWidth: { $value: "250px" },
    headerHeight: { $value: "53px" },
    navItem: { $value: "48px" },
    navIcon: { $value: "24px" },
  },
});

// The mode is a class on <html>: none is "system", which follows prefers-color-scheme. A selector theme beats a condition theme
// on the same element, so a class always wins over the system.
const dim = {
  color: {
    bg: "#1a1a1a",
    bgSubtle: "#1c1c1c",
    bgMuted: "#1f1f1f",
    border: "#242424",
    borderStrong: "#353535",
    textLow: "#62615f",
    textMedium: "#abaaa6",
    textHigh: "#e0ded9",
    text: "#ffffff",
    accentStrong: "oklch(0.755 0.152 {hue.accent})",
    accentSoft: "oklch(0.357 0.104 {hue.accent})",
    link: "oklch(0.697 0.177 {hue.accent})",
  },
};
const dark = { color: { ...dim.color, bg: "#000000", bgSubtle: "#141414", bgMuted: "#212121" } };
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), dark);
createGlobalTheme(t, ".dim", dim);
createGlobalTheme(t, ".dark", dark);

// Text on the backgrounds it sits on, in the default values and in every theme above.
for (const bg of [t.color.bg, t.color.bgSubtle, t.color.bgMuted]) {
  check.contrast(t.color.text, bg, { min: 7 });
  check.contrast(t.color.textMedium, bg, { min: 4.5 });
}
check.contrast(t.color.link, t.color.bg, { min: 4.5 });
