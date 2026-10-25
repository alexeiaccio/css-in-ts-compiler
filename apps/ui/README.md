# cssints ui

The neutral theme of the styled starters: a 16-step gray scale and a tint scale built from one hue and one chroma, the
semantic colours of React Aria's starter theme (text, placeholder, disabled, link, borders, fields, button and highlight,
invalid, the focus ring, the overlay and the popover shadow), dark mode as the same lightness scale turned over,
`forced-colors` for Windows high contrast, spacing in 4px steps, radii 6/8/10/16 and text at 14/12/16px with the 200dpi bump.
`src/theme.ts` is the whole theme; `src/main.tsx` is one switch from `@cssints/headless` wearing it, and the pairs a reader
meets on a page (text, muted text, links, placeholders, the highlight) are held to WCAG in the build by `check.contrast`.

The theme is neutral because the tint is the gray, `--hue-tint` and `--chroma-tint` both 0. A preset is those two numbers:
the reference's indigo ships as `[data-tint="indigo"]`, and the rest are a line each from its `theme.css` (red is
`27.0726`/`0.181447`, blue `266.315`/`0.22049`). The scale is written as derived tokens
(`oklch({lightness.1200} {chroma.tint} {hue.tint})`) rather than the reference's relative colours
(`oklch(from var(--tint) …)`) because `check.contrast` cannot evaluate a relative colour: it warns where it cannot compute,
and a theme that cannot fail its own check is not checked.

Portions restate React Aria's starter theme, licensed under the Apache License 2.0; see [NOTICE](NOTICE).
