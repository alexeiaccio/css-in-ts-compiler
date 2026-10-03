---
# cssints-33pa
title: 'Token fallbacks: @property and dynamic tokens for older targets'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-03T11:05:54Z
updated_at: 2026-10-03T11:37:36Z
parent: cssints-co8y
blocked_by:
    - cssints-fxzg
    - cssints-eaob
---

## Question

Decided with the user (2026-10-03). LightningCSS lowers literals in properties and in `:root` custom properties, but not `@property initial-value` and not `oklch(from var(--x) …)`.
1. A plain token lives only in `@property initial-value` today, so a target that cannot parse its value (oklch() in chrome 109) drops the rule and the token is missing entirely. Fix: when a target lacks the value, write the initial-value in the form LightningCSS would fall back to (transform `x{color:value}` with the targets and take the first declaration, or culori), and also emit `:root{--x:value}` so LightningCSS adds the wide-gamut value under `@supports`. Check that a browser with the feature still gets the original value (computed style).
2. A derived token whose live value holds `var()` (relative colour from a hue, `surface()`'s inputs) cannot be lowered: emit its flattened default (the literal we already compute for initial-value, lowered as above) in `:root`, and the live value under `@supports (color: oklch(from red l c h))` (or the feature the value needs). Older browsers get the static default theme (sky: Mu pink, no working hue slider); themes override the same way.
3. Prove it in a real old Chrome (a Chromium build around 109 by revision through playwright-core, or the oldest obtainable; say which): sky renders its colours (not transparent/initial) at the default hue, and the frame/surface runtime decision still holds. Update the demo/sky build checks and API.md.
