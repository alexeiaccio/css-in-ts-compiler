---
# cssints-1xqr
title: 'Surfaces and frames: Ariakit-style parent-relative colour and concentric geometry'
status: todo
type: task
tags:
    - wayfinder:research
created_at: 2026-09-29T14:54:06Z
updated_at: 2026-09-29T14:54:06Z
parent: cssints-vy0o
---

## Question

Ariakit Tailwind derives values from the DOM parent, which a build-time compiler cannot know:
- `ak-layer`: a surface colour relative to the parent surface (lighten, darken, contrast) through relative OKLCH.
- `ak-frame`: concentric radius, `r = r_parent − (padding_parent + border_parent + margin)`, with clamps; radius and padding pairs by token name; borders and rings in the maths; cover and join.
Both read the parent through odd/even custom-property pairs selected by `@container style()`.

What should cssints offer here, and at what cost?

- Read the Ariakit source (packages/ariakit-tailwind: src/input.ts, src/output.css, readme.md; a clone may exist in the opencode temp dir) and extract the minimal CSS kernel for (a) concentric frames with radius, padding and border, and (b) surfaces with lighten, darken and contrast. Give the size of each in lines and bytes, and what can be dropped.
- Browser support from BCD for the features the kernels need: `@container style()` on custom properties, relative colour syntax, `if()`, `round()`/`mod()`/`sign()`, and the CSS Values 5 `inherit()` function. Can `inherit()` (or anything else shipped) replace the odd/even trick, and which browsers have it?
- How it maps onto cssints: `frame()` and `surface()` as chaining contexts like `flex()` (docs/API.md "Authoring surface"); values from tokens ("Tokens", "Themes"); the kernel emitted once into the global sheet only when used (which cascade layer?); per-site classes that only set custom properties; what types and the build can check (token types, radius/padding pairs) and what only the browser can.
- Prior art worth one line each: other libraries with concentric radius or parent-relative surfaces.

Answer: findings in docs/research/surfaces-frames.md, a sketch of the API in TS, the kernel sizes and the browser floor, and a recommendation (0.1, later, or never).
