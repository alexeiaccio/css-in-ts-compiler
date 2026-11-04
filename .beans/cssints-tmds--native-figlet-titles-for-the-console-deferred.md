---
# cssints-tmds
title: 'native: FIGlet titles for the console (deferred)'
status: todo
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
