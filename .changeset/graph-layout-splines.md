---
"@cssints/graph-layout": minor
---

`route(graph, layout, boxes, { shape: "spline" })` adds `Route.curve`, the same route as an SVG path with every bend rounded
by a cubic whose tangent reach is capped at half of each adjacent segment and whose radius at 8 px; `points`, ports and
`borders` stay the polyline's and the default drawing is byte-identical. Over the 8 shapes and 120 seeded graphs the drawing
is 3.70% shorter (71 229 to 68 591 px), at most 2.34 px from the polyline, and drawn crossings fall from 249 to 237; against
elk-rs with `elk.edgeRouting: "SPLINES"` on the six spec graphs, 24 fillets and 0 crossings against ELK's 25 cubics and 3.
