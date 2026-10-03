---
# cssints-bzal
title: 'sky: accent contrast across the whole hue range'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-10-02T15:56:51Z
updated_at: 2026-10-03T10:34:14Z
parent: cssints-co8y
---

## Question

Found in cssints-1kob: at a cyan-green hue (slider -155) white on the accent is 2.76:1 and accent text on the soft accent 3.69:1, below the 3 and 4.5 that Mu pink holds; body text has no hue and is fine. Options to decide with the user: (a) text on the accent picks black or white by the accent's OKLCH lightness, as surface().ink() does (a derived token `oklch(from {color.accent} clamp(0, (0.6 - l) * 1e6, 1) 0 0)`), (b) the accent's lightness depends on the hue (a lookup is impossible in CSS; a hue-dependent term with sin()/cos() may be), (c) narrow the slider to the hues that pass, (d) accept and document. The sweep in apps/sky/test/contrast.mjs is the check. Also whether cssints should let `check.contrast` cover a range of a runtime number token (a `themes` filter, or a declared range on the token) so this lives in the build.

## Resolution (with the user, 2026-10-03)

Text on the accent picks black or white by itself: a derived token `onAccent` from the accent's OKLCH lightness, as surface().ink() does. The sweep in apps/sky/test/contrast.mjs must pass at all 361 slider positions. Implementation: "sky: text on the accent picks black or white".
