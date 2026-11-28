# @cssints/graph-layout

The discrete half of Eclipse Layout Kernel's layered (Sugiyama) pipeline: **cycle breaking by model order, longest-path
layering, ordering, crossing minimization over the result, placement, orthogonal routing** (four directions by default,
eight as an option) **and edge labels as slots**. A graph in, boxes, polylines and label bands out — no DOM, no reactivity, no
dependencies.

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
879 px and no crossing appears. The finding is that eight directions alone do not remove a bend; the A\* over a lattice with
per-line weights is the step that would, and it is the next slice.

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

Not here yet, and each its own slice: the A\* over a lattice with per-line weights, ports beyond the border midpoints, labels of
loops inside the channels, a route crossing the same band as a label's box, multi-line labels, compound graphs and the rest of
the strategy knobs (Brandes–Köpf placement, splines, per-edge weights).

## Tests

```sh
bun run test   # the specs' scenarios, elk-rs' boxes, the property suites, then the seeded walks in Chromium
bun run bench  # every phase over 1k random graphs, and a 200-node chain
```

The scenarios run against the engine under Bun; the walks drive the engine and the spec models with the same random steps and
compare the layers, then the slots, after every one; `@cssints/apg-specs` is a dev dependency and no published code imports
it. `test/elk-placement.mjs` runs the six graphs through elk-rs with the same boxes and the same pinned strategies, and fails
if the columns differ, if a box overlaps, or if the placement is less straight than ELK's simplest one. `test/placement.mjs`
and `test/routing.mjs` hold the geometric contracts over shapes and seeded graphs, including that the router adds no overlap
outside a channel or a shared port, and that the sweep's layouts are drawn with fewer crossings than the model order's.
`test/octilinear.mjs` runs the same shapes and corpus through `directions: 8` and asserts what the eight directions promise:
every segment is horizontal, vertical or exactly 45°, a route never goes back, it crosses each boundary between its ends once,
no segment enters a box, a port is one anchor and each route leaves and arrives horizontally — and every diagonal replaces a
vertical with the bend count unchanged. `test/labels.mjs` holds the labels' contract over the same shapes and corpus: one slot per
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
