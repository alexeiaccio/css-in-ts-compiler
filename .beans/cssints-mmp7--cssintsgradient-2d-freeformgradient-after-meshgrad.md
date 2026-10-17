---
# cssints-mmp7
title: '@cssints/gradient-2d: freeformGradient() after meshGradient()'
status: completed
type: feature
priority: normal
created_at: 2026-10-17T10:21:19Z
updated_at: 2026-10-17T14:20:09Z
---

After cssints-6ctt (mesh) lands. Design: docs/research/2d-gradients.md, sections 4-6.

- [x] `freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")` in the same package, points only (`<color> <number>? <position>`), `in oklab` and `in srgb` only; no lines, no shapes
- [x] CSS fallback without JS: a stack of radial gradients, one layer per stop (first paint without JS, unlike mesh)
- [x] runtime: inverse-distance weighting (weight spread / d^2) at a quarter of the box size; Delaunay only if IDW looks wrong, and then with the box corners added
- [x] `@supports` native branch for freeform-gradient(); the own BCD key already exists after cssints-6ctt
- [x] claim only "this package's algorithm": the freeform rendering rule is not public (Josh Tumath, 2026-06-25); the name may become diffusion-gradient()
- [x] tests: stop colour at its own position, a blend inside the hull, srgb vs oklab at a midpoint, Chrome read-back at 20 points

## Engine gaps

- **A grammar string cannot take the spec's freeform text either**, as in mesh: `args: arg<string>()` and the build parses it (the same `;`/`,` tokenizer gap as cssints-6ctt, here for `,` inside one argument).
- **A browser with one function and not the other.** No browser has either, so the case is untested against a real engine: the freeform marker class (`_gradient2d-ff`) and the custom properties (`--gradient2d-ff-*`) are its own, so a browser with `mesh-gradient()` must not take freeform's `@supports` branch and the reverse. Chrome 155 tests only the fallback path.
- **The BCD gate follows the table**: `css.types.gradient.freeform-gradient` is absent for every tracked browser, so the runtime ships to every build that uses the plugin. Two runtimes of one scope (`gradient2d.script`, `gradient2d.ffScript`) import the same module, which the browser runs once.
- **`dist/` of the package is not tracked.**

## Delaunay, looked at

An IDW render of four points at 500 x 300 (throwaway, outside the repo) is soft round blobs, one per stop, the spread visible, the whole box covered. A Bowyer-Watson Delaunay of the same points paints only the points' convex hull: the box outside it has no triangle, and painting the nearest stop there leaves a hard edge along the hull — the spike of docs/research/2d-gradients.md saw the same. IDW ships; the box corners would be needed before Delaunay is worth it.


## Summary of Changes

`freeformGradient()` in `@cssints/gradient-2d`: points only, a radial-gradient first paint without JS, its own `@supports` branch and marker, and an inverse-distance-weighting runtime sharing `src/canvas.ts` with mesh. Delaunay was looked at and rejected (the hull edge). Runtime 3.9 kB minified (1.9 kB gzipped); Chrome 1000×600 redraw 33 ms; 20 read-back points within 1 of 255. Minor changeset. Details in docs/wayfinder.md. Merged 2026-10-17.
