---
"@cssints/graph-layout": minor
---

Orthogonal routing: `route(graph, layout, boxes)` returns one polyline per edge, from the source's right border to the
target's left. Every layer boundary is a channel; each edge crossing it gets a track of its own there, ordered by the height it
leaves with, so two verticals never run on one line. The horizontals run at the slots' heights — which is how a long edge
passes through its dummy — and a node's ports are the midpoints of its borders. The routes are monotone in x, touch each
boundary between their ends once, and never enter a box.

Two routes can share a line only at a port they share or inside a channel, where lines bundling is what a subway map does: over
120 random graphs that is 262 bundled corridor pairs, and per-edge lanes inside a channel are the next refinement. Drawn over
the swept layouts the routes cut the crossings to 140 against 481 at the model order (71% fewer), which is the sweep's win
surviving the drawing. A route costs 21 µs over the 1000-graph corpus, and the browser test draws one as an SVG path and lets
the DOM measure it.
