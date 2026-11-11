---
# cssints-209t
title: 'devtools xray: the model in core'
status: completed
type: task
priority: high
created_at: 2026-11-11T14:27:45Z
updated_at: 2026-11-11T14:48:16Z
parent: cssints-4q3f
---

## What
`packages/devtools/src/core/xray.ts`: `xray(root, { depth, max })` -> the border boxes of the root and its subtree,
each with its computed padding, border widths, corner radii, row/column gap and a label; the spaces between adjacent
siblings (the margin or gap, as the layout produced it); and the 4px grid origin. Plain browser code (computed style
and rects, no failure), added to `plainCode` with its reason; exported from `core/index.ts`.

## Todo
- [x] Measure: rect, padding, border, radius (px only; a percentage corner is 0), row/column gap, display, label
- [x] Walk `children` to `depth` (default 6) under a `max` (default 400); skip `display: contents`/`none`
- [x] Spaces between adjacent sibling boxes, both axes, when >= 1px, capped
- [x] The page mode is the same call with `document.body`, no new code path

## Acceptance
The demo's action button, measured in Chromium: the box equals `getBoundingClientRect`, padding and radius equal the
computed style, and the gaps between two buttons equal the space the browser leaves.



## Summary of Changes

- `packages/devtools/src/core/xray.ts`: `xray(root, { depth, max, spaces })` -> `Xray` (`root`, `boxes`, `spaces`,
  `grid`). Each `Box` is the border box in viewport coordinates plus computed padding, border widths, four corner radii,
  row/column gap, display and a `tag#id.class` label; `Space` is the room between adjacent siblings on each axis. The
  root is measured even when its own box is `display: contents` (0 x 0, labelled), and the walk stops at `max` boxes.
- `packages/devtools/src/core/index.ts`: `xray`, `GRID` and the types are exported with the rest of the core.
- The depth limit still measures the root's children when `spaces` asks for them: the element scope draws the root alone
  and still shows the spacing between its children.
- No `Element` in the model: a host other than the overlay draws it too. Plain code (computed style and rects, no
  failure); no lint exemption was needed, so `vite.config.ts` is untouched.
