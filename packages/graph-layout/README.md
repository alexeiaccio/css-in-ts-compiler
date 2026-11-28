# @cssints/graph-layout

The discrete half of Eclipse Layout Kernel's layered (Sugiyama) pipeline: **cycle breaking by model order, longest-path
layering, ordering, crossing minimization over the result, placement and orthogonal routing**. A graph in, boxes and polylines
out — no DOM, no reactivity, no dependencies.

The contract is the Quint specs [`specs/patterns/graph-layout.qnt`](../apg-specs/specs/patterns/graph-layout.qnt) and
[`specs/patterns/graph-layout-slots.qnt`](../apg-specs/specs/patterns/graph-layout-slots.qnt) of `@cssints/apg-specs`, their
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

| Function                      | Phase                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| `breakCycles(graph)`          | reverse every edge that points backwards in model order             |
| `assignLayers(graph)`         | longest path from a source, over the already-broken graph           |
| `orderSlots(graph, layerOf)`  | slots per layer: its nodes in model order, then the dummies         |
| `layout(graph)`               | all three, in that order                                            |
| `minimizeCrossings(graph, l)` | barycentre sweeps and a greedy switch over those slots, never worse |
| `crossings(graph, layout)`    | crossing pairs, counted per layer boundary                          |

`minimizeCrossings` is a heuristic with a guarantee: the layout it returns is only used if it has fewer crossings than the
one it was given, so composing it never costs a crossing.

`place` gives every slot a box: a layer is a column at its own x, its slots stack with `spacing.nodes`, the columns are
`spacing.layers` apart, sizes come from `graph.sizes` (a node without one is a point, and so is every dummy), then the boxes
move toward the median of their neighbours' centres and each layer settles onto its neighbours as one piece. A dummy is put on
the straight line between the two nodes its edge joins, clamped into the gap of the layer it crosses, which is where the
router will route through it. Over the specs' six graphs the placement is at least as straight as elk-rs with
`nodePlacement.strategy: SIMPLE` (80 px of total edge deviation against 102), and five of the six are perfectly straight.

`route` is the channel router: every layer boundary is a channel, every edge crossing it gets a track of its own there
(ordered by the height it leaves with, so two verticals never run on one line), the horizontals run at the slots' heights —
which is how a long edge passes through its dummy — and a node's ports are the midpoints of its right and left borders.
Routes are axis-aligned polylines, monotone in x, they touch each boundary between their ends once, and none of them enters a
box. Two routes can share a line only at a port they share or inside a channel, where lines bundling is what a subway map
does: over 120 random graphs that is 262 bundled corridor pairs, and per-edge lanes inside a channel are the next refinement
(the octilinear strategy in `docs/research/edge-routing.md`). Drawn over swept layouts the routes cut the crossings to 140
against 481 at the model order.

Not here yet, and each its own slice: octilinear routing, ports beyond the border midpoints, labels, compound graphs and the
strategy knobs.

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

The property suite (`test/properties.mjs`) is the part the specs cannot carry — a spec's graph is a literal `pick` of six, so
everything the engine does on an arbitrary graph is checked as a property over 8 hand-built shapes and 400 seeded graphs (up
to 200 nodes, cycles, isolates, parallel edges, several components): an independent topological sort proves phase 1 leaves no
cycle, every effective edge points forward in model order, every node at layer `k` has a predecessor at `k - 1`, layers and
ranks are dense and in model order, every dummy sits strictly between its ends and in a slot of its own, no node is lost or
duplicated, the sweep keeps the occupants and never adds a crossing, and the same input gives the same output.

The scenarios run under Bun rather than plain Node because the oracle's sources import each other without file extensions,
which Bun and Vite resolve and Node does not; the browser run is the same code in a page with no Node built-ins.
