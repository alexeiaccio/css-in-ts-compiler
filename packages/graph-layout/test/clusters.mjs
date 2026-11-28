// The contract of a compound graph: each cluster's members sit in one contiguous block of every layer's slot order, its box
// holds no node that is not a member, and every edge with one end inside crosses its border exactly once, at a port of its own,
// with no segment through a box. Then the same graph with the clusters removed routes by the flat contract it routes by today.
import assert from "node:assert/strict";

import {
  assignLayers,
  breakCycles,
  clusterBoxes,
  clusterIndexOf,
  crossings,
  layout,
  minimizeCrossings,
  orderSlots,
  place,
  route,
} from "../src/index.ts";
import { clusterCorpus, threeClusters, twoClusters } from "./cluster-graphs.mjs";
import { bordersOf } from "./geometry.mjs";

const NODE_GAP = 20;
const sizesOf = (graph) =>
  Object.fromEntries(
    graph.nodes.map((id, index) => [
      id,
      { width: 40 + (index % 3) * 10, height: 20 + (index % 2) * 10 },
    ]),
  );

const segmentsOf = (points) =>
  points.slice(1).map((to, index) => {
    const from = points[index];
    return { from, to, horizontal: from.y === to.y, vertical: from.x === to.x };
  });

const crossesBox = (segment, box) => {
  const { from, to } = segment;
  if (segment.horizontal) {
    const low = Math.min(from.x, to.x);
    const high = Math.max(from.x, to.x);
    return (
      from.y > box.y &&
      from.y < box.y + box.height &&
      Math.max(low, box.x) < Math.min(high, box.x + box.width)
    );
  }
  const low = Math.min(from.y, to.y);
  const high = Math.max(from.y, to.y);
  return (
    from.x > box.x &&
    from.x < box.x + box.width &&
    Math.max(low, box.y) < Math.min(high, box.y + box.height)
  );
};

const tally = {
  graphs: 0,
  nodes: 0,
  edges: 0,
  cross: 0,
  pushes: 0,
  rounds: 0,
  routes: 0,
  ports: 0,
  borders: new Map(),
  offsets: [],
  constrained: 0,
  flat: 0,
};

const checkGraph = (graph, label) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const { clusters, owner } = clusterIndexOf(sized);

  const layerOf = assignLayers(breakCycles(sized));
  const ordered = minimizeCrossings(sized, layout(sized));
  assert.deepEqual(
    minimizeCrossings(sized, layout(sized)),
    ordered,
    `${label}: the sweep is deterministic`,
  );
  assert.deepEqual(
    ordered.slots.map((ids) => [...ids].sort()),
    orderSlots(breakCycles(sized), layerOf).slots.map((ids) => [...ids].sort()),
    `${label}: the sweep keeps the occupants`,
  );

  for (const cluster of clusters) {
    const members = new Set(cluster.members);
    for (const [layer, ids] of ordered.slots.entries()) {
      const at = ids.flatMap((id, index) => (members.has(id) ? [index] : []));
      if (at.length < 2) continue;
      assert.deepEqual(
        at,
        Array.from({ length: at.length }, (_, index) => (at[0] ?? 0) + index),
        `${label}: ${cluster.id} is one block in layer ${layer}`,
      );
    }
  }

  const report = {};
  const boxes = place(sized, ordered, { clusters: { report } });
  const rects = clusterBoxes(sized, boxes);
  const rectOf = new Map(rects.map((rect) => [rect.id, rect]));
  const byId = new Map(boxes.map((box) => [box.id, box]));

  for (const cluster of clusters) {
    const rect = rectOf.get(cluster.id);
    assert.ok(rect !== undefined, `${label}: ${cluster.id} has a box`);
    for (const member of cluster.members) {
      const box = byId.get(member);
      assert.ok(
        box !== undefined &&
          box.x >= rect.x - 1e-9 &&
          box.y >= rect.y - 1e-9 &&
          box.x + box.width <= rect.x + rect.width + 1e-9 &&
          box.y + box.height <= rect.y + rect.height + 1e-9,
        `${label}: ${member} is inside ${cluster.id}`,
      );
    }
    for (const box of boxes) {
      if (cluster.members.includes(box.id) || box.width === 0 || box.height === 0) continue;
      assert.ok(
        !(box.x < rect.x + rect.width && rect.x < box.x + box.width) ||
          !(box.y < rect.y + rect.height && rect.y < box.y + box.height),
        `${label}: ${box.id} is outside ${cluster.id}`,
      );
    }
  }

  const routes = route(sized, ordered, boxes);
  assert.deepEqual(route(sized, ordered, boxes), routes, `${label}: the router is deterministic`);
  const boxed = boxes.filter((box) => box.width > 0 && box.height > 0);
  for (const line of routes) {
    for (const segment of segmentsOf(line.points)) {
      assert.ok(
        segment.horizontal !== segment.vertical,
        `${label}: ${line.id} has no empty segment`,
      );
      for (const box of boxed) {
        if (box.id === line.source || box.id === line.target) continue;
        assert.ok(!crossesBox(segment, box), `${label}: ${line.id} avoids ${box.id}'s box`);
      }
    }
    const ends = [line.source, line.target];
    tally.routes += 1;
    if (line.borders === undefined) {
      assert.ok(
        ends.every(
          (end) => owner.get(end) === undefined || owner.get(ends[0]) === owner.get(ends[1]),
        ),
        `${label}: ${line.id} has one end in a cluster and no port`,
      );
      continue;
    }
    const seen = new Set();
    for (const port of line.borders) {
      assert.ok(
        !seen.has(`${port.cluster}@${port.point.x},${port.point.y}`),
        `${label}: ${line.id} reuses a port of ${port.cluster}`,
      );
      seen.add(`${port.cluster}@${port.point.x},${port.point.y}`);
      const rect = rectOf.get(port.cluster);
      const onBorder =
        Math.abs(port.point.x - rect.x) < 1e-9 ||
        Math.abs(port.point.x - (rect.x + rect.width)) < 1e-9 ||
        Math.abs(port.point.y - rect.y) < 1e-9 ||
        Math.abs(port.point.y - (rect.y + rect.height)) < 1e-9;
      assert.ok(onBorder, `${label}: ${line.id}'s port is on ${port.cluster}'s border`);
      const hits = bordersOf(line.points, rect);
      assert.equal(hits.length, 1, `${label}: ${line.id} crosses ${port.cluster} once`);
      assert.equal(
        hits[0],
        `${port.point.x},${port.point.y}`,
        `${label}: ${line.id} crosses at its port`,
      );
      const side =
        Math.abs(port.point.x - rect.x) < 1e-9
          ? "left"
          : Math.abs(port.point.x - (rect.x + rect.width)) < 1e-9
            ? "right"
            : Math.abs(port.point.y - rect.y) < 1e-9
              ? "top"
              : "bottom";
      const key = `${label}|${port.cluster}|${side}`;
      tally.borders.set(key, (tally.borders.get(key) ?? 0) + 1);
      tally.ports += 1;
      const offset =
        side === "left" || side === "right" ? port.point.y - rect.y : port.point.x - rect.x;
      tally.offsets.push(
        (100 * offset) / (side === "left" || side === "right" ? rect.height : rect.width),
      );
    }
    for (const cluster of clusters) {
      if (cluster.members.includes(line.source) && cluster.members.includes(line.target)) continue;
      if (!cluster.members.includes(line.source) && !cluster.members.includes(line.target))
        continue;
      const rect = rectOf.get(cluster.id);
      const hits = bordersOf(line.points, rect);
      assert.equal(hits.length, 1, `${label}: ${line.id} crosses ${cluster.id} once`);
    }
    for (const cluster of clusters) {
      if (!cluster.members.includes(line.source) || !cluster.members.includes(line.target))
        continue;
      assert.equal(
        bordersOf(line.points, rectOf.get(cluster.id)).length,
        0,
        `${label}: ${line.id} stays inside ${cluster.id}`,
      );
    }
  }

  const cross = graph.edges.filter((edge) => {
    const one = owner.get(edge.source);
    const two = owner.get(edge.target);
    return one !== undefined && one !== two;
  }).length;
  tally.cross += new Set(
    graph.edges
      .filter((edge) => {
        const one = owner.get(edge.source);
        const two = owner.get(edge.target);
        return one !== undefined && one !== two;
      })
      .map((edge) => `${edge.source}>${edge.target}`),
  ).size;

  const flat = { ...sized, clusters: undefined };
  assert.deepEqual(
    layout(flat),
    orderSlots(breakCycles(flat), assignLayers(breakCycles(flat))),
    `${label}: the flat graph keeps the model-order layout`,
  );
  const flatOrdered = minimizeCrossings(flat, layout(flat));
  const flatBoxes = place(flat, flatOrdered);
  const flatRoutes = route(flat, flatOrdered, flatBoxes);
  const flatNodes = new Set(graph.nodes);
  for (const line of flatRoutes) {
    assert.equal(line.borders, undefined, `${label}: ${line.id} has no port without clusters`);
    const start = flatOrdered.slots.findIndex((ids) => ids.includes(line.source));
    const end = flatOrdered.slots.findIndex((ids) => ids.includes(line.target));
    for (let boundary = start; boundary < end; boundary += 1) {
      const right = Math.max(
        ...(flatOrdered.slots[boundary] ?? [])
          .filter((id) => flatNodes.has(id))
          .map(
            (id) => (flatBoxes.find((box) => box.id === id)?.x ?? 0) + boxOfWidth(flatBoxes, id),
          ),
      );
      const left = Math.min(
        ...(flatOrdered.slots[boundary + 1] ?? []).map(
          (id) => flatBoxes.find((box) => box.id === id)?.x ?? 0,
        ),
      );
      const inside = line.points.filter((point) => point.x > right && point.x < left);
      assert.ok(inside.length >= 1, `${label}: ${line.id} passes boundary ${boundary}'s channel`);
      assert.equal(
        new Set(inside.map((point) => point.x)).size,
        1,
        `${label}: ${line.id} keeps one track across boundary ${boundary}`,
      );
    }
  }

  for (const ids of ordered.slots) {
    for (let index = 1; index < ids.length; index += 1) {
      const above = byId.get(ids[index - 1]);
      const below = byId.get(ids[index]);
      assert.ok(
        (below?.y ?? 0) >= (above?.y ?? 0) + (above?.height ?? 0) + NODE_GAP - 1e-9,
        `${label}: ${below?.id} clears ${above?.id} by the spacing`,
      );
    }
  }

  tally.graphs += 1;
  tally.nodes += graph.nodes.length;
  tally.edges += graph.edges.length;
  tally.pushes += report.pushes ?? 0;
  tally.rounds = Math.max(tally.rounds, report.rounds ?? 0);
  tally.constrained += crossings(sized, ordered);
  tally.flat += crossings(flat, flatOrdered);
  return { cross, flat: crossings(flat, flatOrdered), constrained: crossings(sized, ordered) };
};

const boxOfWidth = (boxes, id) => boxes.find((box) => box.id === id)?.width ?? 0;

const shapes = [
  ["two clusters", twoClusters()],
  ["three clusters", threeClusters()],
  [
    "one cluster",
    {
      nodes: ["a", "b", "c", "d"],
      edges: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "d" },
      ],
      clusters: [{ id: "only", members: ["b", "c"] }],
    },
  ],
  [
    "a cluster of one",
    {
      nodes: ["a", "b", "c"],
      edges: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
      ],
      clusters: [{ id: "solo", members: ["b"] }],
    },
  ],
  [
    "isolates in a cluster",
    { nodes: ["a", "b", "c"], edges: [], clusters: [{ id: "c1", members: ["a", "b"] }] },
  ],
];
for (const [name, graph] of shapes) checkGraph(graph, name);

const corpus = clusterCorpus(120);
for (const [seed, graph] of corpus.entries()) {
  checkGraph(
    graph,
    `cluster corpus ${seed} (${graph.nodes.length} nodes, ${graph.clusters.length} clusters)`,
  );
}

const offsets =
  tally.offsets.length === 0
    ? "none"
    : `${Math.min(...tally.offsets).toFixed(1)}–${Math.max(...tally.offsets).toFixed(1)}% of it`;
const busiest = Math.max(0, ...tally.borders.values());
console.log(
  `${shapes.length} shapes and ${corpus.length} two-level graphs hold every property: ` +
    `${tally.nodes} nodes, ${tally.edges} edges, ${tally.cross} cross edges at ${tally.ports} ports on ` +
    `${tally.borders.size} borders (at most ${busiest} a border, ${offsets}); ` +
    `${tally.pushes} boxes pushed in at most ${tally.rounds} rounds; ` +
    `crossings ${tally.constrained} with the blocks against ${tally.flat} flattened over ${tally.graphs} drawings`,
);
