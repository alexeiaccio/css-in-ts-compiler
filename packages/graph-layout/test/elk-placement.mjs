// The placement against elk-rs: the same six graphs, the same boxes, the same strategies the spec oracle pins — except that
// ELK is asked for `nodePlacement.strategy: SIMPLE`, the only placement whose result is a function of the input order
// (Brandes-Köpf and network simplex optimize and can return either of two equivalent drawings). Run: `bun test/elk-placement.mjs`.
import ELK from "@openedges/elk-layout";

import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import { layout, minimizeCrossings, place } from "../src/index.ts";

// The oracle's pinned options (packages/apg-specs/test/patterns/elk.ts), with placement SIMPLE: a drawing comparison pins its
// own knobs, and this file is the one that says which.
const OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": 20,
  "elk.layered.spacing.nodeNodeBetweenLayers": 30,
  "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
  "elk.layered.layering.strategy": "LONGEST_PATH",
  "elk.layered.crossingMinimization.strategy": "NONE",
  "elk.layered.nodePlacement.strategy": "SIMPLE",
};

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

const elkGraphOf = (pick) => ({
  id: "root",
  layoutOptions: OPTIONS,
  children: GRAPH_LAYOUT_NODES.map((id) => ({ id, ...SIZES[id] })),
  edges: graphOf(pick).edges.map((edge) => ({
    id: `${edge.source}${edge.target}`,
    sources: [edge.source],
    targets: [edge.target],
  })),
});

const columns = (boxes) => {
  const xs = [...new Set(boxes.map((box) => box.x))].sort((a, b) => a - b);
  return xs.map((x) =>
    boxes
      .filter((box) => box.x === x)
      .map((box) => box.id)
      .sort(),
  );
};

const straightness = (edges, boxes) => {
  const byId = new Map(boxes.map((box) => [box.id, box]));
  return edges.reduce((sum, edge) => {
    const from = byId.get(edge.source);
    const to = byId.get(edge.target);
    return from === undefined || to === undefined
      ? sum
      : sum + Math.abs(from.y + from.height / 2 - (to.y + to.height / 2));
  }, 0);
};

const overlaps = (boxes) =>
  boxes.flatMap((one, index) =>
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

const elk = new ELK();
let ours = 0;
let theirs = 0;
for (const pick of [1, 2, 3, 4, 5, 6]) {
  const graph = graphOf(pick);
  const layouted = minimizeCrossings(graph, layout(graph));
  const boxes = place(graph, layouted).filter((box) => box.width > 0);
  const out = await elk.layout(elkGraphOf(pick));
  const elkBoxes = (out.children ?? []).map((child) => ({
    id: child.id,
    x: child.x ?? 0,
    y: child.y ?? 0,
    width: child.width ?? 0,
    height: child.height ?? 0,
  }));
  const oursColumns = JSON.stringify(columns(boxes));
  const elkColumns = JSON.stringify(columns(elkBoxes));
  const oursStraight = straightness(graph.edges, boxes);
  const elkStraight = straightness(graph.edges, elkBoxes);
  ours += oursStraight;
  theirs += elkStraight;
  console.log(
    `pick ${pick}: columns ${oursColumns === elkColumns ? "agree" : `DIFFER ${oursColumns} vs ${elkColumns}`}, ` +
      `overlaps ours=${overlaps(boxes).length} elk=${overlaps(elkBoxes).length}, ` +
      `straightness ours=${oursStraight.toFixed(1)} elk=${elkStraight.toFixed(1)}`,
  );
  if (oursColumns !== elkColumns) process.exitCode = 1;
  if (overlaps(boxes).length > 0) process.exitCode = 1;
}
console.log(
  `straightness over the six graphs: ours ${ours.toFixed(1)}, elk SIMPLE ${theirs.toFixed(1)}`,
);
if (ours > theirs) {
  console.log(
    "the placement is less straight than elk's SIMPLE: that is the deviation to document",
  );
  process.exitCode = 1;
}
