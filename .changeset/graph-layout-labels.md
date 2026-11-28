---
"@cssints/graph-layout": minor
---

Edge labels as slots. `label(graph, layout, boxes, routes, requests, spacing)` gives every requested route one box: the x band
is the channel of the layer boundary the label sits at (a wider request is clamped to it, so a label cannot reach a node's box),
the boundary is the middle of the ones the edge crosses, and the ideal y is the middle of the route's own segment in that
channel. At one boundary the labels are ordered by that y, ties by route id, and stacked top-down — a label is only ever pushed
down, so one pass places them with no search and no two overlap. A loop gets `boundary: -1` and a column beside its bracket.

`route`'s channel arithmetic moved into `channels(graph, layout, boxes)`, which both phases read; the router's output is
byte-identical. Over 120 random graphs at the swept layouts all 379 labels are placed, 351 at their ideal band, 0.68 px mean and
19.50 px worst drift, 79 of 119 boundaries carrying two or more labels and the deepest stack 12; a greedy first-fit places all
379 too but only 342 at the ideal band (1.94 px mean, 48.00 px worst), so the search is not worth its cost. The phase costs
10.36 µs a graph against `route`'s 30.58 and `place`'s 32.74 over 1 000 graphs.
