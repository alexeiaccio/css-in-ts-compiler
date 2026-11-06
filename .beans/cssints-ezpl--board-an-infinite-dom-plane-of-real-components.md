---
# cssints-ezpl
title: 'board: an infinite DOM plane of real components'
status: in-progress
type: feature
priority: normal
created_at: 2026-11-06T10:15:47Z
updated_at: 2026-11-06T10:45:53Z
---

A plane you place real components on: the starter the dragging note (`cssints-2cxd`) named as the right home for free-form
placement, and the one thing `panzoom` (one image in a viewport) and `diagram` (nodes at fixed coordinates) do not cover.

## References (2026-11-06)

- **sktch** (https://github.com/microbians/sktch) — a Canvas2D framework whose "loose grid" repaints only the regions that
  changed. Not adopted: it is the price of painting yourself (dirty rects, hit testing, text), and a DOM board gets all of it
  from the browser.
- **pave** (https://github.com/baku89/pave) — an environment-agnostic SVG/Path2D toolkit: offsetting, stroking, boolean
  operations, positions/normals/tangents, resampling, curve fitting, node editing, raycasts, repeat-along; immutable plain
  paths, pure functions, arcs preserved. The candidate for edge routing once an edge is more than a straight line.
- **glisp / canvas** (https://glisp.app/canvas/) — a vector drawing app whose drawing is a program. The document shape to
  copy: items are data, the style over them is a program — here, already `css.*`.
- **zoah** (https://zoah.com/) — an infinite DOM canvas where the elements on the plane are production code, variables are
  real CSS/JS variables, and hover/focus are live. The thesis this kit already holds; the checklist is its chrome.

## The shape

- A DOM plane: `scale` + `translate` on a container, not a canvas. `createPanZoom`'s gesture and key maths is reusable; its
  `imageProps` is one image, so the primitive needs a plane member rather than a re-use of the widget.
- A card is a real kit component at `x/y/w/h`; the document is a node list (`id`, box, kind, values); the styles are tokens.
- Edges are SVG paths behind the cards, trimmed to the borders as `diagram` does today.
- Keyboard path of its own: a roving tab stop across cards, arrows move (Shift: resize), Escape drops the selection, Delete
  removes, one live region announces the move. Plus an outline view — a 2-D plane is not a document, and the accessibility bar
  (apps/ui/README.md) applies to a board as much as to a chart.
- Refused: a canvas renderer, a constraint solver, shader layers, CRDT sync.

## Done when

One starter `board` in `apps/ui/src/registry/board/`: the plane with pan/zoom (keys and pointer), three or four real cards
(two kit components, one frame with a title), one or two edges between them, selection with its keyboard path, an inspector
that edits a card's value and a token, an outline list, a story with a seeded board, and a conformance test that reads the
plane's transform and the selection. Decisions recorded in `docs/wayfinder.md`.


## Progress (2026-11-06)

Shipped as a **design system map** rather than a generic canvas: `apps/ui/src/registry/board/` with token cards (swatch, text value, the rule behind it), part cards holding real components (Button, Badge) in an `inert` body, an edge per use, a current card that dims what it does not reach, pointer drag with a plane clamp, arrow nudge, and `createPanZoom` for pan/zoom (its roledescription overridden to "board"). The edge geometry was extracted to `apps/ui/src/registry/route.ts` and is shared with the diagram. 6 conformance tests, the site test drives the page, the map is in the registry (`r/board.json`) and in wayfinder.

Left for this bean: editing a token value on the board (the management action), an outline view, and curved/avoiding edge routing (where pave would enter).
