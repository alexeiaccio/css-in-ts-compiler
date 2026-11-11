---
# cssints-h8wj
title: 'devtools xray: the layer, the bar button, the panel section'
status: completed
type: task
priority: high
created_at: 2026-11-11T14:27:45Z
updated_at: 2026-11-11T14:48:16Z
parent: cssints-4q3f
---

## What
The overlay half: one fixed layer under the highlight that draws the boxes (outline), the padding frame of the root,
the 4px grid inside it, the sibling spaces with their size, and a label with size/pad/radius; a bar button cycling
off -> element -> subtree -> page; `x` toggles it; the panel gets an X-ray section with the same numbers as text.

## Todo
- [x] `s.xray*` styles in `styles.ts` (layer, box, root, label, space, content frame), z-index under the highlight
- [x] `xrayScope` signal + cycle button (`data-devtools="xray"`, `data-scope`) after `pick`
- [x] The layer: boxes in document order, `title` per box, label + 4px grid only for the root in element/subtree
- [x] The panel section (`data-devtools="xray"`): size, padding, border, radius, gap, boxes/spaces counts
- [x] `x` in the open overlay (not while typing), and the page keeps it out of the way of the page's own `x`

## Acceptance
Pressing x on a picked element turns the page into a skeleton; the panel numbers match; the page stays usable (nothing
in the layer takes a pointer).



## Summary of Changes

- `packages/devtools/src/ui/overlay.tsx`: `xrayScope` (`off | element | subtree | page`), the bar's `xray` button after
  `pick` (`data-devtools="xray"`, `data-scope`, cycles), `x` in the open panel (not while the prompt box has the caret),
  a `measured` memo on the panel's 600 ms timer, the `XrayLayer` (boxes, the root's content box, the 4 px grid, the
  root's label, the sibling spaces with their size) and the `X-RAY` panel section (size, padding/border/radius/gap, the
  spaces of the root's children).
- `packages/devtools/src/ui/styles.ts`: `xrayLayer`, `xrayBox`, `xrayRoot`, `xrayContent`, `xraySpace`, `xrayValue`.
  The bar also wraps to a second row now and the class name / element title truncate instead of wrapping per letter: the
  seventh button in a 440 px dock squeezed them into a column.
- Solid 2's style object writes each key with `style.setProperty`, so the multi-word keys are kebab-case
  (`border-radius`, `background-image`) — camelCase was silently dropped.
- The page scope caps at 400 boxes, draws no label and no grid, and takes no pointer (the layer and its boxes are
  `pointer-events: none`).
