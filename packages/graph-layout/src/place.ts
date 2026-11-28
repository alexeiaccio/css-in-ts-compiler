import { dummyId } from "./dummy.ts";
import type { Graph, Layout } from "./index.ts";

/** A node's box: what the drawing reserves. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/** A placed slot: its id, its box's top-left corner and the box. A dummy is a point (`0 × 0`). */
export interface Placement extends Size {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

/** The gaps a placement keeps: between the boxes of one layer, and between layers. */
export interface Spacing {
  readonly nodes?: number;
  readonly layers?: number;
}

const DEFAULT_NODE_SPACING = 20;
const DEFAULT_LAYER_SPACING = 30;

interface Point {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Chain {
  readonly from: string;
  readonly to: string;
  readonly layer: number;
}

const push = (map: Map<string, string[]>, key: string, value: string): void => {
  map.set(key, [...(map.get(key) ?? []), value]);
};

/**
 * The drawing's relations, from the slots: nodes that meet across one boundary (what the alignment passes move), and the
 * dummies with the two nodes their edge joins (which are placed on the straight line between them, not aligned themselves).
 *
 * @param {Graph} graph the graph the layout belongs to
 * @param {Layout} layout a layout of that graph
 * @returns {{ before: Map<string, string[]>; after: Map<string, string[]>; chains: Map<string, Chain> }} the adjacency and
 * the dummies' chains
 */
const relationsOf = (
  graph: Graph,
  layout: Layout,
): {
  before: Map<string, string[]>;
  after: Map<string, string[]>;
  chains: Map<string, Chain>;
} => {
  const layerOf = new Map<string, number>();
  layout.slots.forEach((ids, layer) => ids.forEach((id) => layerOf.set(id, layer)));
  const before = new Map<string, string[]>();
  const after = new Map<string, string[]>();
  const chains = new Map<string, Chain>();
  const seen = new Set<string>();
  for (const edge of graph.edges) {
    const source = layerOf.get(edge.source);
    const target = layerOf.get(edge.target);
    if (source === undefined || target === undefined || source === target) continue;
    const from = source < target ? edge.source : edge.target;
    const to = source < target ? edge.target : edge.source;
    const key = `${from}>${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const first = layerOf.get(from) ?? 0;
    const last = layerOf.get(to) ?? 0;
    if (last === first + 1) {
      push(after, from, to);
      push(before, to, from);
    }
    for (let layer = first + 1; layer < last; layer += 1) {
      const id = dummyId({ source: from, target: to }, layer);
      chains.set(id, { from, to, layer });
    }
  }
  return { before, after, chains };
};

const centre = (point: Point | undefined): number =>
  point === undefined ? 0 : point.y + point.height / 2;

const median = (values: ReadonlyArray<number>): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((one, two) => one - two);
  const middle = Math.floor(sorted.length / 2);
  const at = sorted[middle] ?? 0;
  const below = sorted[middle - 1];
  return sorted.length % 2 === 0 && below !== undefined ? (below + at) / 2 : at;
};

/**
 * Boxes for a layout: each layer a column at its own x, each slot a box below the one before, then the boxes moved toward
 * the median of their neighbours' centres (a pass forward, a pass backward, twice), each layer moved as one piece onto its
 * neighbours, and every dummy put on the straight line between the two nodes its edge joins. The slot order and the gaps are
 * never broken, so the result is a placement the invariants hold for.
 *
 * Sizes come from `graph.sizes`; a node without one is placed as a point, and so is every dummy.
 *
 * @param {Graph} graph the graph the layout belongs to
 * @param {Layout} layout a layout of that graph
 * @param {Spacing} spacing the gaps between boxes and between layers
 * @returns {ReadonlyArray<Placement>} the slots' boxes, dummies included
 */
export const place = (
  graph: Graph,
  layout: Layout,
  spacing: Spacing = {},
): ReadonlyArray<Placement> => {
  const nodeGap = spacing.nodes ?? DEFAULT_NODE_SPACING;
  const layerGap = spacing.layers ?? DEFAULT_LAYER_SPACING;
  const nodes = new Set(graph.nodes);
  const sizeOf = (id: string): Size => graph.sizes?.[id] ?? { width: 0, height: 0 };

  const widths = layout.slots.map((ids) =>
    Math.max(0, ...ids.filter((id) => nodes.has(id)).map((id) => sizeOf(id).width)),
  );
  const xs: number[] = [];
  let x = 0;
  for (const width of widths) {
    xs.push(x);
    x += width + layerGap;
  }

  const points: Point[][] = layout.slots.map((ids, layer) => {
    let y = 0;
    return ids.map((id) => {
      const size = nodes.has(id) ? sizeOf(id) : { width: 0, height: 0 };
      const point = { id, x: xs[layer] ?? 0, y, width: size.width, height: size.height };
      y += size.height + nodeGap;
      return point;
    });
  });
  const byId = new Map<string, Point>();
  for (const point of points.flat()) byId.set(point.id, point);
  const { before, after, chains } = relationsOf(graph, layout);

  const align = (neighbours: ReadonlyMap<string, string[]>, order: ReadonlyArray<number>): void => {
    for (const layer of order) {
      const ids = points[layer];
      if (ids === undefined) continue;
      let floor = Number.NEGATIVE_INFINITY;
      for (const point of ids) {
        const centres = (neighbours.get(point.id) ?? []).map((id) => centre(byId.get(id)));
        const wanted = centres.length === 0 ? point.y : median(centres) - point.height / 2;
        point.y = Math.max(floor, wanted);
        floor = point.y + point.height + nodeGap;
      }
    }
  };

  const compact = (): void => {
    for (const ids of points) {
      const first = ids[0];
      if (first === undefined) continue;
      let floor = first.y;
      for (const point of ids) {
        point.y = Math.max(point.y, floor);
        floor = point.y + point.height + nodeGap;
      }
    }
  };

  const settle = (
    neighbours: ReadonlyMap<string, string[]>,
    order: ReadonlyArray<number>,
  ): void => {
    for (const layer of order) {
      const ids = points[layer];
      if (ids === undefined || ids.length === 0) continue;
      const offsets = ids.flatMap((point) =>
        (neighbours.get(point.id) ?? []).map((id) => centre(byId.get(id)) - centre(point)),
      );
      if (offsets.length === 0) continue;
      const shift = median(offsets);
      for (const point of ids) point.y += shift;
    }
  };

  const spine = points.map((_, layer) => layer);
  for (let round = 0; round < 2; round += 1) {
    align(before, spine);
    compact();
    align(after, [...spine].reverse());
    compact();
    settle(before, spine);
    settle(after, [...spine].reverse());
  }

  for (const [id, chain] of chains) {
    const dummy = byId.get(id);
    const from = byId.get(chain.from);
    const to = byId.get(chain.to);
    const first = points.findIndex((ids) => ids.some((point) => point.id === chain.from));
    const last = points.findIndex((ids) => ids.some((point) => point.id === chain.to));
    if (dummy === undefined || from === undefined || to === undefined) continue;
    if (first < 0 || last <= first) continue;
    const ratio = (chain.layer - first) / (last - first);
    const wanted = centre(from) + (centre(to) - centre(from)) * ratio;
    const ids = points[chain.layer] ?? [];
    const index = ids.indexOf(dummy);
    const above = ids[index - 1];
    const below = ids[index + 1];
    const low = above === undefined ? Number.NEGATIVE_INFINITY : above.y + above.height + nodeGap;
    const high = below === undefined ? Number.POSITIVE_INFINITY : below.y - nodeGap;
    dummy.y = Math.max(low, Math.min(wanted, high));
  }

  const rows = points.flat();
  const top = rows.length === 0 ? 0 : Math.min(...rows.map((point) => point.y));
  for (const point of rows) point.y -= top;

  return points.flat().map(({ id, x: column, y: row, width, height }) => ({
    id,
    x: column,
    y: row,
    width,
    height,
  }));
};
