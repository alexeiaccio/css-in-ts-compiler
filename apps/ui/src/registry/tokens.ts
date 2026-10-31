// The token data behind `theme.ts`, kept apart so a build-time generator can read it
// without the cssints plugin: the registry ships `theme.css` compiled from it.

export const lightTokens = {
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
      "100": { $value: "oklch(0.981187 0 0)" },
      "200": { $value: "oklch(0.952045 0 0)" },
      "300": { $value: "oklch(0.911434 0 0)" },
      "400": { $value: "oklch(0.851751 0 0)" },
      "500": { $value: "oklch(0.791773 0 0)" },
      "600": { $value: "oklch(0.723297 0 0)" },
      "700": { $value: "oklch(0.670121 0 0)" },
      "800": { $value: "oklch(0.623039 0 0)" },
      "900": { $value: "oklch(0.579699 0 0)" },
      "1000": { $value: "oklch(0.519076 0 0)" },
      "1100": { $value: "oklch(0.469058 0 0)" },
      "1200": { $value: "oklch(0.410821 0 0)" },
      "1300": { $value: "oklch(0.353616 0 0)" },
      "1400": { $value: "oklch(0.296725 0 0)" },
      "1500": { $value: "oklch(0.245366 0 0)" },
      "1600": { $value: "oklch(0.166959 0 0)" },
    },
    tint: {
      "100": { $value: "oklch(0.981187 {chroma.100} {hue.tint})" },
      "200": { $value: "oklch(0.952045 {chroma.200} {hue.tint})" },
      "300": { $value: "oklch(0.911434 {chroma.300} {hue.tint})" },
      "400": { $value: "oklch(0.851751 {chroma.400} {hue.tint})" },
      "500": { $value: "oklch(0.791773 {chroma.500} {hue.tint})" },
      "600": { $value: "oklch(0.723297 {chroma.tint} {hue.tint})" },
      "700": { $value: "oklch(0.670121 {chroma.tint} {hue.tint})" },
      "800": { $value: "oklch(0.623039 {chroma.tint} {hue.tint})" },
      "900": { $value: "oklch(0.579699 {chroma.tint} {hue.tint})" },
      "1000": { $value: "oklch(0.519076 {chroma.tint} {hue.tint})" },
      "1100": { $value: "oklch(0.469058 {chroma.tint} {hue.tint})" },
      "1200": { $value: "oklch(0.410821 {chroma.tint} {hue.tint})" },
      "1300": { $value: "oklch(0.353616 {chroma.tint} {hue.tint})" },
      "1400": { $value: "oklch(0.296725 {chroma.tint} {hue.tint})" },
      "1500": { $value: "oklch(0.245366 {chroma.tint} {hue.tint})" },
      "1600": { $value: "oklch(0.166959 {chroma.tint} {hue.tint})" },
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
    invalid: { $value: "oklch(0.519076 {chroma.invalid} {hue.invalid})" },
    highlightInvalid: { $value: "oklch(0.579699 {chroma.invalid} {hue.invalid})" },
    buttonBackground: { $value: "{color.tint.100}" },
    buttonBackgroundPressed: { $value: "{color.tint.200}" },
    overlayBackground: { $value: "{color.surface}" },
    overlayBorder: { $value: "rgb(0 0 0 / 0.06)" },
    // The bottom sheet's surface: the overlay colour by default, a token of its own so a host can lift the sheet off the page.
    sheetBackground: { $value: "{color.overlayBackground}" },
    // The wash under a modal: the page stays visible, and no text of the page can be read through it.
    scrim: { $value: "oklch(0 0 0 / 0.35)" },
  },

  // What floats over the page, innermost last: a popover (a menu, a tooltip) is under a modal dialog, and a toast is over
  // both, because one can arrive while a dialog is open and must still be read.
  z: {
    $type: "number",
    popover: { $value: "10" },
    dialog: { $value: "20" },
    toast: { $value: "30" },
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
} as const;

export const darkTheme = {
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
  color: {
    // The dark scale is literal for the same reason the light one is: the tokens are not in the
    // sheet at runtime, so a colour cannot be built from them there.
    gray: {
      "100": { $value: "oklch(0.296725 0 0)" },
      "200": { $value: "oklch(0.353616 0 0)" },
      "300": { $value: "oklch(0.410821 0 0)" },
      "400": { $value: "oklch(0.469058 0 0)" },
      "500": { $value: "oklch(0.519076 0 0)" },
      "600": { $value: "oklch(0.579699 0 0)" },
      "700": { $value: "oklch(0.561347 0 0)" },
      "800": { $value: "oklch(0.592866 0 0)" },
      "900": { $value: "oklch(0.623039 0 0)" },
      "1000": { $value: "oklch(0.670121 0 0)" },
      "1100": { $value: "oklch(0.723297 0 0)" },
      "1200": { $value: "oklch(0.791773 0 0)" },
      "1300": { $value: "oklch(0.851751 0 0)" },
      "1400": { $value: "oklch(0.911434 0 0)" },
      "1500": { $value: "oklch(0.952045 0 0)" },
      "1600": { $value: "oklch(1 0 0)" },
    },
    tint: {
      "100": { $value: "oklch(0.296725 {chroma.100} {hue.tint})" },
      "200": { $value: "oklch(0.353616 {chroma.200} {hue.tint})" },
      "300": { $value: "oklch(0.410821 {chroma.300} {hue.tint})" },
      "400": { $value: "oklch(0.469058 {chroma.400} {hue.tint})" },
      "500": { $value: "oklch(0.519076 {chroma.500} {hue.tint})" },
      "600": { $value: "oklch(0.579699 {chroma.tint} {hue.tint})" },
      "700": { $value: "oklch(0.561347 {chroma.tint} {hue.tint})" },
      "800": { $value: "oklch(0.592866 {chroma.tint} {hue.tint})" },
      "900": { $value: "oklch(0.623039 {chroma.tint} {hue.tint})" },
      "1000": { $value: "oklch(0.670121 {chroma.tint} {hue.tint})" },
      "1100": { $value: "oklch(0.723297 {chroma.tint} {hue.tint})" },
      "1200": { $value: "oklch(0.791773 {chroma.tint} {hue.tint})" },
      "1300": { $value: "oklch(0.851751 {chroma.tint} {hue.tint})" },
      "1400": { $value: "oklch(0.911434 {chroma.tint} {hue.tint})" },
      "1500": { $value: "oklch(0.952045 {chroma.tint} {hue.tint})" },
      "1600": { $value: "oklch(1 {chroma.tint} {hue.tint})" },
    },
    page: "#1b1b1b",
    surface: "oklch(22% 0 0)",
    // a step over the dark surface, so the sheet reads as a layer above the page
    sheetBackground: "oklch(24% 0 0)",
    overlayBorder: "rgb(255 255 255 / 0.2)",
  },
  shadow: {
    popover: {
      color: "rgb(0 0 0 / 0.5)",
      offsetX: "0",
      offsetY: "8px",
      blur: "20px",
      spread: "0",
    },
  },
} as const;

export const forcedColorsTheme = {
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
    sheetBackground: "Canvas",
    overlayBorder: "ButtonBorder",
  },
} as const;
