# @cssints/graph-layout

The discrete half of Eclipse Layout Kernel's layered (Sugiyama) pipeline: **cycle breaking by model order, longest-path
layering, ordering, crossing minimization over the result, placement, orthogonal routing** (four directions by default,
eight as an option, and a spline drawing of the same polyline) **and edge labels as slots**. A graph in, boxes, polylines and
label bands out — no DOM, no reactivity, no dependencies.

The contract is the Quint specs [`specs/patterns/graph-layout.qnt`](../apg-specs/specs/patterns/graph-layout.qnt),
[`specs/patterns/graph-layout-slots.qnt`](../apg-specs/specs/patterns/graph-layout-slots.qnt) and
[`specs/patterns/graph-layout-labels.qnt`](../apg-specs/specs/patterns/graph-layout-labels.qnt) of `@cssints/apg-specs`, their
scenarios are replayed against the generated reference models, against elk-rs and against this engine, and the differential
walks drive the engine and the models with the same seeded steps.

```sh
npm install @cssints/graph-layout
```

```ts
import { crossings, layout, minimizeCrossings, place, route } from "@cssints/graph-layout";

const sizes = Object.fromEntries(["a", "b", "c", "d"].map((id) => [id, { width: 40, height: 20 }]));

const graph = {
  nodes: ["a", "b", "c", "d"],
  sizes,
  edges: [
    { source: "a", target: "b" },
    { source: "a", target: "c" },
    { source: "b", target: "d" },
    { source: "c", target: "d" },
  ],
};

const ordered = layout(graph);
// { layers: [["a"], ["b", "c"], ["d"]], ranks: { a: 0, b: 0, c: 1, d: 0 }, slots: [["a"], ["b", "c"], ["d"]] }

minimizeCrossings(graph, ordered); // the same slots, uncrossed where a sweep can
crossings(graph, ordered); // 0
const boxes = place(graph, ordered); // a at (0, 20), b (70, 0), c (70, 40), d (140, 20) at 40x20 and 20/30 gaps
route(graph, ordered, boxes); // a polyline per edge, from a source's right border to its target's left
```

The array order of `nodes` is the **model order**: an edge whose target precedes its source is backwards, and phase 1
reverses it — which makes every effective edge run from a lower index to a higher one, so the graph is acyclic and layering
is one pass in model order.

A **slot** is a position in a layer, and a layer's slots are its nodes and its **dummies**: an edge whose ends are two or more
layers apart becomes one dummy per layer it crosses, named `a>d@1` (the edge `a>d`, layer 1). `slots` is the drawing order;
`layers` and `ranks` are the nodes alone, in the order they take among those slots. Parallel edges are one line, because a
drawing would show one.

| Function                      | Phase                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| `breakCycles(graph)`          | reverse every edge that points backwards in model order               |
| `assignLayers(graph, s?)`     | longest path from a source, or that layering with its edges shortened |
| `orderSlots(graph, layerOf)`  | slots per layer: its nodes in model order, then the dummies           |
| `layout(graph, options?)`     | all three, in that order                                              |
| `minimizeCrossings(graph, l)` | barycentre sweeps and a greedy switch over those slots, never worse   |
| `crossings(graph, layout)`    | crossing pairs, counted per layer boundary                            |
| `label(graph, l, b, r, req)`  | one box per requested route, at the middle boundary it crosses        |

| Function                      | Phase                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| `breakCycles(graph)`          | reverse every edge that points backwards in model order             |
| `assignLayers(graph)`         | longest path from a source, over the already-broken graph           |
| `orderSlots(graph, layerOf)`  | slots per layer: its nodes in model order, then the dummies         |
| `layout(graph)`               | all three, in that order                                            |
| `minimizeCrossings(graph, l)` | barycentre sweeps and a greedy switch over those slots, never worse |
| `crossings(graph, layout)`    | crossing pairs, counted per layer boundary                          |
| `label(graph, l, b, r, req)`  | one box per requested route, at the middle boundary it crosses      |
| `clusterBoxes(graph, b, pad)` | one box per cluster: what it holds, grown by the padding            |

`minimizeCrossings` is a heuristic with a guarantee: the layout it returns is only used if it has fewer crossings than the
one it was given, so composing it never costs a crossing.

## The second layering

`assignLayers(graph, "minimize-length")` and `layout(graph, { layering: "minimize-length" })` keep the same phases and choose
the layers for the length of the edges instead: `Σ (layer(target) − layer(source))` over the dummy-expanded graph, which is
`Σᵥ (indegree(v) − outdegree(v)) · layer(v)` with every edge at least one layer long. The longest path is the earliest
feasible layering, not always the shortest one: `a→b` beside `x1→x2→b`, in the model order `a, x1, x2, b`, lays out as
`a=0, x1=0, x2=1, b=2` and spans 4, while `a=1` spans 3.

The solver is a relaxation, not the exact min-cost flow the objective asks for. From the longest path it raises a node that
has more out-edges than in-edges into the highest layer its successors leave free, in reverse model order, in rounds until
no single node can move. Every move shortens the sum by at least one and keeps every edge pointing forward, so the rounds
terminate; the fixpoint is "no single node helps", which is not the same as the optimum. Two oracles say how close it gets.
Brute force over every feasible layering of 411 graphs of up to 7 nodes finds it optimal on all 411. elk-rs with
`elk.layered.layering.strategy: NETWORK_SIMPLEX`, the option that minimises this sum, gives the same layers and the same span
on the specs' six graphs; over 60 seeded graphs of up to 40 nodes the layer counts agree on all of them and the total span is
153 against ELK's 149 — 2 longer on two graphs (corpus 40 and corpus 55), which are the counterexamples the relaxation does
not climb out of.

Over the 120-graph corpus the option leaves the layers alone (239 of them, the same as the longest path) and shortens what is
drawn: dummies fall from 80 to 59, total span from 459 to 438, crossings from 310 at the model order and 65 after the sweep
to 274 and 55, and 12 of the 120 graphs lay out shorter than the default. It costs time: `assignLayers` 11.98 µs a graph
against 2.11 and `layout` 19.57 against 8.75 over 1 000 graphs, while the whole pipeline (layout, sweep, placement, routing)
is 375.34 µs against 432.25, because the sweep has fewer dummies to reorder.

`place` gives every slot a box: a layer is a column at its own x, its slots stack with `spacing.nodes`, the columns are
`spacing.layers` apart, sizes come from `graph.sizes` (a node without one is a point, and so is every dummy), then the boxes
move toward the median of their neighbours' centres and each layer settles onto its neighbours as one piece. A dummy is put on
the straight line between the two nodes its edge joins, clamped into the gap of the layer it crosses, which is where the
router will route through it. Over the specs' six graphs the placement is at least as straight as elk-rs with
`nodePlacement.strategy: SIMPLE` (80 px of total edge deviation against 102), and five of the six are perfectly straight.

## The second placement

`place(graph, layout, spacing, { placement: "brandes-kopf" })` is Brandes and Köpf's horizontal coordinate assignment, with
`"median"` the default and byte-identical to the passes above. Four vertical alignments — layers down and up, each resolved
leftmost and rightmost — align every slot with its median neighbour in the layer before, skipping a segment that crosses an
inner one (Brandes–Köpf's type-1 conflict) so a long edge's chain stays straight in preference to a node's. Each alignment is
compacted to the smallest coordinates the slot order and the spacing allow, by the longest path over the block graph its
aligned chains induce, and the four are balanced: the narrowest anchors the others, and each slot's y is the mean of the
middle two of its four candidates. Dummies are not aligned by the strategy; after the four alignments each is put on the
straight line between its edge's two nodes and clamped into its slot's gap, exactly as with the median, which is what the
router's channel assumes (16 of the 120-graph corpus's 164 dummy rows are clamped away from that line, against 25 for the
median).

The deviation — `Σ |centre(source) − centre(target)|` over the edges — is better on the seeded corpus and worse where one
alignment is already perfect, because the balance averages it away: 13 772.5 px over the 120 graphs against the median's
15 805 (−12.9%, better on 14 graphs, worse on 16, the same on 90), and 1 730 px over the 8 shapes against 1 365 — the
200-node cycle costs 35 px where the median is straight, and the dense 40 goes 1 365 → 1 695. Over the specs' six graphs the
median stays at 80 px and Brandes–Köpf is 140: the long edge of pick 4 and the three-cycle of pick 6 are 30 px off, which is
the balancing step's price, not a bug. elk-rs with `nodePlacement.strategy: BRANDES_KOEPF` totals 113.3 px on the six and
2 726.5 over 60 seeded graphs against 3 192.5 here; ELK lays those graphs out in its own slot order (the real nodes' order
within a column agrees on 12 of the 60) and resolves its own medians, so the oracle compares two drawings, not one algorithm.

It costs time: `place` is 120.46 µs a graph over 1 000 random graphs against 33.68 for the median, and 34.10 over 400
two-level graphs against 18.49. A cluster's box still holds no stranger: the containment passes pushes 10 boxes in one round
on the 120 two-level corpus, the same as the median, and 0 violations remain. `test/brandes-kopf.mjs` holds both strategies
to the placement suite's invariants and prints these numbers; `test/bench.mjs` carries the row.

A **self loop** (`a -> a`) is not a way to another layer: it leaves the layering, the slots and the crossings alone — the same
graph with loops lays out exactly as the graph without them — and `route` draws it as a bracket on the node's right border. A
skin that draws from the border midpoints needs a loop shape of its own; the engine's polyline is what such a shape follows.

`route` is the channel router: every layer boundary is a channel, every edge crossing it gets a track of its own there
(ordered by the height it leaves with, so two verticals never run on one line), the horizontals run at the slots' heights —
which is how a long edge passes through its dummy — and a node's ports are **one anchor per edge** along its right border
(outgoing) or left (incoming), evenly spaced and ordered by the height each edge leaves or arrives with, so two edges from one
node never share their stem.
Routes are axis-aligned polylines, monotone in x, they touch each boundary between their ends once, and none of them enters a
box. Two routes can share a line only inside a channel, where lines bundling is what a subway map does: per-edge ports took
that from 262 bundled corridor pairs on 120 random graphs to 5, and the per-edge lanes inside a channel are the next refinement
(the octilinear strategy in `docs/research/edge-routing.md`). Drawn over swept layouts the routes cut the crossings to 168
against 539 at the model order.

`route(graph, layout, boxes, { directions: 8 })` is the octilinear option, and `directions: 4` (the default) is the drawing
above, unchanged. A channel's jog becomes one 45° segment from the edge's own track to the right when the height it has to
change fits before the next layer's boxes; without that room it stays vertical. The bands stay horizontal at the slots' heights,
so a long edge still passes through its dummy, and both stems stay horizontal, so a port is still a port. Over the 120-graph
corpus that turns 96 of 365 jogs into diagonals (96 of 1 203 segments) and changes no bend at all: a jog is horizontal →
diagonal → horizontal either way. What it buys is a cut corner, not a straighter line: total route length falls from 37 682 to
37 200 px (1.3%) and the drawn crossings move from 168 to 174 (156 right-angle pairs plus 18 that touch a diagonal), while the
bundled corridors fall from 5 to 4. On the specs' six graphs six of twelve jogs become diagonals, length falls from 907 to
879 px and no crossing appears. The finding is that eight directions alone do not move a bend — it cuts a corner; the lattice
router below is the step that removes one.

## The second router

`route(graph, layout, boxes, { router: "lattice" })` is a second drawing behind the same `route`, and `"channels"` stays the
default and byte-identical. The unit is still one layer boundary: its channel is the vertical strip between the left layer's
right borders and the right layer's left edges, free of node boxes by construction. The strip's columns are a 6 px pitch with
its two edges kept; the rows are the height of every slot on both sides of the boundary (node centres, dummy heights, box tops
and bottoms) plus a uniform 6 px grid shared by the whole drawing, so two routes in different channels have rows in common. An
intersection is a lattice node and a move is right, up, down, or — with `directions: 8` — the two 45° diagonals; no move goes
left, so a path is monotone in x and crosses each boundary between its ends once.

A path pays `length + bends·wBend + reused·wReuse + crossings·wCross`, where `reused` is the number of routes already drawn
through the same lattice edge in that channel and `crossings` counts the routes already drawn there that the move cuts. The
edges are routed shortest first (port-to-port distance, ties by id), and the weight table carries what the earlier lines
taught it. The sweep is the point: over the 120-graph corpus, `wReuse` 0, 2, 5, 10 with `wCross` 0, 5, 20 and `wBend` 20
draws 2 crossings and 170 bundled corridor pairs at 0, 97 and 15 at 2, 112 and 4 at 5, 114 and 2 at 10 — so the per-line
inflation **separates** lines rather than bundling them: a positive reuse cost buys a lane of its own, and the bundles are
what routing shortest first with a free shared tile gives. `wCross` 20 is kept for the eight-direction case (13 crossings
against 30 at 0 there), and the pair (0, 20) is the default. Over the same 120 drawings: the channel router draws 168
crossings, 5 bundled pairs and 730 bends in 37 682 px; the lattice draws **2 crossings, 170 bundled pairs and 624 bends in the
same 37 682 px**, in 506 µs a graph against 9, and the whole pipeline (layout, sweep, placement, routing) costs 546 µs
against 58. Eight directions on the lattice bundle 77 pairs, bend 654 times, shorten the drawing to 35 599 px and draw 16
crossings at 853 µs: a 5.5% shorter line for 14 more crossings and 230 more bends than the four-direction lattice. On the
specs' six graphs the lattice takes picks 2, 4 and 6 from 8 bends to 4, 5 and 5 and draws no crossing either way. The large
shapes sit at the frame's edge: the 200-node chain routes in 1.7–1.8 ms and the 200-node cycle in 5.4–6.9 ms, both inside a
16.7 ms frame on this machine, while the dense 40 measured 15.8 and 18.1 ms on two runs, so it is not claimed as inside one.

The honest finding is the bundle count and where it comes from. The lattice is a clear win on crossings, bends and bundled
corridors over the channel router, but the crossing win is not the weight table's: it is the shortest-first order and the
shared rows, which funnel routes into a corridor and draw it once. Positive `wReuse` — the inflation the research note
describes — makes each line open another lane and puts the crossings back (97 at 2, 114 at 10), so it is an option, off by
default, for a drawing that wants parallel lines rather than one line. The lattice is also nine times the whole pipeline's
cost, almost all of it A\*: an option, not the default. Edges that touch a cluster keep the channel router's path, so the
border ports and the staircase are exactly what they were; self loops are the same bracket.

`route(graph, layout, boxes, { shape: "spline" })` keeps every route's `points`, ports and `borders` and adds `curve`: the
same polyline with every bend rounded, as an SVG `d` a skin assigns to a `<path>` — the consumer needs no serializer of its
own — while `points` stays what labels, crossings and ports read, which is why the curve is a function of the polyline alone.
A cubic per bend replaces the corner, its control points on the two segments at `(4/3) r tan(δ/4)` from the tangent points of
a circular arc; its tangent reach is at most half of each adjacent segment and its radius at most 8 px, so two bends sharing a
segment cannot overlap and the route's ends do not move.

Over the 8 shapes and 120 seeded graphs (1 232 bends) every bend is softened, the smallest radius is 0.833 px (a 1.7 px
segment's half) and the cap 8, the drawing is 3.70% shorter (71 229 to 68 591 px) and at most 2.34 px from the polyline, and
the drawn crossings fall from 249 to 237, one of the 128 drawings gaining one. Sampled with 16 chords per cubic and one per
straight segment, the polyline's count is its analytic 168 on the corpus, so the two numbers are the same measurement. With
`directions: 8` the same holds (502 bends, 1.29% shorter, 81 to 77), and over 60 clustered graphs 2 636 bends soften with
every port and border unmoved. The curve costs `route` 36.25 → 56.88 µs a graph. Against elk-rs with
`elk.edgeRouting: "SPLINES"` on the specs' six graphs, ELK draws 25 cubic segments for the 18 edges and 3 sampled crossings,
this engine 24 fillets and 0: ELK chooses its own control points and this rounds the corridor the channel router chose, so
the drawings differ rather than the numbers being a scoreboard.

`label(graph, layout, boxes, routes, requests, spacing)` is where an edge's word goes. Its x band is the channel of the
boundary the label sits at — `inset` px inside the previous layer's right border, and short of the next layer's left one, so a
request wider than the channel is clamped rather than allowed over a box. The boundary is the middle of the ones the route
crosses (`first + floor((last - first - 1) / 2)`), and the ideal y is the middle of the route's own segment in that channel.
At one boundary the labels are ordered by that y, ties by route id, and stacked top-down with `spacing.labels` between them;
a label is pushed down by the one above it and never moves back up, which is one pass, no search, and no two labels can overlap.
A loop has no boundary (`boundary: -1`) and gets a column beside its bracket.

Over 120 random graphs at the swept layouts that places all 379 requested labels: 351 sit exactly at their ideal band and the
stack moves the rest 0.68 px on average and 19.50 px at worst; 79 of the 119 boundaries carry two or more labels, the deepest
stack is 12, and the whole phase costs 10.36 µs a graph (against `route`'s 30.58 and `place`'s 32.74 over 1 000 graphs). A
greedy first-fit that tries the ideal band and then steps down and up by a label and a gap places all 379 as well, but 342 at the
ideal band, 1.94 px mean and 48.00 px worst — it buys 0.3 labels per 100 at 1.3 px of extra mean movement, which is why the
engine has the one-directional stack and not the search.

A **cluster** groups nodes under one box, one level deep: `graph.clusters` is `{ id, members }`, and the layering stays
hierarchy-agnostic — every node takes its longest-path layer, member or not, which is ELK's `INCLUDE_CHILDREN` reading (one flat
order with the cluster a box around some of it) and not the recursive one (a cluster as a node of its own layer). That buys three
things. A cluster's members sit in **one contiguous block** of every layer's slots, so `orderSlots` groups them first and the
barycentre sweep orders blocks — never a slot across a block, in the barycentre pass or in the greedy switch — by the mean of
their members' positions. The box `clusterBoxes` reports is the bounding box of the members and of the dummies of the long edges
between them, grown by `spacing.clusters.padding` (12), and it holds **no node that is not a member**: `place` reads the boxes
after its own passes and pushes every offender away — up when it sits above the cluster's block in its layer, down when below,
and the rest of the layer follows — until a round finds nothing, at most 8 rounds, then it throws rather than shipping a box
with a stranger in it. An edge with one end inside crosses the border **once, at a port of its own**: the left and right borders
spread their ports evenly, ordered by the height of the other end, ties by edge order, the way a node's ports spread, and the
path jogs to the port's height in the cluster's padding and in the gap beside it, where no box reaches, so the crossing adds two
bends and never a segment through a box; a top or bottom border needs no point of its own because the route already crosses it
at its own track, one per edge. `route` reports them as `borders: [{ cluster, point }]` and keeps a long edge's dummy inside its
cluster's box while the edge crosses the cluster's columns.

A graph with no clusters is untouched: the same layouts, placements and routes it had before this, so the suites print their
old numbers (168 drawn crossings at the swept layouts, 5 bundled pairs, 96 diagonals, 379 labels). Over 5 hand-built shapes and
120 random two-level graphs (902 nodes, 954 edges, 645 cross edges) the sweep with the blocks costs **507** crossings against
385 for the same graphs flattened — the price of contiguity — and the corpus needs **10 pushes in one round** to clear every
box; 1 310 ports sit on 251 borders, at most 18 on one, and use 5.3% to 94.7% of its height. The phase costs, over 400 two-level
graphs: layout 5.60 µs against 4.00 flattened, `place` 19.09 against 12.08, `route` 26.57 against 11.14. Against elk-rs with
`hierarchyHandling: INCLUDE_CHILDREN` on the three-cluster fixture both engines put each cluster's members in their own columns
in model order, both keep every box around its members and its members only, and each cross edge crosses each border exactly
once; the columns differ where the readings do — we layer the unclustered nodes with their edges (`x` and `y` in the first
column), ELK layers the clusters and puts them after every one of them, drawing `x>c` right to left — and the drawn crossings
of the fixture are 2 against ELK's 6.

Not here yet, and each its own slice: ports beyond the border midpoints, labels of loops inside the channels, a route crossing
the same band as a label's box, multi-line labels, compound graphs and the rest of the strategy knobs (splines, per-edge
weights).

the strategy knobs (Brandes–Köpf placement, per-edge weights).

loops inside the channels, a route crossing the same band as a label's box, multi-line labels, clusters inside clusters, the
recursive (cluster-as-node) layout, labels on a cluster's border, a crossing minimization that orders a block's inside against
the other clusters, and the strategy knobs.

## Tests

```sh
bun run test   # the specs' scenarios, elk-rs' boxes, the property suites, then the seeded walks in Chromium
bun run bench  # every phase over 1k random graphs, and a 200-node chain
```

The scenarios run against the engine under Bun; the walks drive the engine and the spec models with the same random steps and
compare the layers, then the slots, after every one; `@cssints/apg-specs` is a dev dependency and no published code imports
it. `test/elk-placement.mjs` runs the six graphs through elk-rs with the same boxes and the same pinned strategies, and fails
if the columns differ, if a box overlaps, or if the placement is less straight than ELK's simplest one. `test/brandes-kopf.mjs`
holds the second placement to the same invariants, prints both strategies' deviation, and compares it with elk-rs'
`BRANDES_KOEPF` on the six graphs and 60 seeded ones. `test/placement.mjs`
and `test/routing.mjs` hold the geometric contracts over shapes and seeded graphs, including that the router adds no overlap
outside a channel or a shared port, and that the sweep's layouts are drawn with fewer crossings than the model order's.
`test/clusters.mjs` holds the compound contract over five hand-built shapes and 120 random two-level graphs: contiguity in
every layer, a box per cluster that holds its members and no stranger, one crossing per cross edge per border and none for an
edge inside one, every port a point of its own on the border, no segment through a box, determinism, and the same graph with the
clusters removed routing by the flat contract; `test/elk-compound.mjs` is the elk-rs comparison with `INCLUDE_CHILDREN` above.
`test/octilinear.mjs` runs the same shapes and corpus through `directions: 8` and asserts what the eight directions promise:
every segment is horizontal, vertical or exactly 45°, a route never goes back, it crosses each boundary between its ends once,
no segment enters a box, a port is one anchor and each route leaves and arrives horizontally — and every diagonal replaces a
vertical with the bend count unchanged. `test/splines.mjs` holds the spline drawing's contract over the shapes, the corpus,
the eight-direction set and 60 clustered graphs: the points, ports and borders unchanged, one curve per route (loops
included), the curve's ends exactly at the polyline's, every bend and only a bend rounded, the 8 px and half-segment bounds,
no sampled chord in a box, the samples monotone in x, the curve no longer than the polyline — then the length, deviation and
crossing numbers above, and elk-rs with `SPLINES` on the six graphs. `test/labels.mjs` holds the labels' contract over the same shapes and corpus: one slot per
requested route in route order, the box inside its channel, no two labels overlapping, no label over a node's box, the ideal y
never moved up, the order at a boundary the routes' own, a request wider than the channel clamped, a loop's slot beside its
bracket, and the same graph labelled the same way twice — then the greedy first-fit's numbers above.

The property suite (`test/properties.mjs`) is the part the specs cannot carry — a spec's graph is a literal `pick` of six, so
everything the engine does on an arbitrary graph is checked as a property over 8 hand-built shapes and 400 seeded graphs (up
to 200 nodes, cycles, isolates, parallel edges, several components): an independent topological sort proves phase 1 leaves no
cycle, every effective edge points forward in model order, every node at layer `k` has a predecessor at `k - 1`, layers and
ranks are dense and in model order, every dummy sits strictly between its ends and in a slot of its own, no node is lost or
duplicated, the sweep keeps the occupants and never adds a crossing, and the same input gives the same output.

`test/layering.mjs` runs the same shapes and 120 seeded graphs through both strategies: every node's layer is integral and at
least 0, every effective edge points forward, the same graph lays out the same way twice, the default is the longest path
(the scenarios already pin that) and no layering is ever longer than it. Then the two oracles: brute force over every feasible
layering of 411 graphs of up to 7 nodes, and elk-rs with `NETWORK_SIMPLEX` on the specs' six graphs and 60 seeded ones,
comparing the layers, the span and the crossings of the drawing. The six agree with ELK exactly; the print names the seeded
graphs where the relaxation is two longer.

The scenarios run under Bun rather than plain Node because the oracle's sources import each other without file extensions,
which Bun and Vite resolve and Node does not; the browser run is the same code in a page with no Node built-ins.
