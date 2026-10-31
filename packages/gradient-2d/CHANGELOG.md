# @cssints/gradient-2d

## 0.22.0

### Patch Changes

- Updated dependencies [988df79]
  - cssints@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [e69636e]
  - cssints@0.21.0

## 0.20.0

### Patch Changes

- cssints@0.20.0

## 0.19.0

### Patch Changes

- cssints@0.19.0

## 0.18.0

### Patch Changes

- cssints@0.18.0

## 0.17.0

### Patch Changes

- cssints@0.17.0

## 0.16.0

### Patch Changes

- cssints@0.16.0

## 0.15.0

### Patch Changes

- cssints@0.15.0

## 0.14.0

### Patch Changes

- cssints@0.14.0

## 0.13.1

No changes in this release.

## 0.13.0

### Patch Changes

- cssints@0.13.0

## 0.12.1

No changes in this release.

## 0.12.0

### Patch Changes

- Updated dependencies [a694911]
- Updated dependencies [ee3e52b]
  - cssints@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [02a4ef7]
  - cssints@0.11.0

## 0.10.0

### Patch Changes

- cssints@0.10.0

## 0.9.0

### Patch Changes

- cssints@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [60502ee]
  - cssints@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [135e011]
- Updated dependencies [561fc47]
- Updated dependencies [a269a19]
- Updated dependencies [91616c0]
  - cssints@0.7.0

## 0.6.1

No changes in this release.

## 0.6.0

### Patch Changes

- cssints@0.6.0

## 0.5.2

No changes in this release.

## 0.5.1

No changes in this release.

## 0.5.0

### Patch Changes

- Updated dependencies [c23f8ea]
  - cssints@0.5.0

## 0.4.0

### Minor Changes

- defb99d: `freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")`: the spec's `freeform-gradient()` where the
  browser has it, else a stack of radial gradients for the first paint (a layer per point, so freeform has a fallback without
  JS where mesh has only its average colour) and a canvas the runtime redraws (inverse-distance weighting, the weight of a
  point `spread / d²`, in oklab or srgb — this package's rule, not the spec's, which is not public and may be named
  `diffusion-gradient()`). Points only: a point is `<color> <number>? <position>`; a line, a shape, a length and a second
  point at one position are build errors. Mesh is unchanged; the runtime now carries both rules (3.9 kB minified, 1.9 kB
  gzipped, against 2.9/1.6 for mesh alone).
- a9b28e5: New package `@cssints/gradient-2d`: `meshGradient("red, blue; green, yellow")` is the spec's `mesh-gradient()` where the browser has it (the `@supports` switch), else a canvas that a runtime draws, bicubic in oklab, as the background. No browser has the function yet. Positions and the `by`/`with` control points are build errors for now. css-grammar gives `css.types.gradient.mesh-gradient` and `freeform-gradient` own BCD entries (`version_added: false` for the tracked browsers), read only where BCD has no key, so the runtime ships to the builds whose targets lack them.

### Patch Changes

- Updated dependencies [6687dc2]
- Updated dependencies [3d97232]
  - cssints@0.4.0
