// The second layering strategy: `minimize-length` over the same pipeline. Every property the spec and the property suite pin
// for the longest path holds for it too (a forward edge, layers at least 0 and integral, the same graph twice, the default
// byte-identical), and its numbers are checked against the only two oracles that can say it is good: brute force over every
// feasible layering of a small graph, and elk-rs with `layering.strategy: NETWORK_SIMPLEX`, which minimises the same sum.
import assert from "node:assert/strict";

import ELK from "@openedges/elk-layout";

import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import {
  assignLayers,
  breakCycles,
  crossings,
  dummyId,
  layout,
  minimizeCrossings,
} from "../src/index.ts";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const effective = (oriented) => {
  const seen = new Set();
  const edges = [];
  for (const edge of oriented.edges) {
    if (edge.source === edge.target) continue;
    const key = `${edge.source}>${edge.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push(edge);
  }
  return edges;
};

const spanOf = (oriented, layerOf) =>
  effective(oriented).reduce(
    (sum, edge) => sum + (layerOf.get(edge.target) ?? 0) - (layerOf.get(edge.source) ?? 0),
    0,
  );

const longestPath = (oriented) => {
  const layer = new Map(oriented.nodes.map((id) => [id, 0]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of effective(oriented)) {
      const below = (layer.get(edge.source) ?? 0) + 1;
      if (below > (layer.get(edge.target) ?? 0)) {
        layer.set(edge.target, below);
        changed = true;
      }
    }
  }
  return layer;
};

const orientationLayers = (graph, layerOf) => {
  const count = Math.max(0, ...graph.nodes.map((id) => (layerOf.get(id) ?? 0) + 1));
  const layers = Array.from({ length: count }, () => []);
  for (const id of graph.nodes) (layers[layerOf.get(id) ?? 0] ?? []).push(id);
  return layers;
};

const checkLayering = (graph, strategy, label) => {
  const oriented = breakCycles(graph);
  const layerOf = assignLayers(oriented, strategy);
  const again = assignLayers(oriented, strategy);
  assert.deepEqual(layerOf, again, `${label} ${strategy}: the same graph twice`);
  assert.equal(layerOf.size, graph.nodes.length, `${label} ${strategy}: every node has a layer`);
  for (const id of graph.nodes) {
    const layer = layerOf.get(id);
    assert.ok(Number.isInteger(layer) && layer >= 0, `${label} ${strategy}: ${id} is at ${layer}`);
  }
  for (const edge of effective(oriented)) {
    assert.ok(
      (layerOf.get(edge.target) ?? 0) > (layerOf.get(edge.source) ?? 0),
      `${label} ${strategy}: ${edge.source} -> ${edge.target} points forward`,
    );
  }
  assert.ok(
    spanOf(oriented, layerOf) <= spanOf(oriented, assignLayers(oriented)),
    `${label} ${strategy}: never longer than the longest path`,
  );
  const ordered = layout(graph, { layering: strategy });
  assert.deepEqual(
    ordered,
    layout(graph, { layering: strategy }),
    `${label} ${strategy}: layout again`,
  );
  assert.deepEqual(
    ordered.layers,
    orientationLayers(graph, layerOf),
    `${label} ${strategy}: the layout's layers are the assignment's`,
  );
  if (strategy === "longest-path") {
    assert.deepEqual(layerOf, longestPath(oriented), `${label}: the default is the longest path`);
    assert.deepEqual(
      ordered,
      layout(graph),
      `${label}: the option is the default when it is absent`,
    );
  }
  return { layerOf, ordered, oriented };
};

const shapes = [
  ["empty", { nodes: [], edges: [] }],
  ["single", { nodes: ["only"], edges: [] }],
  ["isolates", { nodes: ["a", "b", "c"], edges: [] }],
  [
    "two components",
    {
      nodes: ["a", "b", "c", "d"],
      edges: [
        { source: "a", target: "b" },
        { source: "c", target: "d" },
      ],
    },
  ],
  [
    "a source the objective raises",
    {
      nodes: ["a", "x1", "x2", "b"],
      edges: [
        { source: "a", target: "b" },
        { source: "x1", target: "x2" },
        { source: "x2", target: "b" },
      ],
    },
  ],
  [
    "parallel edges",
    {
      nodes: ["a", "b"],
      edges: [
        { source: "a", target: "b" },
        { source: "a", target: "b" },
        { source: "b", target: "a" },
      ],
    },
  ],
  [
    "loops",
    {
      nodes: ["a", "b", "c"],
      edges: [
        { source: "a", target: "b" },
        { source: "a", target: "a" },
        { source: "b", target: "c" },
        { source: "c", target: "c" },
      ],
    },
  ],
  ["chain of 200", chain(200)],
  ["cycle of 200", cycle(200)],
  ["dense 40", randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 })],
];

for (const [name, graph] of shapes) {
  for (const strategy of ["longest-path", "minimize-length"]) {
    checkLayering(graph, strategy, name);
  }
}

const graphs = corpus(120);
for (const [seed, graph] of graphs.entries()) {
  for (const strategy of ["longest-path", "minimize-length"]) {
    checkLayering(graph, strategy, `corpus ${seed}`);
  }
}

const raised = {
  nodes: ["a", "x1", "x2", "b"],
  edges: [
    { source: "a", target: "b" },
    { source: "x1", target: "x2" },
    { source: "x2", target: "b" },
  ],
};
const raisedOriented = breakCycles(raised);
assert.equal(spanOf(raisedOriented, assignLayers(raisedOriented)), 4, "the longest path spans 4");
assert.equal(
  spanOf(raisedOriented, assignLayers(raisedOriented, "minimize-length")),
  3,
  "the objective spans 3",
);

const feasibleBest = (graph) => {
  const oriented = breakCycles(graph);
  const edges = effective(oriented);
  const before = new Map(graph.nodes.map((id) => [id, []]));
  for (const edge of edges)
    before.set(edge.target, [...(before.get(edge.target) ?? []), edge.source]);
  const cap = Math.max(0, graph.nodes.length - 1);
  const layer = new Map();
  let best = Number.POSITIVE_INFINITY;
  const walk = (at, span) => {
    if (span >= best) return;
    if (at === graph.nodes.length) {
      best = span;
      return;
    }
    const id = graph.nodes[at];
    const low = Math.max(
      0,
      ...(before.get(id) ?? []).map((source) => (layer.get(source) ?? 0) + 1),
    );
    for (let candidate = low; candidate <= cap; candidate += 1) {
      layer.set(id, candidate);
      let added = 0;
      for (const edge of edges) {
        if (edge.target === id) added += candidate - (layer.get(edge.source) ?? 0);
      }
      walk(at + 1, span + added);
    }
    layer.delete(id);
  };
  walk(0, 0);
  return best;
};

const small = [];
for (let seed = 0; seed < 400; seed += 1) {
  small.push(randomGraph(seed, { maxNodes: 7, density: 0.35 }));
}
small.push(
  chain(6),
  chain(7),
  cycle(7),
  raised,
  ...shapes.filter(([, g]) => g.nodes.length <= 7).map(([, g]) => g),
);

let optimal = 0;
const suboptimal = [];
for (const [seed, graph] of small.entries()) {
  const oriented = breakCycles(graph);
  const mine = spanOf(oriented, assignLayers(oriented, "minimize-length"));
  const best = feasibleBest(graph);
  const start = spanOf(oriented, assignLayers(oriented));
  assert.ok(best <= start, `small ${seed}: brute force cannot beat the longest path`);
  assert.ok(mine >= best, `small ${seed}: the strategy cannot beat brute force`);
  if (mine === best) {
    optimal += 1;
  } else {
    suboptimal.push({ seed, nodes: graph.nodes.length, mine, best });
  }
}
if (suboptimal.length > 0) {
  console.log(
    `not optimal on ${suboptimal.length} of ${small.length}:`,
    JSON.stringify(suboptimal),
  );
}
assert.equal(
  optimal,
  small.length,
  "the strategy is optimal on every graph brute force can enumerate",
);
console.log(`brute force: optimal on ${optimal} of ${small.length} small graphs`);

const SIZES = Object.fromEntries(GRAPH_LAYOUT_NODES.map((id) => [id, { width: 40, height: 20 }]));
const OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": 20,
  "elk.layered.spacing.nodeNodeBetweenLayers": 30,
  "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
  "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "NONE",
  "elk.layered.nodePlacement.strategy": "SIMPLE",
};

const elkGraphOf = (graph, sizes) => ({
  id: "root",
  layoutOptions: OPTIONS,
  children: graph.nodes.map((id) => ({ id, ...(sizes[id] ?? { width: 0, height: 0 }) })),
  edges: graph.edges.map((edge) => ({
    id: `${edge.source}>${edge.target}`,
    sources: [edge.source],
    targets: [edge.target],
  })),
});

const components = (graph) => {
  const adjacent = new Map(graph.nodes.map((id) => [id, []]));
  for (const edge of graph.edges) {
    adjacent.set(edge.source, [...(adjacent.get(edge.source) ?? []), edge.target]);
    adjacent.set(edge.target, [...(adjacent.get(edge.target) ?? []), edge.source]);
  }
  const seen = new Set();
  const found = [];
  for (const id of graph.nodes) {
    if (seen.has(id)) continue;
    const queue = [id];
    const component = [];
    for (let at = 0; at < queue.length; at += 1) {
      const node = queue[at];
      component.push(node);
      for (const neighbour of adjacent.get(node) ?? []) {
        if (seen.has(neighbour)) continue;
        seen.add(neighbour);
        queue.push(neighbour);
      }
    }
    found.push(component);
  }
  return found;
};

const elkLayering = async (graph, sizes) => {
  const out = await elk.layout(elkGraphOf(graph, sizes));
  const boxes = (out.children ?? []).map((child) => ({
    id: child.id,
    x: child.x ?? 0,
    y: child.y ?? 0,
    width: child.width ?? 0,
    height: child.height ?? 0,
  }));
  const at = new Map(boxes.map((box) => [box.id, box]));
  const layerOf = new Map();
  let layers = 0;
  for (const component of components(graph)) {
    const columns = [...new Set(component.map((id) => at.get(id)?.x ?? 0))].sort(
      (one, two) => one - two,
    );
    for (const id of component) layerOf.set(id, columns.indexOf(at.get(id)?.x ?? 0));
    layers += columns.length;
  }
  const centre = new Map(boxes.map((box) => [box.id, box.y + box.height / 2]));
  return { boxes, layers, layerOf, centre };
};

const slotsOfElk = (oriented, graph, theirs) => {
  const nodes = new Set(graph.nodes);
  const slots = Array.from({ length: theirs.layers }, () => []);
  for (const id of graph.nodes) {
    (slots[theirs.layerOf.get(id) ?? 0] ?? []).push({ id, y: theirs.centre.get(id) ?? 0 });
  }
  for (const edge of effective(oriented)) {
    const first = theirs.layerOf.get(edge.source) ?? 0;
    const last = theirs.layerOf.get(edge.target) ?? 0;
    const from = theirs.centre.get(edge.source) ?? 0;
    const to = theirs.centre.get(edge.target) ?? 0;
    for (let layer = first + 1; layer < last; layer += 1) {
      const ratio = (layer - first) / (last - first);
      (slots[layer] ?? []).push({ id: dummyId(edge, layer), y: from + (to - from) * ratio });
    }
  }
  const ordered = slots.map((ids) =>
    [...ids]
      .sort((one, two) => one.y - two.y || one.id.localeCompare(two.id))
      .map((slot) => slot.id),
  );
  return {
    slots: ordered,
    layers: ordered.map((ids) => ids.filter((id) => nodes.has(id))),
    ranks: {},
  };
};

const elk = new ELK();
const graphOfPick = (pick) => {
  const edges = GRAPH_LAYOUT_PICKS[pick].edges
    .split(" ")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [source, target] = pair.split(">");
      return { source, target };
    });
  return { nodes: [...GRAPH_LAYOUT_NODES], edges };
};

const report = {
  layers: 0,
  dummies: 0,
  span: 0,
  crossings: 0,
  elkLayers: 0,
  elkSpan: 0,
  elkCrossings: 0,
};
const diffs = [];
const compare = async (graph, name, sizes) => {
  const oriented = breakCycles(graph);
  const mine = layout(graph, { layering: "minimize-length" });
  const swept = minimizeCrossings(graph, mine);
  const theirs = await elkLayering(graph, sizes);
  const layerOf = assignLayers(oriented, "minimize-length");
  const mySpan = spanOf(oriented, layerOf);
  const theirSpan = spanOf(oriented, theirs.layerOf);
  assert.ok(
    theirSpan >= effective(oriented).length,
    `${name}: ELK points every effective edge forward (${theirSpan})`,
  );
  const myLayers = components(graph).reduce(
    (sum, component) => sum + Math.max(...component.map((id) => layerOf.get(id) ?? 0)) + 1,
    0,
  );
  const myCrossings = crossings(graph, swept);
  const theirCrossings = crossings(graph, slotsOfElk(oriented, graph, theirs));
  report.layers += myLayers;
  report.dummies += mine.slots.reduce((sum, ids) => sum + ids.length, 0) - graph.nodes.length;
  report.span += mySpan;
  report.crossings += myCrossings;
  report.elkLayers += theirs.layers;
  report.elkSpan += theirSpan;
  report.elkCrossings += theirCrossings;
  if (mySpan !== theirSpan || myLayers !== theirs.layers) {
    diffs.push(`${name}: layers ${myLayers}/${theirs.layers}, span ${mySpan}/${theirSpan}`);
  }
  return { mySpan, theirSpan, myLayers, theirLayers: theirs.layers };
};

for (const pick of [1, 2, 3, 4, 5, 6]) {
  const graph = graphOfPick(pick);
  const result = await compare(graph, `pick ${pick}`, SIZES);
  assert.equal(
    result.myLayers,
    result.theirLayers,
    `pick ${pick}: the same layers as NETWORK_SIMPLEX`,
  );
  assert.equal(result.mySpan, result.theirSpan, `pick ${pick}: the same span as NETWORK_SIMPLEX`);
  console.log(
    `pick ${pick}: layers ${result.myLayers} ${result.theirLayers}, span ${result.mySpan} ${result.theirSpan}`,
  );
}
const seeded = corpus(60).filter((graph) => graph.nodes.length <= 40);
for (const [seed, graph] of seeded.entries()) {
  await compare(graph, `corpus ${seed}`, {});
}
console.log(
  `elk NETWORK_SIMPLEX over ${seeded.length} graphs and the six: layers ours ${report.layers} elk ${report.elkLayers}, ` +
    `span ours ${report.span} elk ${report.elkSpan}, crossings after the sweep ours ${report.crossings} elk ${report.elkCrossings}`,
);
if (diffs.length > 0) {
  console.log(`the two layerings differ on ${diffs.length}: ${diffs.slice(0, 8).join("; ")}`);
}

const numbers = (strategy) => {
  let layers = 0;
  let dummies = 0;
  let span = 0;
  let before = 0;
  let after = 0;
  let improved = 0;
  for (const graph of graphs) {
    const oriented = breakCycles(graph);
    const ordered = layout(graph, { layering: strategy });
    const swept = minimizeCrossings(graph, ordered);
    const layerOf = assignLayers(oriented, strategy);
    layers += ordered.slots.length;
    dummies += ordered.slots.reduce((sum, ids) => sum + ids.length, 0) - graph.nodes.length;
    span += spanOf(oriented, layerOf);
    before += crossings(graph, ordered);
    after += crossings(graph, swept);
    if (spanOf(oriented, layerOf) < spanOf(oriented, assignLayers(oriented))) improved += 1;
  }
  return { layers, dummies, span, before, after, improved };
};

for (const strategy of ["longest-path", "minimize-length"]) {
  const result = numbers(strategy);
  console.log(
    `${strategy.padEnd(16)} layers ${result.layers}, dummies ${result.dummies}, span ${result.span}, ` +
      `crossings ${result.before} -> ${result.after}, shorter than the longest path on ${result.improved}`,
  );
}
