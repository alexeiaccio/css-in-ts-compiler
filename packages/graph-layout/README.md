# @cssints/graph-layout

The discrete half of Eclipse Layout Kernel's layered (Sugiyama) pipeline: **cycle breaking by model order, longest-path
layering, ranks in model order**. A graph in, layers and ranks out — no DOM, no reactivity, no dependencies.

The contract is the Quint spec [`specs/patterns/graph-layout.qnt`](../apg-specs/specs/patterns/graph-layout.qnt) of
`@cssints/apg-specs`, and the same eight scenarios are replayed against the generated reference model, against elk-rs and
against this engine.

```sh
npm install @cssints/graph-layout
```

```ts
import { layout } from "@cssints/graph-layout";

layout({
  nodes: ["a", "b", "c", "d"],
  edges: [
    { source: "a", target: "b" },
    { source: "a", target: "c" },
    { source: "b", target: "d" },
    { source: "c", target: "d" },
  ],
});
// { layers: [["a"], ["b", "c"], ["d"]], ranks: { a: 0, b: 0, c: 1, d: 0 } }
```

The array order of `nodes` is the **model order**: an edge whose target precedes its source is backwards, and phase 1
reverses it — which makes every effective edge run from a lower index to a higher one, so the graph is acyclic and layering
is one pass in model order. `ranks` is the position inside the layer, also by model order; which node a drawing puts
above which is the crossing-minimization strategy's business, so a comparison between engines sorts a layer's ids.

The phases are exported on their own, under the names the spec's actions have:

| Function                   | Phase                                                     |
| -------------------------- | --------------------------------------------------------- |
| `breakCycles(graph)`       | reverse every edge that points backwards in model order   |
| `assignLayers(graph)`      | longest path from a source, over the already-broken graph |
| `orderNodes(nodes, layer)` | group by layer, rank by model order                       |
| `layout(graph)`            | all three, in that order                                  |

Not here yet, and each its own slice: dummy nodes for long edges, crossing minimization, coordinates and spacing, ports,
labels, compound graphs and the strategy knobs. The spec's `NOT MODELLED` header says why.

## Tests

```sh
bun run test   # the spec's eight scenarios under Bun, then the seeded differential walk in Chromium
```

The walk drives the engine and the spec's generated model with the same random steps and compares the layers after every
one. `@cssints/apg-specs` is a dev dependency: no published code imports it.

The scenarios run under Bun rather than plain Node because the oracle's sources import each other without file
extensions, which Bun and Vite resolve and Node does not; the browser run is the same code in a page with no Node
built-ins.
