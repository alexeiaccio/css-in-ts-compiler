// The contract of src/index.ts over graphs the spec cannot state: the spec's six are a literal `pick`, so everything the
// engine does beyond them is checked here. Every check is a property of the layering, not a recording of an output: an
// independent topological sort proves the graph is acyclic after phase 1, and the rest follows from the three phases.
import assert from "node:assert/strict";

import {
  assignLayers,
  breakCycles,
  crossings,
  layout,
  minimizeCrossings,
  orderSlots,
} from "../src/index.ts";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const positionOf = (graph) => new Map(graph.nodes.map((node, position) => [node, position]));

// Kahn's algorithm, written here rather than reused: the point is that the engine's order is not what proves the graph.
const topologicalOrder = (graph) => {
  const remaining = new Map(graph.nodes.map((node) => [node, 0]));
  for (const { target } of graph.edges) {
    remaining.set(target, (remaining.get(target) ?? 0) + 1);
  }
  const ready = graph.nodes.filter((node) => remaining.get(node) === 0);
  const order = [];
  while (ready.length > 0) {
    const node = ready.shift();
    order.push(node);
    for (const edge of graph.edges) {
      if (edge.source !== node) continue;
      const left = (remaining.get(edge.target) ?? 0) - 1;
      remaining.set(edge.target, left);
      if (left === 0) ready.push(edge.target);
    }
  }
  return order;
};

const reversed = (edge) => ({ source: edge.target, target: edge.source });

const checkGraph = (graph, label) => {
  const position = positionOf(graph);
  const oriented = breakCycles(graph);

  assert.equal(oriented.nodes, graph.nodes, `${label}: phase 1 keeps the nodes`);
  assert.equal(
    topologicalOrder(oriented).length,
    graph.nodes.length,
    `${label}: phase 1 leaves no cycle`,
  );

  for (const [index, edge] of graph.edges.entries()) {
    const back = (position.get(edge.target) ?? 0) < (position.get(edge.source) ?? 0);
    assert.deepEqual(
      oriented.edges[index],
      back ? reversed(edge) : edge,
      `${label}: edge ${index} is ${back ? "reversed" : "kept"}`,
    );
  }
  for (const edge of oriented.edges) {
    assert.ok(
      (position.get(edge.target) ?? 0) > (position.get(edge.source) ?? 0),
      `${label}: ${edge.source} -> ${edge.target} points forward in model order`,
    );
  }

  const layerOf = assignLayers(oriented);
  const result = orderSlots(oriented, layerOf);
  assert.deepEqual(layout(graph), result, `${label}: layout composes the three phases`);
  assert.deepEqual(layout(graph), result, `${label}: the same input gives the same output`);

  const seen = new Map();
  for (const [index, ids] of result.layers.entries()) {
    assert.ok(ids.length > 0, `${label}: layer ${index} is not empty`);
    for (const [rank, node] of ids.entries()) {
      assert.ok(!seen.has(node), `${label}: ${node} appears once`);
      seen.set(node, { layer: index, rank });
      assert.equal(result.ranks[node], rank, `${label}: the rank of ${node} is its index`);
      assert.equal(layerOf.get(node), index, `${label}: the layer of ${node} is its index`);
    }
    for (let i = 1; i < ids.length; i += 1) {
      assert.ok(
        (position.get(ids[i - 1]) ?? 0) < (position.get(ids[i]) ?? 0),
        `${label}: layer ${index} is in model order`,
      );
    }
  }
  assert.equal(seen.size, graph.nodes.length, `${label}: every node is in a layer`);

  const predecessors = new Map();
  for (const edge of oriented.edges) {
    const list = predecessors.get(edge.target) ?? [];
    list.push(edge.source);
    predecessors.set(edge.target, list);
    assert.ok(
      (layerOf.get(edge.source) ?? 0) < (layerOf.get(edge.target) ?? 0),
      `${label}: ${edge.source} sits above ${edge.target}`,
    );
  }
  for (const node of graph.nodes) {
    const layer = layerOf.get(node) ?? 0;
    if (layer === 0) continue;
    assert.ok(
      (predecessors.get(node) ?? []).some((source) => layerOf.get(source) === layer - 1),
      `${label}: ${node} at layer ${layer} has a predecessor at ${layer - 1}`,
    );
  }

  for (let index = 1; index < result.layers.length; index += 1) {
    assert.ok(result.layers[index - 1].length > 0, `${label}: layers have no gaps`);
  }

  const nodeSet = new Set(graph.nodes);
  const placed = new Map();
  for (const [layer, ids] of result.slots.entries()) {
    assert.ok(ids.length > 0, `${label}: slot layer ${layer} is not empty`);
    for (const [index, id] of ids.entries()) {
      assert.ok(!placed.has(id), `${label}: ${id} occupies one slot`);
      placed.set(id, { layer, index });
      if (nodeSet.has(id)) {
        assert.equal(layerOf.get(id), layer, `${label}: ${id} sits in its layer`);
        continue;
      }
      const dummy = /^(.+?)>(.+)@(\d+)$/.exec(id);
      assert.ok(dummy !== null, `${label}: ${id} is a dummy id`);
      const source = dummy[1];
      const target = dummy[2];
      assert.equal(Number(dummy[3]), layer, `${label}: ${id} names its layer`);
      const from = layerOf.get(source);
      const to = layerOf.get(target);
      assert.ok(
        from !== undefined && to !== undefined && from < layer && layer < to,
        `${label}: ${id} is strictly between its ends`,
      );
    }
  }
  assert.deepEqual(
    result.slots.map((ids) => ids.filter((id) => nodeSet.has(id))),
    result.layers,
    `${label}: layers are the slots' nodes`,
  );
  for (const [_layer, ids] of result.layers.entries()) {
    ids.forEach((id, rank) => {
      assert.equal(result.ranks[id], rank, `${label}: the rank of ${id} is its index`);
    });
  }

  const baseline = crossings(graph, result);
  const swept = minimizeCrossings(graph, result);
  assert.deepEqual(
    swept.slots.map((ids) => [...ids].sort()),
    result.slots.map((ids) => [...ids].sort()),
    `${label}: the sweep keeps the occupants`,
  );
  assert.ok(crossings(graph, swept) <= baseline, `${label}: the sweep does not add crossings`);
  assert.deepEqual(minimizeCrossings(graph, result), swept, `${label}: the sweep is deterministic`);
};

assert.deepEqual(layout({ nodes: [], edges: [] }), { layers: [], ranks: {}, slots: [] });
assert.throws(
  () => layout({ nodes: ["a"], edges: [{ source: "a", target: "ghost" }] }),
  RangeError,
  "an edge to a node the graph does not have is refused",
);

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
  ["chain of 200", chain(200)],
  ["cycle of 200", cycle(200)],
  ["dense 40", randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 })],
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
];
for (const [name, graph] of shapes) {
  checkGraph(graph, name);
}

const crossing = {
  nodes: ["a", "b", "c", "d"],
  edges: [
    { source: "a", target: "d" },
    { source: "b", target: "c" },
  ],
};
assert.equal(crossings(crossing, layout(crossing)), 1, "the baseline crosses");
assert.equal(
  crossings(crossing, minimizeCrossings(crossing, layout(crossing))),
  0,
  "the sweep uncrosses",
);

const graphs = corpus(400);
for (const [seed, graph] of graphs.entries()) {
  checkGraph(graph, `corpus ${seed} (${graph.nodes.length} nodes, ${graph.edges.length} edges)`);
}

console.log(`${shapes.length} shapes and ${graphs.length} seeded graphs hold every property`);
