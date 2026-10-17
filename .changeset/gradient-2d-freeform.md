---
"@cssints/gradient-2d": minor
---

`freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")`: the spec's `freeform-gradient()` where the
browser has it, else a stack of radial gradients for the first paint (a layer per point, so freeform has a fallback without
JS where mesh has only its average colour) and a canvas the runtime redraws (inverse-distance weighting, the weight of a
point `spread / d²`, in oklab or srgb — this package's rule, not the spec's, which is not public and may be named
`diffusion-gradient()`). Points only: a point is `<color> <number>? <position>`; a line, a shape, a length and a second
point at one position are build errors. Mesh is unchanged; the runtime now carries both rules (3.9 kB minified, 1.9 kB
gzipped, against 2.9/1.6 for mesh alone).
