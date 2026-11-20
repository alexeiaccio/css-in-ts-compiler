---
# cssints-tmds
title: 'native: FIGlet titles for the console (deferred)'
status: completed
type: feature
priority: low
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:36Z
updated_at: 2026-11-04T10:36:36Z
parent: cssints-1ttw
---

The reference ships FIGlet fonts as data and draws big text for titles; we have the same idea from the Hershey spike, in a different shape (ASCII art, not strokes).

Deferred: it is decoration, and the spike's numbers said a stroke font's niche is a ROM-bound board at one signage size. Revisit if the console target needs a title, or if the board wants a banner without a font.

If taken: the font files as data under `native/vendor/figlet/` (BSD 3-Clause, said in the README), a parser of ~100 lines, a figure kind `banner` (the text as cells) or a console title, bytes and ms, and a check that the banner's cells are the font's glyphs.

## Closed (2026-11-20)

The native targets left this repository (`cssints-native`, its own package and repository), so `native/vendor/figlet/` is not
a path here and the bean cannot be worked in this repo. Closed for the same reason as the hotkeys adoption: it moves with the
target it belongs to. The console banner, if that repository wants one, starts from this note's plan (font data, a ~100-line
parser, a `banner` figure kind, and a check that the cells are the font's glyphs).
