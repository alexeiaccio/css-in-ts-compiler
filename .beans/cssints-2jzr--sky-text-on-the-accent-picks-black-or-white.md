---
# cssints-2jzr
title: 'sky: text on the accent picks black or white'
status: completed
type: feature
priority: normal
created_at: 2026-10-03T10:34:14Z
updated_at: 2026-10-03T10:50:17Z
parent: cssints-co8y
---

## Question

Decided in cssints-bzal: `color.onAccent` becomes a derived token that picks black or white from the accent's OKLCH lightness (`oklch(from {color.accent} clamp(0, (T - l) * 1e6, 1) 0 0)` with T chosen so the sweep passes), like surface().ink(). Apply it wherever text sits on the accent (buttons, badges, the rail note if it uses accentStrong on accentSoft: decide whether that pair needs the same treatment or a darker strong). Make apps/sky/test/contrast.mjs pass at all 361 positions in light, dim and dark with floors 4.5 for small text on the accent, and report the new worst cases. Check in Chrome that the text flips at the expected hue. check.contrast in the build still covers the default hue (a relative colour may be unreadable for it: say what it reports).

## Summary of Changes

- `color.onAccent` is a derived token: `lab(from color(from {color.accent} srgb-linear clamp(0, r, 1) clamp(0, g, 1) clamp(0, b, 1)) clamp(0, (49.4 - l) * 1e6, 100) 0 0)`, white under CIE L* 49.4 (relative luminance 0.179, where black and white tie at 4.58), black over it. Not OKLCH `l` as in the ticket's example: the accent's `l` is 0.637 at every hue, so an `l` rule would never move with the slider, and it has a gap (0.51 to 0.59) where neither colour holds 4.5.
- At the slider's accent the pick is black at all 361 hues: 5.54 at the worst (the default pink, where white was 3.79). It flips for other accent lightnesses (Chrome: white up to L 0.55 at hue 345, 0.50 at 190).
- `link` in light is `{color.accentStrong}` (Mu's primary_500 was 3.79 on white), and light `accentStrong` is L 0.47 instead of Mu's 0.525 so it holds 4.5 on `accentSoft` and on `bg` at every hue (4.61 and 5.61 at the worst).
- `test/contrast.mjs` asserts 4.5 for the small-text pairs (onAccent/accent, link/bg, accentStrong/accentSoft) and 3 for accent/bg (large text and graphics); two documented exceptions held both ways: accent/bg light 2.76, onAccent/accentHover light 4.44. `test/browser.mjs` holds the token against Chrome at 361 hues and 65 other accents.
- Build: `check.contrast` warns once that `color.onAccent` is not a colour it can read, so `theme.ts` has no check on it (the sweep holds it).
- The settings preview button's label now sits on `accent` (the outer frame is `accentHover`).
