---
"@cssints/graph-layout": minor
---

Octilinear routing as an option: `route(graph, layout, boxes, { directions: 8 })` turns a channel's vertical jog into one 45°
segment when the height it changes fits before the next layer's boxes. The bands stay horizontal at the slots' heights (a long
edge still passes through its dummy), the ports and stems are the orthogonal router's, and `directions: 4` — the default — is
byte-identical to the previous drawing. Over 120 random graphs 96 of 365 jogs become diagonals with no bend removed: length
falls 1.3% and drawn crossings move from 168 to 174, which is the measured reason the A\* over a lattice with per-line weights
is a separate slice.
