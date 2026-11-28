// The compound fixture against elk-rs with `hierarchyHandling: INCLUDE_CHILDREN`: what the two engines can be compared on —
// the columns of the nodes, the containment of each cluster's box, how often a cross-hierarchy edge crosses a border, and the
// crossings drawn — and where they part: ELK layers the clusters, not the nodes, so an unclustered node with a cross edge lands
// after every cluster and that edge is drawn right to left. Run: `bun test/elk-compound.mjs`.
import assert from "node:assert/strict";

import ELK from "@openedges/elk-layout";

import {
  assignLayers,
  breakCycles,
  clusterBoxes,
  layout,
  minimizeCrossings,
  place,
  route,
} from "../src/index.ts";
import { threeClusters, twoClusters } from "./cluster-graphs.mjs";

// Pinned for the comparison: the strategies the rest of the oracle pins, plus the compound mode and the padding whose 12 px the
// engine's boxes default to. A drawing comparison pins its own knobs.
const OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": 20,
  "elk.layered.spacing.nodeNodeBetweenLayers": 30,
  "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
  "elk.layered.layering.strategy": "LONGEST_PATH",
  "elk.layered.crossingMinimization.strategy": "NONE",
  "elk.layered.nodePlacement.strategy": "SIMPLE",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.padding": "[top=12,left=12,bottom=12,right=12]",
};

const SIZE = { width: 40, height: 20 };

const elkGraph = (graph) => ({
  id: "root",
  layoutOptions: OPTIONS,
  children: [
    ...graph.clusters.map((cluster) => ({
      id: cluster.id,
      layoutOptions: OPTIONS,
      children: cluster.members.map((id) => ({ id, ...SIZE })),
    })),
    ...graph.nodes
      .filter((id) => !graph.clusters.some((cluster) => cluster.members.includes(id)))
      .map((id) => ({ id, ...SIZE })),
  ],
  edges: graph.edges.map((edge) => ({
    id: `${edge.source}${edge.target}`,
    sources: [edge.source],
    targets: [edge.target],
  })),
});

// A compound node's children carry their own origin: the drawing's coordinates are the parent's plus the child's.
const flatten = (out) => {
  const boxes = new Map();
  const walk = (node, x, y) => {
    const left = x + (node.x ?? 0);
    const top = y + (node.y ?? 0);
    if (node.id !== "root") {
      boxes.set(node.id, { x: left, y: top, width: node.width ?? 0, height: node.height ?? 0 });
    }
    for (const child of node.children ?? []) walk(child, left, top);
  };
  walk(out, 0, 0);
  return boxes;
};

const segmentsOf = (points) =>
  points.slice(1).map((to, index) => {
    const from = points[index];
    return { from, to, horizontal: from.y === to.y };
  });

const columnsOf = (boxes) => {
  const xs = [...new Set([...boxes.values()].map((box) => box.x))].sort((one, two) => one - two);
  return xs.map((x) =>
    [...boxes]
      .filter(([, box]) => box.x === x)
      .map(([id]) => id)
      .sort(),
  );
};

const insideBox = (box, rect) =>
  box.x >= rect.x - 1e-9 &&
  box.y >= rect.y - 1e-9 &&
  box.x + box.width <= rect.x + rect.width + 1e-9 &&
  box.y + box.height <= rect.y + rect.height + 1e-9;

const overlaps = (one, two) =>
  one.x < two.x + two.width &&
  two.x < one.x + one.width &&
  one.y < two.y + two.height &&
  two.y < one.y + one.height;

// The crossings of a polyline with a box's border, counted the way the cluster suite counts them: a segment that runs from one
// side of a border line to the other, strictly inside its extent.
const borderHits = (points, rect) => {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  let count = 0;
  for (const segment of segmentsOf(points)) {
    const { from, to } = segment;
    if (segment.horizontal) {
      for (const x of [rect.x, right]) {
        if (Math.min(from.x, to.x) < x && x < Math.max(from.x, to.x)) {
          if (from.y > rect.y && from.y < bottom) count += 1;
        }
      }
      continue;
    }
    for (const y of [rect.y, bottom]) {
      if (Math.min(from.y, to.y) < y && y < Math.max(from.y, to.y)) {
        if (from.x > rect.x && from.x < right) count += 1;
      }
    }
  }
  return count;
};

const drawnCrossings = (routes) => {
  const segments = routes.flatMap((line) => segmentsOf(line.points));
  let count = 0;
  for (let first = 0; first < segments.length; first += 1) {
    for (let second = first + 1; second < segments.length; second += 1) {
      const mine = segments[first];
      const theirs = segments[second];
      if (mine === undefined || theirs === undefined) continue;
      const horizontal = mine.horizontal ? mine : theirs;
      const vertical = mine.horizontal ? theirs : mine;
      if (horizontal.horizontal === vertical.horizontal) continue;
      const x = vertical.from.x;
      const y = horizontal.from.y;
      if (
        x > Math.min(horizontal.from.x, horizontal.to.x) &&
        x < Math.max(horizontal.from.x, horizontal.to.x) &&
        y > Math.min(vertical.from.y, vertical.to.y) &&
        y < Math.max(vertical.from.y, vertical.to.y)
      ) {
        count += 1;
      }
    }
  }
  return count;
};

const elk = new ELK();
/** @type {Array<{ name: string; columns: string[]; elkColumns: string[]; boxes: string[]; elkBoxes: string[]; crossings: number; elkCrossings: number }>} */
const report = [];
/** @type {ReadonlyArray<[string, ReturnType<typeof twoClusters>]>} */
const fixtures = [
  ["two clusters", twoClusters()],
  ["three clusters", threeClusters()],
];

for (const [name, graph] of fixtures) {
  const sized = {
    ...graph,
    sizes: Object.fromEntries(graph.nodes.map((id) => [id, SIZE])),
  };
  const ordered = minimizeCrossings(sized, layout(sized));
  const placed = place(sized, ordered);
  const boxes = new Map(placed.map((box) => [box.id, box]));
  const ours = route(sized, ordered, placed);
  const clusters = clusterBoxes(sized, placed, 12);

  const out = await elk.layout(elkGraph(graph));
  const elkAll = flatten(out);
  const elkBoxes = new Map(
    [...elkAll].filter(([id]) => !graph.clusters.some((cluster) => cluster.id === id)),
  );
  const elkClusters = graph.clusters.map((cluster) => {
    const box = elkAll.get(cluster.id);
    return {
      id: cluster.id,
      x: box?.x ?? 0,
      y: box?.y ?? 0,
      width: box?.width ?? 0,
      height: box?.height ?? 0,
    };
  });
  const elkRoutes = (out.edges ?? []).map((edge) => ({
    id: edge.id,
    points: (edge.sections ?? []).flatMap((section) => [
      section.startPoint,
      ...(section.bendPoints ?? []),
      section.endPoint,
    ]),
  }));

  const owned = new Map(
    graph.clusters.flatMap((cluster) => cluster.members.map((id) => [id, cluster.id])),
  );
  const cross = graph.edges.filter((edge) => {
    const one = owned.get(edge.source);
    const two = owned.get(edge.target);
    return (one !== undefined || two !== undefined) && one !== two;
  });

  /** @type {ReadonlyArray<[string, Map<string, { x: number; y: number; width: number; height: number }>, ReadonlyArray<{ id: string; x: number; y: number; width: number; height: number }>]>} */
  const engines = [
    ["ours", boxes, clusters],
    ["elk", elkBoxes, elkClusters],
  ];
  for (const [engine, nodes, rectsOf] of engines) {
    for (const cluster of rectsOf) {
      const members = graph.clusters.find((one) => one.id === cluster.id)?.members ?? [];
      for (const id of members) {
        const box = nodes.get(id);
        assert.ok(box !== undefined, `${name} ${engine}: ${cluster.id} has ${id}`);
        assert.ok(insideBox(box, cluster), `${name} ${engine}: ${id} is inside ${cluster.id}`);
      }
      for (const [id, box] of nodes) {
        if (members.includes(id) || box.width === 0) continue;
        assert.ok(!overlaps(box, cluster), `${name} ${engine}: ${id} is outside ${cluster.id}`);
      }
    }
  }

  const sides = (engine, routes, rectsOf) => {
    const counts = [];
    for (const edge of cross) {
      const key = `${edge.source}>${edge.target}`;
      const line = routes.find(
        (one) => one.id === key || one.id === key.split(">").reverse().join(">"),
      );
      if (line === undefined) continue;
      for (const rect of rectsOf) {
        const members = graph.clusters.find((one) => one.id === rect.id)?.members ?? [];
        const inside = members.includes(edge.source)
          ? edge.source
          : members.includes(edge.target)
            ? edge.target
            : undefined;
        if (inside === undefined) continue;
        counts.push({ engine, edge: key, cluster: rect.id, hits: borderHits(line.points, rect) });
      }
    }
    return counts;
  };
  const oursSides = sides("ours", ours, clusters);
  const elkSides = sides("elk", elkRoutes, elkClusters);
  for (const hit of [...oursSides, ...elkSides]) {
    assert.equal(
      hit.hits,
      1,
      `${name}: ${hit.engine} draws ${hit.edge} across ${hit.cluster} once`,
    );
  }

  const layers = [...assignLayers(breakCycles(sized)).keys()];
  assert.deepEqual(
    ordered.layers.flat().slice().sort(),
    layers.slice().sort(),
    `${name}: the inline layering is the flat one`,
  );
  const flat = columnsOf(boxes);
  const elkFlat = columnsOf(elkBoxes);

  for (const cluster of graph.clusters) {
    const mine = cluster.members.map((id) => flat.findIndex((column) => column.includes(id)));
    const theirs = cluster.members.map((id) => elkFlat.findIndex((column) => column.includes(id)));
    assert.equal(new Set(mine).size, mine.length, `${name}: ${cluster.id} has a column per member`);
    assert.equal(
      new Set(theirs).size,
      theirs.length,
      `${name}: elk gives ${cluster.id} a column per member`,
    );
    assert.deepEqual(
      mine,
      [...mine].sort((one, two) => one - two),
      `${name}: ${cluster.id} keeps model order across its columns`,
    );
    assert.deepEqual(
      theirs,
      [...theirs].sort((one, two) => one - two),
      `${name}: elk keeps ${cluster.id} in model order across its columns`,
    );
  }

  report.push({
    name,
    columns: flat.map((column) => column.join(",")),
    elkColumns: elkFlat.map((column) => column.join(",")),
    boxes: clusters.map((one) => `${one.id} ${one.width}×${one.height}`),
    elkBoxes: elkClusters.map((one) => `${one.id} ${one.width}×${one.height}`),
    crossings: drawnCrossings(ours),
    elkCrossings: drawnCrossings(elkRoutes),
  });
}

for (const one of report) {
  console.log(
    `${one.name}: columns ours [${one.columns.join("] [")}] ` +
      `elk [${one.elkColumns.join("] [")}]; clusters ours ${one.boxes.join(", ")} ` +
      `elk ${one.elkBoxes.join(", ")}; drawn crossings ours ${one.crossings} elk ${one.elkCrossings}`,
  );
}
console.log(
  "the two readings: we layer every node, so an unclustered node with a cross edge sits in its columns; " +
    "ELK layers the clusters at the root and puts it after them, drawing those edges right to left — " +
    "the border crossings, the containment and each cluster's member order are what the fixture agrees on",
);
