---
# cssints-ezpl
title: 'board: an infinite DOM plane of real components'
status: completed
type: feature
priority: normal
created_at: 2026-11-06T10:15:47Z
updated_at: 2026-11-14T00:00:00Z
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


## Round two (2026-11-06)

The owner asked for perfect-arrows, arrows over the cards, one big canvas with all the connections and settings, and pointed at the mise-en-mode layer. Shipped: the whole theme on one plane (19 tokens, 5 real components, 23 uses), the plane given its own content size (`width`/`height`) so pan/zoom/Fit explore a 1354x808 map, arrows from perfect-arrows drawn over the cards without a casing, a settings bar with Fit, the zoom value and a mode switch that sets `data-mode` on the viewport (the theme's look), and a layout that is a function of the token lists. 8 conformance tests.

Left from the bean: editing a token value on the board (the management action) and an outline view. Curved routing is done; routing *around* cards is not (and is where pave would enter if a real map needs it).

## Round three (2026-11-14): the two management actions

The bean's own "done when" had two items left, and they were the ones that make the board a management view rather than a
picture of one.

**A token's value is a field.** A token node may state the CSS property it feeds (`property: "color"`, `"border-radius"`,
`"padding"`, `"font-size"`); its card then carries the value as an input instead of a chip. What is typed is judged by
`CSS.supports(property, value)` and, if it holds, set on the board's *world* element as the theme's own custom property
(`color.highlight` → `--color-highlight`, the naming `createTokens` already uses). One edit therefore moves everything under
it: the card's swatch, any other token written in terms of it, and the real components in the previews. Enter or a blur
applies, Escape abandons the draft, an empty field is the theme's value again (the override is dropped, not set to `""`), and
a value the property refuses keeps the invalid ring and never reaches the plane. The field starts from what the plane is
*using* (`getComputedStyle(world).getPropertyValue('--token')`), not from `detail` — a colour's `detail` is its role
("accent"), and the read is repeated on a mode switch, since the same token is another colour in the dark look. A token
without `property` stays text, so nothing is applied that has no property to judge it.

Two things the field had to take from the rest of the board: a pointer inside it must not start a card drag (the card's
`pointerdown` stops at a field, so text selection survives) and its keys must not reach the plane's key handler (which pans
and drops the selection), so the field stops `keydown` propagation.

**The outline.** A `<details>` under the plane lists every card in document order — name, kind, what it reaches — and one
press makes the card current, puts it in the middle of the frame and gives it the focus (`preventScroll`, because the plane
is transformed rather than scrolled and a focus scroll would break the centring). The pan is `panBy` arithmetic: the world is
centred on the plane and the plane's origin is its own centre, so the offset that centres a card is the card's distance from
the world's centre, scaled, less the pan it already has.

Conformance: two tests in `board.browser.test.tsx` (the value applied, refused, abandoned, cleared, and a colour's swatch
following it; the outline's order, its text, the centring within a pixel, the `aria-current` and the focus), 11 in the file.
Stories: the three existing ones now carry the fields; `r/board.json` and `llms.txt` regenerated.

Left, on purpose: the edit is not reported to the host (it lives on the plane's world element, and a page that wants to keep
it would own the value), routing *around* cards (pave, if a real map needs it), and undo of a committed edit.
