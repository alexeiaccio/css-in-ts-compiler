import { look } from "@cssints/mise-en-mode" with { type: "cssints" };
import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

import { darkTheme, forcedColorsTheme, lightTokens } from "./tokens.ts";

// The theme the starters are written against: one lightness scale, one hue and one chroma per
// colour family, and the semantic colours made of them. The data lives in tokens.ts, so the
// registry can compile it to a plain theme.css without the cssints plugin; this module is the
// same theme for the components and the demo page, with the contrast gate.
const t = createTokens(lightTokens);

// The dark mode is the lightness scale turned over, so every step and every colour made of it follows: the text is still
// gray-1200, it is just a light gray now. The page and the surface are the reference's own dark values, and the popover shadow
// deepens because a shadow on a dark page reads as a smudge.
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), darkTheme);

// The same dark look as a scope a page can ask for: `<div data-mode="dark">` moves every token inside it, and a surface or a
// frame under it follows without a prop. It is a mise-en-mode look, so it is in the `app` layer: a host's `author` or `viewer`
// look over the same marker wins without a specificity trick, and `data-mode="dark/color"` moves the colours alone. The media
// query above stays a global theme: a look is a `data-mode` scope, and the system preference is not one.
look(t, "dark", "app", darkTheme);

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
createGlobalTheme(t, media("(forced-colors: active)"), forcedColorsTheme);

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
