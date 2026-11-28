// Placement's contract over graphs the specs cannot state: boxes that do not overlap, gaps that hold the spacing, edges that
// run left to right, dummies between the boxes of the layer they cross, and the same input twice giving the same drawing.
import assert from "node:assert/strict";

import { layout, place } from "../src/index.ts";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const NODE_GAP = 20;
const LAYER_GAP = 30;

const sizesOf = (graph) =>
  Object.fromEntries(
    graph.nodes.map((id, index) => [
      id,
      { width: 30 + (index % 3) * 10, height: 20 + (index % 2) * 10 },
    ]),
  );

const checkPlacement = (graph, label) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = layout(sized);
  const boxes = place(sized, ordered);
  const again = place(sized, ordered);
  assert.deepEqual(again, boxes, `${label}: the same input, the same drawing`);

  const nodes = new Set(graph.nodes);
  const byId = new Map(boxes.map((box) => [box.id, box]));
  assert.deepEqual(
    boxes.map((box) => box.id),
    ordered.slots.flat(),
    `${label}: every slot is placed once, in the layout's order`,
  );

  for (const [layer, ids] of ordered.slots.entries()) {
    const placed = ids.map((id) => byId.get(id));
    for (const box of placed) {
      assert.ok(box !== undefined, `${label}: ${ids.join(",")} has boxes`);
    }
    const first = placed[0];
    if (first === undefined) continue;
    for (const box of placed) {
      assert.equal(box?.x, first.x, `${label}: layer ${layer} is one column`);
      if (nodes.has(box?.id ?? "")) {
        assert.ok(box.width >= 30, `${label}: ${box.id} keeps its width`);
      }
    }
    for (let index = 1; index < placed.length; index += 1) {
      const above = placed[index - 1];
      const below = placed[index];
      if (above === undefined || below === undefined) continue;
      assert.ok(
        below.y >= above.y + above.height + NODE_GAP - 1e-9,
        `${label}: ${below.id} clears ${above.id} by the spacing`,
      );
    }
  }

  const columns = ordered.slots.map((ids) => byId.get(ids[0] ?? "")?.x ?? 0);
  for (let layer = 1; layer < columns.length; layer += 1) {
    const previous = ordered.slots[layer - 1] ?? [];
    const widest = Math.max(
      0,
      ...previous.filter((id) => nodes.has(id)).map((id) => byId.get(id)?.width ?? 0),
    );
    assert.ok(
      (columns[layer] ?? 0) >= (columns[layer - 1] ?? 0) + widest + LAYER_GAP - 1e-9,
      `${label}: layer ${layer} clears the one before it`,
    );
  }

  for (const edge of graph.edges) {
    const from = byId.get(edge.source);
    const to = byId.get(edge.target);
    if (from === undefined || to === undefined || from.x === to.x) continue;
    const [left, right] = from.x < to.x ? [from, to] : [to, from];
    assert.ok(
      left.x + left.width <= right.x,
      `${label}: ${edge.source} -> ${edge.target} runs left to right`,
    );
  }

  for (const [id, box] of byId) {
    if (nodes.has(id)) continue;
    assert.equal(box.width, 0, `${label}: ${id} is a point`);
    assert.equal(box.height, 0, `${label}: ${id} is a point`);
  }

  const overlapping = boxes.flatMap((one, index) =>
    boxes
      .slice(index + 1)
      .filter(
        (two) =>
          one.x < two.x + two.width &&
          two.x < one.x + one.width &&
          one.y < two.y + two.height &&
          two.y < one.y + one.height,
      )
      .map((two) => `${one.id}/${two.id}`),
  );
  assert.deepEqual(overlapping, [], `${label}: no two boxes overlap`);
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
  ["chain of 200", chain(200)],
  ["cycle of 200", cycle(200)],
  ["dense 40", randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 })],
];

for (const [name, graph] of shapes) checkPlacement(graph, name);
for (const [seed, graph] of corpus(120).entries()) {
  checkPlacement(graph, `corpus ${seed} (${graph.nodes.length} nodes)`);
}

console.log(`${shapes.length} shapes and 120 seeded graphs are placed without an overlap`);
