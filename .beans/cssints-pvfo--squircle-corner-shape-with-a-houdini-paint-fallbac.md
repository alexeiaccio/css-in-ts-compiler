---
# cssints-pvfo
title: 'squircle(): corner-shape with a Houdini paint fallback'
status: todo
type: feature
priority: normal
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T08:55:57Z
parent: cssints-dk1q
---

## What
`squircle().radius(..).smoothing(..)`: native `corner-shape: squircle` (Chrome 139) where supported, else a paint worklet runtime chosen by BCD (`polyfills: ["css.properties.corner-shape"]`).

## Sources
- https://github.com/PavelLaptev/css-houdini-squircle
- https://github.com/una/extra.css (paint worklets as a pattern)

## Shape
- kernel with `requires`, runtime with `polyfills` + worklet registration; the fallback uses `mask`/`background: paint(squircle)`.

## Todo
- [ ] native kernel
- [ ] worklet runtime on the plugin runtime delivery
- [ ] fixture, browser check
