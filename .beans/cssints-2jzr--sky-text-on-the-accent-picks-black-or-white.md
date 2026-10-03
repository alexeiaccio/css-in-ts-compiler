---
# cssints-2jzr
title: 'sky: text on the accent picks black or white'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-03T10:34:14Z
updated_at: 2026-10-03T10:34:14Z
parent: cssints-co8y
---

## Question

Decided in cssints-bzal: `color.onAccent` becomes a derived token that picks black or white from the accent's OKLCH lightness (`oklch(from {color.accent} clamp(0, (T - l) * 1e6, 1) 0 0)` with T chosen so the sweep passes), like surface().ink(). Apply it wherever text sits on the accent (buttons, badges, the rail note if it uses accentStrong on accentSoft: decide whether that pair needs the same treatment or a darker strong). Make apps/sky/test/contrast.mjs pass at all 361 positions in light, dim and dark with floors 4.5 for small text on the accent, and report the new worst cases. Check in Chrome that the text flips at the expected hue. check.contrast in the build still covers the default hue (a relative colour may be unreadable for it: say what it reports).
