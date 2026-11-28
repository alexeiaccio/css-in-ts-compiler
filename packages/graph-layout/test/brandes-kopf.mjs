/** Brandes–Köpf placement: the median sweeps' invariants, the deviation and the containment over the same corpus, and
 * elk-rs' own `BRANDES_KOEPF` on the same graphs. Run: `bun test/brandes-kopf.mjs`. */
import assert from "node:assert/strict";

import ELK from "@openedges/elk-layout";
import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import { clusterBoxes, clusterIndexOf, layout, minimizeCrossings, place } from "../src/index.ts";
import { clusterCorpus } from "./cluster-graphs.mjs";
import { chain, corpus, cycle, randomGraph } from "./graphs.mjs";

const NODE_GAP = 20;
const STRATEGIES = ["median", "brandes-kopf"];

const sizesOf = (graph) =>
  Object.fromEntries(
    graph.nodes.map((id, index) => [
      id,
      { width: 30 + (index % 3) * 10, height: 20 + (index % 2) * 10 },
    ]),
  );

const centreOf = (box) => box.y + box.height / 2;

const deviation = (graph, boxes) => {
  const byId = new Map(boxes.map((box) => [box.id, box]));
  return graph.edges.reduce((sum, edge) => {
    const from = byId.get(edge.source);
    const to = byId.get(edge.target);
    return from === undefined || to === undefined
      ? sum
      : sum + Math.abs(centreOf(from) - centreOf(to));
  }, 0);
};

const checkPlacement = (graph, label) => {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = minimizeCrossings(sized, layout(sized));
  const nodes = new Set(graph.nodes);
  for (const strategy of STRATEGIES) {
    const boxes = place(sized, ordered, {}, { placement: strategy });
    assert.deepEqual(
      place(sized, ordered, {}, { placement: strategy }),
      boxes,
      `${label} (${strategy}): the same input, the same drawing`,
    );
    const byId = new Map(boxes.map((box) => [box.id, box]));
    assert.deepEqual(
      boxes.map((box) => box.id),
      ordered.slots.flat(),
      `${label} (${strategy}): every slot is placed once, in the layout's order`,
    );
    for (const [layer, ids] of ordered.slots.entries()) {
      const placed = ids.map((id) => byId.get(id));
      const first = placed[0];
      if (first === undefined) continue;
      for (const box of placed) {
        assert.ok(box !== undefined, `${label} (${strategy}): ${ids.join(",")} has boxes`);
        assert.equal(box.x, first.x, `${label} (${strategy}): layer ${layer} is one column`);
      }
      for (let index = 1; index < placed.length; index += 1) {
        const above = placed[index - 1];
        const below = placed[index];
        if (above === undefined || below === undefined) continue;
        assert.ok(
          below.y >= above.y + above.height + NODE_GAP - 1e-9,
          `${label} (${strategy}): ${below.id} clears ${above.id} by the spacing`,
        );
      }
    }
    for (const box of boxes) {
      if (nodes.has(box.id)) continue;
      assert.equal(box.width, 0, `${label} (${strategy}): ${box.id} is a point`);
      assert.equal(box.height, 0, `${label} (${strategy}): ${box.id} is a point`);
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
    assert.deepEqual(overlapping, [], `${label} (${strategy}): no two boxes overlap`);
  }
  assert.deepEqual(
    place(sized, ordered),
    place(sized, ordered, {}, { placement: "median" }),
    `${label}: the default is the median strategy`,
  );
  return sized;
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
    "self loops",
    {
      nodes: ["a", "b", "c"],
      edges: [
        { source: "a", target: "a" },
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "c" },
      ],
    },
  ],
  ["chain of 200", chain(200)],
  ["cycle of 200", cycle(200)],
  ["dense 40", randomGraph(7, { maxNodes: 40, density: 0.5, isolates: 0 })],
];

const seeded = corpus(120);
for (const [name, graph] of shapes) checkPlacement(graph, name);
for (const [seed, graph] of seeded.entries()) {
  checkPlacement(graph, `corpus ${seed} (${graph.nodes.length} nodes)`);
}

const deviationOf = (graphs, ordered) => {
  const totals = { median: 0, "brandes-kopf": 0 };
  for (const [index, graph] of graphs.entries()) {
    const sized = { ...graph, sizes: sizesOf(graph) };
    const layout0 = ordered[index] ?? minimizeCrossings(sized, layout(sized));
    for (const strategy of STRATEGIES) {
      totals[strategy] += deviation(graph, place(sized, layout0, {}, { placement: strategy }));
    }
  }
  return totals;
};

const shapeDeviation = deviationOf(
  shapes.map(([, graph]) => graph),
  [],
);
const seededDeviation = deviationOf(seeded, []);
console.log(
  `${shapes.length} shapes and ${seeded.length} seeded graphs hold both strategies' invariants; ` +
    `deviation over the shapes median ${shapeDeviation.median.toFixed(1)}, brandes-kopf ` +
    `${shapeDeviation["brandes-kopf"].toFixed(1)}; over the seeded graphs median ` +
    `${seededDeviation.median.toFixed(1)}, brandes-kopf ${seededDeviation["brandes-kopf"].toFixed(1)}`,
);

const SIZES = Object.fromEntries(GRAPH_LAYOUT_NODES.map((id) => [id, { width: 40, height: 20 }]));

const graphOf = (pick) => ({
  nodes: [...GRAPH_LAYOUT_NODES],
  sizes: SIZES,
  edges: GRAPH_LAYOUT_PICKS[pick].edges
    .split(" ")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [source, target] = pair.split(">");
      return { source, target };
    }),
});

const OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": 20,
  "elk.layered.spacing.nodeNodeBetweenLayers": 30,
  "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
  "elk.layered.layering.strategy": "LONGEST_PATH",
  "elk.layered.crossingMinimization.strategy": "NONE",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
};

const elk = new ELK();

const elkBoxesOf = async (graph, sizes) => {
  const out = await elk.layout({
    id: "root",
    layoutOptions: OPTIONS,
    children: graph.nodes.map((id) => ({ id, ...(sizes[id] ?? { width: 0, height: 0 }) })),
    edges: graph.edges.map((edge, index) => ({
      id: `e${index}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });
  return (out.children ?? []).map((child) => ({
    id: child.id,
    x: child.x ?? 0,
    y: child.y ?? 0,
    width: child.width ?? 0,
    height: child.height ?? 0,
  }));
};

const columnsOf = (boxes) => {
  const xs = [...new Set(boxes.map((box) => box.x))].sort((one, two) => one - two);
  return xs.map((x) =>
    boxes
      .filter((box) => box.x === x)
      .map((box) => box.id)
      .sort(),
  );
};

const six = [1, 2, 3, 4, 5, 6].map(graphOf);
let sixOurs = 0;
let sixElk = 0;
for (const [index, graph] of six.entries()) {
  const pick = index + 1;
  const ordered = minimizeCrossings(graph, layout(graph));
  const ours = deviation(graph, place(graph, ordered, {}, { placement: "brandes-kopf" }));
  const elkBoxes = await elkBoxesOf(graph, SIZES);
  assert.deepEqual(
    columnsOf(elkBoxes),
    columnsOf(place(graph, ordered).filter((box) => graph.nodes.includes(box.id))),
  );
  sixOurs += ours;
  sixElk += deviation(graph, elkBoxes);
  console.log(
    `pick ${pick}: brandes-kopf ${ours.toFixed(1)}, elk BRANDES_KOEPF ` +
      `${deviation(graph, elkBoxes).toFixed(1)}, median ` +
      `${deviation(graph, place(graph, ordered)).toFixed(1)}`,
  );
}

const oracle = seeded.slice(0, 60);
let corpusOurs = 0;
let corpusElk = 0;
let orderAgrees = 0;
for (const graph of oracle) {
  const sized = { ...graph, sizes: sizesOf(graph) };
  const ordered = minimizeCrossings(sized, layout(sized));
  const boxes = place(sized, ordered, {}, { placement: "brandes-kopf" });
  const elkBoxes = await elkBoxesOf(graph, sized.sizes);
  corpusOurs += deviation(graph, boxes);
  corpusElk += deviation(graph, elkBoxes);
  if (
    JSON.stringify(ordered.slots.map((ids) => ids.filter((id) => graph.nodes.includes(id)))) ===
    JSON.stringify(columnsOf(elkBoxes))
  ) {
    orderAgrees += 1;
  }
}
console.log(
  `six spec graphs: brandes-kopf ${sixOurs.toFixed(1)}, elk BRANDES_KOEPF ${sixElk.toFixed(1)}; ` +
    `${oracle.length} seeded graphs: brandes-kopf ${corpusOurs.toFixed(1)}, elk ${corpusElk.toFixed(1)} ` +
    `(the real nodes' order within a column agrees on ${orderAgrees} of ${oracle.length} graphs)`,
);

const clumped = clusterCorpus(120).map((graph) => ({ ...graph, sizes: sizesOf(graph) }));
const containment = { median: { pushes: 0, rounds: 0 }, "brandes-kopf": { pushes: 0, rounds: 0 } };
for (const graph of clumped) {
  const ordered = minimizeCrossings(graph, layout(graph));
  const { clusters } = clusterIndexOf(graph);
  for (const strategy of STRATEGIES) {
    const report = {};
    const boxes = place(graph, ordered, { clusters: { report } }, { placement: strategy });
    containment[strategy].pushes += report.pushes ?? 0;
    containment[strategy].rounds = Math.max(containment[strategy].rounds, report.rounds ?? 0);
    const byId = new Map(boxes.map((box) => [box.id, box]));
    for (const rect of clusterBoxes(graph, boxes)) {
      const cluster = clusters.find((candidate) => candidate.id === rect.id);
      for (const member of cluster?.members ?? []) {
        const box = byId.get(member);
        assert.ok(
          box.x >= rect.x - 1e-9 &&
            box.y >= rect.y - 1e-9 &&
            box.x + box.width <= rect.x + rect.width + 1e-9 &&
            box.y + box.height <= rect.y + rect.height + 1e-9,
          `${cluster.id}: ${member} is inside its box (${strategy})`,
        );
      }
      for (const box of boxes) {
        if (cluster?.members.includes(box.id) || box.width === 0 || box.height === 0) continue;
        assert.ok(
          !(box.x < rect.x + rect.width && rect.x < box.x + box.width) ||
            !(box.y < rect.y + rect.height && rect.y < box.y + box.height),
          `${cluster.id}: ${box.id} is outside it (${strategy})`,
        );
      }
    }
  }
}
console.log(
  `${clumped.length} two-level graphs keep every box around its members with no stranger inside: ` +
    `the containment pushes ${containment["brandes-kopf"].pushes} boxes for brandes-kopf in at most ` +
    `${containment["brandes-kopf"].rounds} rounds against ${containment.median.pushes} for the median`,
);
