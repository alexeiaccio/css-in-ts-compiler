// The system theme (the default): each colour token of styles.ts as a role, its hue from the terminal's palette and its
// lightness from contrast rules against the surfaces it sits on. A run-time module: the build does not evaluate it.
// Without a palette (a terminal that answers nothing), OpenTUI draws the terminal's own ANSI colours.
import { createSystemTheme } from "@cssints/tui/system";

import { c } from "./styles.ts";

const { bg, card, hover, accent } = c.color;
const panels = [bg, card, hover];

export const system = createSystemTheme(
  c,
  {
    color: {
      bg: { surface: true },
      card: { surface: true, on: [bg], contrast: 1.1 },
      hover: { surface: true, on: [bg], contrast: 1.3, ansi: 8 },
      text: { hue: "fg", on: panels, contrast: 7 },
      muted: { hue: "brightBlack", on: panels, contrast: 4.5 },
      border: { hue: "brightBlack", on: [bg, card], contrast: 1.6, ansi: 8 },
      accent: { hue: "blue", on: [bg, card], contrast: 3 },
      link: { hue: "brightBlue", on: panels, contrast: 4.5 },
      onAccent: { hue: "fg", on: [accent], contrast: 4.5, ansi: 15 },
    },
  },
  // the app's own hues, for a terminal that reports its background only; the light theme under a light terminal
  {
    hues: { fg: "#e6e9ec", brightBlack: "#8b98a5", blue: "#3b9cf0", brightBlue: "#5cb0ff" },
    themes: { light: "light" },
  },
);
