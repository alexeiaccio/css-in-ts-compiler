---
"@cssints/graph-layout": minor
---

Ports on the border, one per edge: `route` no longer starts every edge at its source's midpoint. A node's outgoing edges get
evenly spaced anchors along its right border, ordered by the height each leaves with; its incoming edges the same along the
left, ordered by the height each arrives with. Two edges from one node therefore never share their stem, and the smallest graph
shows it: the diamond's `a>b` leaves at a third of the border and `a>c` at two thirds.

Over 120 random graphs the shared corridors fell from 262 bundled segment pairs to 5 — only the ones inside a channel remain,
which is the bundling a subway map draws once — and the routes still cut the drawn crossings to 168 against 539 at the model
order. Against elk-rs with `elk.portConstraints: FIXED_SIDE` every route leaves and arrives on the modelled side; the port order
agrees on 13 of 24 outgoing lists and 10 of 24 incoming, because ELK orders a target's ports by the edge order and this engine
orders them by the height each arrives with.
