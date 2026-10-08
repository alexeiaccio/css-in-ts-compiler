---
# cssints-11pj
title: 'motion(): animation presets as kernels over keyframes()'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
parent: cssints-dk1q
---

## What
`motion().preset("fade-in").duration("300ms").delay(..)` chain: a kernel per preset built on the existing `keyframes()`, custom properties for duration/delay/easing, `prefers-reduced-motion` handled in the kernel.

## Sources
- https://github.com/romboHQ/tailwindcss-motion (https://rombo.co/tailwind/ tab)
- https://github.com/jamiebuilds/tailwindcss-animate
- https://github.com/animate-css/animate.css
- https://github.com/formkit/auto-animate (for the runtime idea, out of scope)

## Shape
- scope `motion`; presets: fade/slide/scale/blur in and out, loop variants from tailwindcss-motion.
- conflicts: `animation*`.

## Todo
- [ ] preset table -> keyframes kernels
- [ ] chain member + reduced-motion rule
- [ ] fixture
