import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

// A step of the scale is a lightness, and a colour is one lightness plus a hue and a chroma. So a mode is the lightness scale
// turned over, a tint preset is two numbers, and every colour below follows both without being written again. The steps are
// React Aria's (NOTICE), 100 the lightest surface and 1600 the strongest text, as numbers over 1 because @property has no
// percentage syntax and oklch() reads a lightness of 0.981187 as 98.1187%.
const t = createTokens({
  lightness: {
    $type: "number",
    "100": { $value: "0.981187" },
    "200": { $value: "0.952045" },
    "300": { $value: "0.911434" },
    "400": { $value: "0.851751" },
    "500": { $value: "0.791773" },
    "600": { $value: "0.723297" },
    "700": { $value: "0.670121" },
    "800": { $value: "0.623039" },
    "900": { $value: "0.579699" },
    "1000": { $value: "0.519076" },
    "1100": { $value: "0.469058" },
    "1200": { $value: "0.410821" },
    "1300": { $value: "0.353616" },
    "1400": { $value: "0.296725" },
    "1500": { $value: "0.245366" },
    "1600": { $value: "0.166959" },
  },

  // The theme is neutral: the tint is the gray, so `hue.tint` and `chroma.tint` are both 0 and the tint scale below is the gray
  // scale. The reference keeps a whole oklch() per named hue to read its chroma and hue; here a preset is those two numbers
  // (`[data-tint="indigo"]` at the bottom). Its lightness channel reads only into the low chroma steps, taken as 1, as in every
  // preset of the reference.
  hue: { $type: "number", tint: { $value: 0 }, invalid: { $value: 27.0726 } },
  chroma: {
    $type: "number",
    tint: { $value: 0 },
    invalid: { $value: 0.181447 },
    // A chroma that reads well at 55% clips to white near the top of the scale, so the light steps hold it back.
    "100": { $value: "calc({chroma.tint} * 0.5)" },
    "200": { $value: "calc({chroma.tint} * 0.6)" },
    "300": { $value: "calc({chroma.tint} * 0.7)" },
    "400": { $value: "calc({chroma.tint} * 0.8)" },
    "500": { $value: "calc({chroma.tint} * 0.9)" },
  },

  color: {
    $type: "color",
    // The gray has no hue at all, so it is not the tint at a chroma of 0: a tint preset repaints the tint scale only.
    gray: {
      "100": { $value: "oklch({lightness.100} 0 0)" },
      "200": { $value: "oklch({lightness.200} 0 0)" },
      "300": { $value: "oklch({lightness.300} 0 0)" },
      "400": { $value: "oklch({lightness.400} 0 0)" },
      "500": { $value: "oklch({lightness.500} 0 0)" },
      "600": { $value: "oklch({lightness.600} 0 0)" },
      "700": { $value: "oklch({lightness.700} 0 0)" },
      "800": { $value: "oklch({lightness.800} 0 0)" },
      "900": { $value: "oklch({lightness.900} 0 0)" },
      "1000": { $value: "oklch({lightness.1000} 0 0)" },
      "1100": { $value: "oklch({lightness.1100} 0 0)" },
      "1200": { $value: "oklch({lightness.1200} 0 0)" },
      "1300": { $value: "oklch({lightness.1300} 0 0)" },
      "1400": { $value: "oklch({lightness.1400} 0 0)" },
      "1500": { $value: "oklch({lightness.1500} 0 0)" },
      "1600": { $value: "oklch({lightness.1600} 0 0)" },
    },
    tint: {
      "100": { $value: "oklch({lightness.100} {chroma.100} {hue.tint})" },
      "200": { $value: "oklch({lightness.200} {chroma.200} {hue.tint})" },
      "300": { $value: "oklch({lightness.300} {chroma.300} {hue.tint})" },
      "400": { $value: "oklch({lightness.400} {chroma.400} {hue.tint})" },
      "500": { $value: "oklch({lightness.500} {chroma.500} {hue.tint})" },
      "600": { $value: "oklch({lightness.600} {chroma.tint} {hue.tint})" },
      "700": { $value: "oklch({lightness.700} {chroma.tint} {hue.tint})" },
      "800": { $value: "oklch({lightness.800} {chroma.tint} {hue.tint})" },
      "900": { $value: "oklch({lightness.900} {chroma.tint} {hue.tint})" },
      "1000": { $value: "oklch({lightness.1000} {chroma.tint} {hue.tint})" },
      "1100": { $value: "oklch({lightness.1100} {chroma.tint} {hue.tint})" },
      "1200": { $value: "oklch({lightness.1200} {chroma.tint} {hue.tint})" },
      "1300": { $value: "oklch({lightness.1300} {chroma.tint} {hue.tint})" },
      "1400": { $value: "oklch({lightness.1400} {chroma.tint} {hue.tint})" },
      "1500": { $value: "oklch({lightness.1500} {chroma.tint} {hue.tint})" },
      "1600": { $value: "oklch({lightness.1600} {chroma.tint} {hue.tint})" },
    },

    // The page and the surface are not steps of the scale in the reference either: they are the two colours the scale starts from.
    page: { $value: "#f8f8f8" },
    surface: { $value: "#ffffff" },
    text: { $value: "{color.gray.1200}" },
    textHover: { $value: "{color.gray.1300}" },
    muted: { $value: "{color.gray.1100}" },
    placeholder: { $value: "{color.gray.1000}" },
    textDisabled: { $value: "{color.gray.600}" },
    link: { $value: "{color.tint.1200}" },
    linkPressed: { $value: "{color.tint.1300}" },
    border: { $value: "{color.gray.400}" },
    borderHover: { $value: "{color.gray.500}" },
    borderDisabled: { $value: "{color.gray.300}" },
    fieldText: { $value: "{color.gray.1400}" },
    focusRing: { $value: "{color.tint.1000}" },
    // The highlight is the tint at a fixed lightness, so it keeps its contrast with white in either mode and under any preset.
    highlight: { $value: "oklch(55% {chroma.tint} {hue.tint})" },
    highlightPressed: { $value: "oklch(50% {chroma.tint} {hue.tint})" },
    onHighlight: { $value: "white" },
    invalid: { $value: "oklch({lightness.1000} {chroma.invalid} {hue.invalid})" },
    highlightInvalid: { $value: "oklch({lightness.900} {chroma.invalid} {hue.invalid})" },
    buttonBackground: { $value: "{color.tint.100}" },
    buttonBackgroundPressed: { $value: "{color.tint.200}" },
    overlayBackground: { $value: "{color.surface}" },
    overlayBorder: { $value: "rgb(0 0 0 / 0.06)" },
  },

  // One shadow, because a popover is the only thing that floats above the page in the starters. Its blur and offsets are the
  // reference's; only its colour changes with the mode.
  shadow: {
    $type: "shadow",
    popover: {
      $value: {
        color: "rgb(0 0 0 / 0.12)",
        offsetX: "0",
        offsetY: "8px",
        blur: "20px",
        spread: "0",
      },
    },
  },

  // The steps are derived from the base, so the high resolution bump below moves the whole scale with one value.
  space: {
    $type: "dimension",
    base: { $value: "4px" },
    "1": { $value: "{space.base}" },
    "2": { $value: "calc({space.base} * 2)" },
    "3": { $value: "calc({space.base} * 3)" },
    "4": { $value: "calc({space.base} * 4)" },
    "5": { $value: "calc({space.base} * 5)" },
    "6": { $value: "calc({space.base} * 6)" },
    "7": { $value: "calc({space.base} * 7)" },
    "8": { $value: "calc({space.base} * 8)" },
    "9": { $value: "calc({space.base} * 9)" },
    "10": { $value: "calc({space.base} * 10)" },
  },
  radius: {
    $type: "dimension",
    sm: { $value: "6px" },
    md: { $value: "8px" },
    lg: { $value: "10px" },
    xl: { $value: "16px" },
  },
  font: {
    $type: "dimension",
    sizeSm: { $value: "0.75rem" },
    size: { $value: "0.875rem" },
    sizeLg: { $value: "1rem" },
  },
});

// The dark mode is the lightness scale turned over, so every step and every colour made of it follows: the text is still
// gray-1200, it is just a light gray now. The page and the surface are the reference's own dark values, and the popover shadow
// deepens because a shadow on a dark page reads as a smudge.
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  lightness: {
    "100": "0.296725",
    "200": "0.353616",
    "300": "0.410821",
    "400": "0.469058",
    "500": "0.519076",
    "600": "0.579699",
    "700": "0.561347",
    "800": "0.592866",
    "900": "0.623039",
    "1000": "0.670121",
    "1100": "0.723297",
    "1200": "0.791773",
    "1300": "0.851751",
    "1400": "0.911434",
    "1500": "0.952045",
    "1600": "1",
  },
  color: { page: "#1b1b1b", surface: "oklch(22% 0 0)", overlayBorder: "rgb(255 255 255 / 0.2)" },
  shadow: {
    popover: {
      color: "rgb(0 0 0 / 0.5)",
      offsetX: "0",
      offsetY: "8px",
      blur: "20px",
      spread: "0",
    },
  },
});

// One preset, because the theme is neutral: the reference's indigo, as its two numbers. The others are in its theme.css.
createGlobalTheme(t, '[data-tint="indigo"]', {
  hue: { tint: "284.23" },
  chroma: { tint: "0.25049" },
});

// On a dense screen (200dpi and up) the targets grow: the spacing steps and the text with them, as in the reference.
createGlobalTheme(t, media("(min-resolution: 200dpi)"), {
  space: { base: "calc(0.25rem * 1.25)" },
  font: { sizeSm: "0.9375rem", size: "1.0625rem", sizeLg: "1.25rem" },
});

// Windows high contrast mode throws the theme away and paints the system's own colours; forced-colors makes that explicit,
// since a component that reads a token here gets the system colour rather than the tint.
createGlobalTheme(t, media("(forced-colors: active)"), {
  color: {
    page: "Canvas",
    surface: "Canvas",
    text: "ButtonText",
    textHover: "ButtonText",
    muted: "ButtonText",
    placeholder: "ButtonText",
    textDisabled: "GrayText",
    link: "LinkText",
    linkPressed: "LinkText",
    border: "ButtonBorder",
    borderHover: "ButtonBorder",
    borderDisabled: "GrayText",
    fieldText: "FieldText",
    focusRing: "Highlight",
    highlight: "Highlight",
    highlightPressed: "Highlight",
    onHighlight: "HighlightText",
    invalid: "LinkText",
    highlightInvalid: "LinkText",
    buttonBackground: "ButtonFace",
    buttonBackgroundPressed: "ButtonFace",
    overlayBackground: "Canvas",
    overlayBorder: "ButtonBorder",
  },
});

// The pairs a reader meets on every page: body text, the second level of text, and a link on a card. Both modes and every
// theme above are checked (the preset too, since it sets the tokens the link is made of), and a ratio under the floor fails
// the build. 7 for text and 4.5 for the rest are the WCAG 2.x AAA and AA floors.
check.contrast(t.color.text, t.color.page, { min: 7 });
check.contrast(t.color.muted, t.color.page, { min: 4.5 });
check.contrast(t.color.link, t.color.surface, { min: 4.5 });
check.contrast(t.color.placeholder, t.color.page, { min: 4.5 });
check.contrast(t.color.onHighlight, t.color.highlight, { min: 4.5 });
// The focus ring is a graphic, not text: 3 is the WCAG 1.4.11 floor for a non-text contrast.
check.contrast(t.color.focusRing, t.color.page, { min: 3 });

export { t };
