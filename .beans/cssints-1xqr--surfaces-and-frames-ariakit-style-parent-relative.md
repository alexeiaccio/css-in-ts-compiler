---
# cssints-1xqr
title: 'Surfaces and frames: Ariakit-style parent-relative colour and concentric geometry'
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T14:54:06Z
updated_at: 2026-09-29T15:06:16Z
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

## Resolution

Findings: [docs/research/surfaces-frames.md](../docs/research/surfaces-frames.md).

- **Kernels (verified in Chrome 154, three or more nesting depths, computed radius and background).** Frame (radius, padding, border, margin): 40 lines / 823 B (667 B min) with registered inputs; 24 / 547 B with px/rem only. Surface (lighten, darken, contrast via a site-class `--_d`): 29 lines / 546 B (434 B min) registered; 19 / 396 B unregistered. Ariakit: `.ak-frame` 42 lines / 2 796 B (+18 `@property`), `.ak-layer` family 100 lines / 6 221 B (+76 `@property`, ~12 KB min in total). Our frame kernel gives the same radii as Ariakit on the same tree.
- **`inherit()` removes the odd/even trick** (frame 12 lines, surface 6 lines, both measured correct) but no browser ships it: Chrome 154 is off by default (works with `--enable-blink-features=CSSInheritFunction`), chromestatus "Proposed", Firefox no signal, WebKit open PR behind a flag, no BCD entry. No other shipped mechanism (var, inherit keyword, if(), @function) can replace it.
- **Browser floor (BCD 8.1.3).** Frame odd/even: Chrome 111, Firefox 151, Safari 18. Surface odd/even: Chrome 122, Firefox 151, Safari 18. `inherit()` variants: none.
- **Contrast is not guaranteed:** an OKLCH lightness threshold gives 4.61:1 worst case on greys but 3.71:1 on chromatic colours; the surface is "tonal steps", only a build-time check can claim a ratio.
- **Cost:** odd/even is about +50% style recalc on affected elements (19 → 29 ms for 19 530 nested elements); `inherit()` about +10%.
- **API:** `frame()` and `surface()` are chaining contexts; site classes only set custom properties; kernel emitted once, by key, into a layer below `_.a`; `@property` inputs at the top of the sheet; build errors for `frame()` mixed with `padding`/`margin`/`borderRadius`/`border*` and `surface()` mixed with `bg` in one `cn()`.
- **Recommendation: later, not 0.1.** Frames first, then surfaces, as an opt-in module with odd/even emission; move to `inherit()` when two engines ship it (the API does not change). For 0.1 keep only a seam (add a global rule by key, in a layer below `_.a`, reserve `_.k`); surfaces stay an explicit token ladder.
