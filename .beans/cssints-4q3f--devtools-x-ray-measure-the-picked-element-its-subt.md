---
# cssints-4q3f
title: 'devtools: X-ray — measure the picked element, its subtree, the page'
status: completed
type: epic
priority: high
created_at: 2026-11-11T14:27:27Z
updated_at: 2026-11-11T14:48:16Z
---

## What
A mode in the devtools overlay that turns the page (or a picked element) into a skeleton and draws its measurements:
border-box sizes, padding, border, radius, the spacing between siblings, and a 4px grid. Gridray (Chrome Web Store,
0.2.0) is the reference: a frame over the UI, everything read live from the page; not a CSS-grid track overlay.

## Why
The overlay already knows which class won every property, but not how big the result is. Design QA on a dev server
asks the other question: how tall is this, what is the padding, what is the radius, and what is the space between
these two. All of it is readable in the page (`getBoundingClientRect`, `getComputedStyle`), so no extension and no CDP.

## Shape
`src/core/xray.ts` measures (host-agnostic, like the rest of core); `src/ui` draws one layer, `position: fixed`,
pointer-events off, under the highlight. The bar gets one button cycling off -> element -> subtree -> page; the panel
gets an X-ray section with the numbers as text; `x` toggles it.

## Children
- the model (`src/core/xray.ts`)
- the layer and the panel section
- the browser check, the docs, the changeset
