# @cssints/graph-layout

The discrete half of Eclipse Layout Kernel's layered (Sugiyama) pipeline: **cycle breaking by model order, longest-path
layering, ordering, and crossing minimization over the result**. A graph in, layers and slots out — no DOM, no reactivity, no
dependencies.

The contract is the Quint specs [`specs/patterns/graph-layout.qnt`](../apg-specs/specs/patterns/graph-layout.qnt) and
[`specs/patterns/graph-layout-slots.qnt`](../apg-specs/specs/patterns/graph-layout-slots.qnt) of `@cssints/apg-specs`, their
scenarios are replayed against the generated reference models, against elk-rs and against this engine, and the differential
walks drive the engine and the models with the same seeded steps.

```sh
npm install @cssints/graph-layout
```

```ts
import { crossings, layout, minimizeCrossings } from "@cssints/graph-layout";

const graph = {
  nodes: ["a", "b", "c", "d"],
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

Not here yet, and each its own slice: coordinates and spacing, edge routing (orthogonal now, octilinear after the metro-map
notes in `docs/research/edge-routing.md`), ports, labels, compound graphs and the strategy knobs.

## Tests

```sh
bun run test   # the specs' scenarios, the property suite, then the seeded differential walks in Chromium
bun run bench  # the phases, the sweep, the crossings and a 200-node chain over 1k random graphs
```

The scenarios run against the engine under Bun; the walks drive the engine and the spec models with the same random steps and
compare the layers, then the slots, after every one; `@cssints/apg-specs` is a dev dependency and no published code imports
it.

The property suite (`test/properties.mjs`) is the part the specs cannot carry — a spec's graph is a literal `pick` of six, so
everything the engine does on an arbitrary graph is checked as a property over 8 hand-built shapes and 400 seeded graphs (up
to 200 nodes, cycles, isolates, parallel edges, several components): an independent topological sort proves phase 1 leaves no
cycle, every effective edge points forward in model order, every node at layer `k` has a predecessor at `k - 1`, layers and
ranks are dense and in model order, every dummy sits strictly between its ends and in a slot of its own, no node is lost or
duplicated, the sweep keeps the occupants and never adds a crossing, and the same input gives the same output.

The scenarios run under Bun rather than plain Node because the oracle's sources import each other without file extensions,
which Bun and Vite resolve and Node does not; the browser run is the same code in a page with no Node built-ins.
