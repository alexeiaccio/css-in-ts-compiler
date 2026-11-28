# Graph drawing libraries

[anvaka/graph-drawing-libraries](https://anvaka.github.io/graph-drawing-libraries/) — read 2026-11-28. A catalogue of 22
JavaScript graph-drawing libraries plus a measurement harness around all of them, not a survey paper. It is the map of what a
diagram library can be in a browser, and the reason the layered-layout epic (`cssints-sw9a`) owns its engine instead of
bundling one.

## The harness, which is the part worth copying

- The same 10×10 grid is drawn by every library, and a screenshot is taken **10 seconds after each one starts** — the wall in
  the README is that grid, side by side.
- `npm run measure` runs every library in a Chrome that is **slowed down four times** and records the smallest graph that kept
  the tab silent for ten seconds; `data/limits.json` holds the limits made from those runs, and `app/guard.js` asks the visitor
  before a graph that is likely to freeze the tab.
- The unit is therefore "the graph at which the tab stops answering", not an average over a benchmark nobody waits for.

That is the right shape for a layout that runs in a click handler: a diagram's layout is judged by whether it returns before
the frame is due, and the honest number is the largest graph it still answers in time. The starter's bench (`cssints-osne`)
should report that number against dagre on the same graph, not a microseconds-per-node figure in isolation.

## The layered subset — our problem

Sizes are what npm ships for the latest version (`registry.npmjs.org/<pkg>/latest`, 2026-11-28): unpacked package size, which
includes sources and maps, so it is not a minified bundle — it is a comparable order of magnitude.

| Package                 | Version | What it does                                                         | Unpacked                      | Licence                     |
| ----------------------- | ------- | -------------------------------------------------------------------- | ----------------------------- | --------------------------- |
| `@dagrejs/dagre`        | 3.1.4   | Sugiyama: acyclic, rank, order, position, edge points                | 1.4 MB                        | MIT                         |
| `elkjs`                 | 0.12.2  | ELK itself (the pipeline our spec states), compiled to JS/WASM       | 8.2 MB                        | EPL-2.0 OR GPL-3.0-or-later |
| `@msagl/core`           | 1.1.25  | MSAGL: layered layout, orthogonal routing, labels, clusters          | 12.9 MB                       | MIT                         |
| `@viz-js/viz`           | 3.31.0  | Graphviz `dot` as WASM — the canonical Sugiyama implementation       | 5.0 MB                        | MIT                         |
| `@cssints/graph-layout` | 0.48    | Three phases: model-order cycle breaking, longest-path layers, ranks | 2.35 kB packed (0.90 kB gzip) | MIT                         |

The last row is the truth about the gap: it is one slice — layers and ranks, no dummy nodes, no placement, no routing — and
the epic's remaining beans are exactly that gap. The comparison is fair as a size of the _shipped thing_ today, not as
parity: dagre, ELK and MSAGL also place and route.

Two facts that decide more than the sizes:

- **`elkjs` is EPL-2.0 OR GPL-3.0.** The reference implementation cannot be bundled into an MIT kit without a licence
  conversation, which is a reason to state the discrete algorithm in Quint and own it rather than ship it. It stays the
  oracle, as a dev dependency (`elk-rs`, which keeps ELK 0.12's phase semantics).
- **`dagre` is the JS baseline** (Mermaid drew with it before ELK) and it is the cheapest comparator at 1.4 MB. It is
  maintained only in the `@dagrejs/dagre` fork; the old `dagre` package stopped at 0.8.5 in 2020.

## The rest of the catalogue, and why it is not this problem

Sixteen of the 22 are force-directed or rendering frameworks: `d3-force` (55 kB), `springy`, `arbor`, `VivaGraphJS`,
`sigma.js`, `force-graph`, `3d-force-graph`, `cosmosgl/graph` (GPU), plus `G6`, `cytoscape.js`, `echarts`, `vis-network`,
`Alchemy`, `dracula`, `orb`, `WebCola`. They answer a different question: no edge direction, positions emerge from attraction
and repulsion, and there are no layers to put a node above its successor. A layered layout is what makes a diagram read as a
flow; a force layout is for exploring a network whose shape nobody knows yet — a skin decision, not a layout one.

## Taken

- `@dagrejs/dagre` as the comparator in the starter's bench, on the same graph, measuring the same thing: the return time
  inside the click handler and the largest graph that still fits in a frame.
- The freeze-guard framing: a limit that names a graph size, published beside the engine, instead of an average latency.
- The screenshot wall as a review form for the drawing once routing lands — the same graph under every strategy, side by side,
  which is how a crossing count becomes something a person can check.

## Not taken

- Force layouts, WebGL and 3D: a different problem, and the catalogue already has them if a skin ever wants one.
- Bundling `elkjs`, `viz-js` or `@msagl/core`: a copyleft licence (elk) or 5–13 MB of WASM/JS for a subset this repository can
  state in Quint. They stay dev-only oracles; `@openedges/elk-layout` is already one.
- The catalogue's own frameworks (`G6`, `cytoscape.js`, `echarts`) — they are applications with layout plugins, and their
  layout plugins are the same algorithms as the rows above.

## Sources

- <https://anvaka.github.io/graph-drawing-libraries/> and <https://github.com/anvaka/graph-drawing-libraries> (README, harness
  scripts, `data/limits.json`).
- <https://github.com/kieler/elkjs>, <https://github.com/dagrejs/dagre>, <https://github.com/microsoft/msagljs>,
  <https://github.com/mdaines/viz-js>.
- The oracle already recorded in [`docs/wayfinder.md`](../wayfinder.md), "ELK's layered pipeline, on Quint specs".
