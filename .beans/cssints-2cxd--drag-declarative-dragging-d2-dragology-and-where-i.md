---
# cssints-2cxd
title: 'drag: declarative dragging (D2 / Dragology), and where it would fit'
status: todo
type: feature
priority: low
created_at: 2026-11-04T09:21:02Z
updated_at: 2026-11-04T09:21:02Z
---

UIST 2026's best paper, Declarative Dragging (Horowitz, Blinn, Heer), inverts drag-and-drop: the author declares which future model states dragging an element should lead to, and the engine speculatively renders them, reads where the dragged element lands in each, and synthesises the feedback, snapping and animation itself. The library is Dragology: https://declarative-dragging.github.io/ (paper, demos, npm; SVG view trees on the web).

Why it is not a drop-in for the kit: our drags are widget values with APG keyboard semantics — a slider's value, a splitter's ratio, a knob's angle, a card's position in a list — and the models are one number or one array, not arbitrary view trees. Borrowing the engine would mean a second rendering model (SVG trees) under components that are plain DOM + attributes, and copying the source would not ship the drag's keyboard path, which is the part we must own.

Where it could genuinely help: a starter whose drag is free-form placement rather than a value — a card pile, a kanban board, a canvas of nodes — where 'which permutations are reachable' is the hard part and the animation is the point. The demo gallery's card piles (joshuahhh.com/dragology/#/demos/card-piles) is the shape to copy if we ever build one.

Done when (only if such a starter is wanted): one experiment — the same interaction built twice, our pointer plumbing against Dragology — and a written verdict on whether the kit ever takes the dependency, or keeps borrowing the idea (declare the reachable states, synthesise the feedback) without the library.
