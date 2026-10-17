---
# cssints-mmp7
title: '@cssints/gradient-2d: freeformGradient() after meshGradient()'
status: todo
type: feature
created_at: 2026-10-17T10:21:19Z
updated_at: 2026-10-17T10:21:19Z
---

After cssints-6ctt (mesh) lands. Design: docs/research/2d-gradients.md, sections 4-6.

- [ ] `freezeformGradient` no: `freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")` in the same package, points only (`<color> <number>? <position>`), `in oklab` and `in srgb` only; no lines, no shapes
- [ ] CSS fallback without JS: a stack of radial gradients, one layer per stop (first paint without JS, unlike mesh)
- [ ] runtime: inverse-distance weighting (weight spread / d^2) at a quarter of the box size; Delaunay only if IDW looks wrong, and then with the box corners added
- [ ] `@supports` native branch for freeform-gradient(); the own BCD key already exists after cssints-6ctt
- [ ] claim only "this package's algorithm": the freeform rendering rule is not public (Josh Tumath, 2026-06-25); the name may become diffusion-gradient()
- [ ] tests: stop colour at its own position, a blend inside the hull, srgb vs oklab at a midpoint, Chrome read-back at 20 points
