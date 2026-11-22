---
# cssints-2cxd
title: 'drag: declarative dragging (D2 / Dragology), and where it would fit'
status: completed
type: feature
priority: low
created_at: 2026-11-04T09:21:02Z
updated_at: 2026-11-22T00:00:00Z
---

UIST 2026's best paper, Declarative Dragging (Horowitz, Blinn, Heer), inverts drag-and-drop: the author declares which future model states dragging an element should lead to, and the engine speculatively renders them, reads where the dragged element lands in each, and synthesises the feedback, snapping and animation itself. The library is Dragology: https://declarative-dragging.github.io/ (paper, demos, npm; SVG view trees on the web).

Why it is not a drop-in for the kit: our drags are widget values with APG keyboard semantics — a slider's value, a splitter's ratio, a knob's angle, a card's position in a list — and the models are one number or one array, not arbitrary view trees. Borrowing the engine would mean a second rendering model (SVG trees) under components that are plain DOM + attributes, and copying the source would not ship the drag's keyboard path, which is the part we must own.

Where it could genuinely help: a starter whose drag is free-form placement rather than a value — a card pile, a kanban board, a canvas of nodes — where 'which permutations are reachable' is the hard part and the animation is the point. The demo gallery's card piles (joshuahhh.com/dragology/#/demos/card-piles) is the shape to copy if we ever build one.

Done when (only if such a starter is wanted): one experiment — the same interaction built twice, our pointer plumbing against Dragology — and a written verdict on whether the kit ever takes the dependency, or keeps borrowing the idea (declare the reachable states, synthesise the feedback) without the library.

## Done (2026-11-22)

The experiment was the **reorderable list**, because both sides ship one: Dragology's consumer example and the kit's
`reorder` starter (wayfinder entry, same date).

- **Not taken.** `dragology@0.2.0` is React-only (`Draggable` returns a React SVG element, `SetState` is React's) and renders
  SVG view trees: a second renderer under components that are DOM attributes, React in a Solid kit, and the keyboard and ARIA
  path left to build by hand. A probe app of one list bundles to 357 kB / 117 kB gzip.
- **Borrowed.** The animated landing, which was the one thing it gave that the kit lacked: `apps/ui/src/registry/flip.ts`
  (capture the boxes, play the delta with WAAPI after the DOM update, skip reduced motion), used by `reorder`, with the row
  assertion reading `getAnimations()`.
- The paper's declarative half already exists as data here (`snapCandidates` and `landing` in `createCanvas`, the dropzone's
  targets, the board's columns); a pile starter would want the animation, not the engine.
