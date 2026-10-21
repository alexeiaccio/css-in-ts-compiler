# @cssints/css-grammar

## 0.4.0

### Minor Changes

- a9b28e5: New package `@cssints/gradient-2d`: `meshGradient("red, blue; green, yellow")` is the spec's `mesh-gradient()` where the browser has it (the `@supports` switch), else a canvas that a runtime draws, bicubic in oklab, as the background. No browser has the function yet. Positions and the `by`/`with` control points are build errors for now. css-grammar gives `css.types.gradient.mesh-gradient` and `freeform-gradient` own BCD entries (`version_added: false` for the tracked browsers), read only where BCD has no key, so the runtime ships to the builds whose targets lack them.

## 0.3.1

No changes in this release.

## 0.3.0

No changes in this release.

## 0.2.0

No changes in this release.
