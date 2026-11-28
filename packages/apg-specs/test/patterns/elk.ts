import type {
  LayoutedEdge,
  LayoutedGraph,
  LayoutedNode,
  LayoutedSection,
} from "@openedges/elk-layout";

import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
  type GraphLayoutPick,
  type Placement,
} from "../../src/patterns/graph-layout.bridge";

/**
 * The strategies this repository pins when elk-rs is the oracle: the portable ones, whose discrete result is a function of
 * the graph instead of a heuristic's tie-breaks. Both graph-layout oracles and the starters' comparison use them.
 */
export const PINNED_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": 20,
  "elk.layered.spacing.nodeNodeBetweenLayers": 30,
  "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
  "elk.layered.layering.strategy": "LONGEST_PATH",
  "elk.layered.crossingMinimization.strategy": "NONE",
  "elk.layered.nodePlacement.strategy": "SIMPLE",
  "elk.edgeRouting": "ORTHOGONAL",
} as const;

/** One of the spec's six graphs as an ELK input: four boxes, the pair list of the pick. */
export const graphOf = (pick: GraphLayoutPick) => ({
  id: "root",
  layoutOptions: PINNED_OPTIONS,
  children: GRAPH_LAYOUT_NODES.map((id) => ({ id, width: 40, height: 20 })),
  edges: GRAPH_LAYOUT_PICKS[pick].edges
    .split(" ")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [source, target] = pair.split(">") as [string, string];
      // the pair's id is its model order (`c>a` is the pair `ac`), which is what a dummy's id is built from
      const id = [source, target].sort().join("");
      return { id, sources: [source], targets: [target] };
    }),
});

export const placementsOf = (graph: LayoutedGraph): ReadonlyArray<Placement> =>
  (graph.children ?? []).map((child: LayoutedNode) => ({
    id: child.id,
    x: child.x ?? 0,
    y: child.y ?? 0,
  }));

const xsOf = (placements: ReadonlyArray<Placement>): ReadonlyArray<number> =>
  [...new Set(placements.map((placement) => placement.x))].sort((left, right) => left - right);

const pointsOf = (section: LayoutedSection) => [
  section.startPoint,
  ...(section.bendPoints ?? []),
  section.endPoint,
];

const crossY = (edge: LayoutedEdge, x: number): number | undefined => {
  for (const section of edge.sections ?? []) {
    const points = pointsOf(section);
    for (let index = 0; index + 1 < points.length; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      if (from === undefined || to === undefined) continue;
      if (Math.min(from.x, to.x) < x && x < Math.max(from.x, to.x)) {
        return from.y + ((to.y - from.y) * (x - from.x)) / (to.x - from.x);
      }
    }
  }
  return undefined;
};

const inside = (node: LayoutedNode, x: number, y: number): boolean =>
  (node.x ?? 0) <= x &&
  x <= (node.x ?? 0) + (node.width ?? 0) &&
  (node.y ?? 0) < y &&
  y < (node.y ?? 0) + (node.height ?? 0);

/**
 * The slots projection of a drawing: per layer, the node ids and the dummies that pass through it, sorted.
 *
 * A dummy is an edge whose ends are two or more layers apart, read back from the route: at each intermediate layer's x the
 * edge has to be drawn in the gap between the boxes, not through one. A route that skips the layer it spans, or crosses it
 * inside a node, is a wrong drawing, and this says so instead of silently dropping the dummy.
 *
 * @param {LayoutedGraph} graph what elk-rs returns
 * @returns {ReadonlyArray<ReadonlyArray<string>>} one array of ids per layer, sorted
 */
export const slotsOfLayout = (graph: LayoutedGraph): ReadonlyArray<ReadonlyArray<string>> => {
  const placements = placementsOf(graph);
  const xs = xsOf(placements);
  const nodesAt = xs.map((x) => (graph.children ?? []).filter((node) => (node.x ?? 0) === x));
  const layers = xs.map((_, layer) => nodesAt[layer]?.map((node) => node.id) ?? []);
  const layerOf = new Map(
    placements.map((placement) => [placement.id, xs.indexOf(placement.x)] as const),
  );
  for (const edge of graph.edges ?? []) {
    const source = layerOf.get(edge.sources?.[0] ?? "");
    const target = layerOf.get(edge.targets?.[0] ?? "");
    if (source === undefined || target === undefined) continue;
    const [first, last] = source < target ? [source, target] : [target, source];
    for (let layer = first + 1; layer < last; layer += 1) {
      const x = xs[layer];
      const y = x === undefined ? undefined : crossY(edge, x);
      if (x === undefined || y === undefined) {
        throw new Error(`edge ${edge.id} does not pass through layer ${layer}`);
      }
      const hit = (nodesAt[layer] ?? []).find((node) => inside(node, x, y));
      if (hit !== undefined) {
        throw new Error(`edge ${edge.id} crosses layer ${layer} inside node ${hit.id}`);
      }
      layers[layer]?.push(`${edge.id}@${layer}`);
    }
  }
  return layers.map((ids) => ids.sort());
};
