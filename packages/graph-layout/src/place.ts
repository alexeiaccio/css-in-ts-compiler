import { clusterIndexOf } from "./cluster.ts";
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

/** What a cluster's box keeps around its members, on every side. */
export const DEFAULT_CLUSTER_PADDING = 12;

/** A cluster's box, and what the containment pass did to get there. */
export interface ClusterSpacing {
  readonly padding?: number;
  /** Filled in by {@link place}: the boxes the containment pass pushed, and the rounds it settled in. */
  readonly report?: { pushes: number; rounds: number };
}

/** The gaps a placement keeps: between the boxes of one layer, between layers, and around a cluster's members. */
export interface Spacing {
  readonly nodes?: number;
  readonly layers?: number;
  readonly clusters?: ClusterSpacing;
}

const DEFAULT_NODE_SPACING = 20;
const DEFAULT_LAYER_SPACING = 30;
const MAX_CONTAINMENT_ROUNDS = 8;

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

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const boundsOf = (boxes: ReadonlyArray<Point>, padding: number): Rect | undefined => {
  if (boxes.length === 0) return undefined;
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return {
    x: left - padding,
    y: top - padding,
    width: right - left + 2 * padding,
    height: bottom - top + 2 * padding,
  };
};

const owned = (graph: Graph, members: ReadonlySet<string>, id: string): boolean =>
  graph.edges.some((edge) =>
    (
      [
        [edge.source, edge.target],
        [edge.target, edge.source],
      ] as const
    ).some(([from, to]) => members.has(from) && members.has(to) && id.startsWith(`${from}>${to}@`)),
  );

/**
 * What a cluster's box holds: its members, and the dummies of the long edges between them that sit in their columns. A dummy
 * of an edge that leaves the cluster is the router's to keep inside the box (see {@link route}), not the placement's: a box that
 * followed such a dummy would grow after every node the containment pushes away from it.
 *
 * @param {Graph} graph the graph the boxes belong to
 * @param {ReadonlySet<string>} members the cluster's nodes
 * @param {ReadonlyMap<string, Point>} byId every slot's box
 * @returns {ReadonlyArray<Point>} the slots the box is drawn around
 */
const holds = (
  graph: Graph,
  members: ReadonlySet<string>,
  byId: ReadonlyMap<string, Point>,
): ReadonlyArray<Point> => {
  const own = [...byId.values()].filter((point) => members.has(point.id));
  const rect = boundsOf(own, 0);
  if (rect === undefined) return own;
  const right = rect.x + rect.width;
  const loose = [...byId.values()].filter(
    (point) =>
      !members.has(point.id) &&
      point.width === 0 &&
      point.height === 0 &&
      point.x >= rect.x &&
      point.x <= right &&
      owned(graph, members, point.id),
  );
  return [...own, ...loose];
};

/**
 * One box per cluster: the slots {@link holds} names, grown by `padding` on every side. A member without a size is a point, as
 * in {@link place}, and a cluster of one member is its node's box grown by the padding.
 *
 * @param {Graph} graph the graph whose clusters are wanted
 * @param {ReadonlyArray<Placement>} boxes the slots' boxes, as {@link place} returns them
 * @param {number} padding the space between what the box holds and the border, 12 by default
 * @returns {ReadonlyArray<Placement>} one box per cluster, keyed by the cluster's id
 */
export const clusterBoxes = (
  graph: Graph,
  boxes: ReadonlyArray<Placement>,
  padding: number = DEFAULT_CLUSTER_PADDING,
): ReadonlyArray<Placement> => {
  const { clusters } = clusterIndexOf(graph);
  const byId = new Map<string, Point>(boxes.map((box) => [box.id, box]));
  return clusters.flatMap((cluster) => {
    const rect = boundsOf(holds(graph, new Set(cluster.members), byId), padding);
    return rect === undefined ? [] : [{ id: cluster.id, ...rect }];
  });
};

const inside = (point: Point, rect: Rect): boolean =>
  point.width > 0 &&
  point.height > 0 &&
  point.x < rect.x + rect.width &&
  rect.x < point.x + point.width &&
  point.y < rect.y + rect.height &&
  rect.y < point.y + point.height;

const drop = (ids: Point[], at: number, floor: number, gap: number): boolean => {
  const point = ids[at];
  if (point === undefined || point.y >= floor) return false;
  point.y = floor;
  for (let index = at + 1; index < ids.length; index += 1) {
    const above = ids[index - 1];
    const below = ids[index];
    if (above === undefined || below === undefined) continue;
    const room = above.y + above.height + gap;
    if (below.y < room) below.y = room;
  }
  return true;
};

const lift = (ids: Point[], at: number, ceiling: number, gap: number): boolean => {
  const point = ids[at];
  if (point === undefined || point.y + point.height <= ceiling) return false;
  point.y = ceiling - point.height;
  for (let index = at - 1; index >= 0; index -= 1) {
    const above = ids[index];
    const below = ids[index + 1];
    if (above === undefined || below === undefined) continue;
    const room = below.y - gap - above.height;
    if (above.y > room) above.y = room;
  }
  return true;
};

interface Violation {
  readonly ids: Point[];
  readonly at: number;
  readonly point: Point;
  readonly cluster: string;
  readonly rect: Rect;
  readonly up: boolean;
}

/**
 * The containment post-pass: no node that is not a member may intersect its cluster's box.
 *
 * A round reads every cluster's box off the slots it holds and collects the nodes that are inside one. A node is pushed away
 * from the box: up when it sits above the cluster's block in its layer (the only direction that keeps the layer monotone), down
 * when it sits below it, and, in a layer with no member, away from the cluster's own slots there and otherwise the shorter way
 * out — and the rest of the layer follows through the same spacing the placement keeps. The push moves nodes, not clusters: a
 * box is always read off what the cluster holds, so a round that moves members re-reads it.
 *
 * @param {Graph} graph the graph the placement belongs to
 * @param {Point[][]} points the slots' boxes per layer, mutated
 * @param {number} gap the spacing between two boxes of a layer
 * @param {number} padding the space between a member and its cluster's border
 * @param {{ pushes: number; rounds: number } | undefined} report filled in with the pushes and the rounds it settled in
 */
const contain = (
  graph: Graph,
  points: Point[][],
  gap: number,
  padding: number,
  report: { pushes: number; rounds: number } | undefined,
): void => {
  const { clusters } = clusterIndexOf(graph);
  if (clusters.length === 0) return;
  const byId = new Map<string, Point>();
  for (const ids of points) for (const point of ids) byId.set(point.id, point);
  const members = clusters.map((cluster) => ({
    id: cluster.id,
    members: new Set(cluster.members),
  }));
  let pushes = 0;
  for (let round = 1; round <= MAX_CONTAINMENT_ROUNDS; round += 1) {
    const violations: Violation[] = [];
    for (const cluster of members) {
      const own = holds(graph, cluster.members, byId);
      const rect = boundsOf(own, padding);
      if (rect === undefined) continue;
      const mine = new Set(own.map((point) => point.id));
      for (const ids of points) {
        const block = ids.flatMap((point, at) => (cluster.members.has(point.id) ? [at] : []));
        const low = block[0];
        const above = ids.flatMap((point, at) => (mine.has(point.id) ? [at] : []));
        for (const [at, point] of ids.entries()) {
          if (mine.has(point.id) || !inside(point, rect)) continue;
          const up =
            low !== undefined
              ? at < low
              : above.some((index) => index > at) ||
                (above.length === 0 &&
                  point.y + point.height - rect.y < rect.y + rect.height - point.y);
          violations.push({ ids, at, point, cluster: cluster.id, rect, up });
        }
      }
    }
    if (report !== undefined) {
      report.pushes = pushes;
      report.rounds = round - 1;
    }
    if (violations.length === 0) return;
    for (const violation of violations) {
      const done = violation.up
        ? lift(violation.ids, violation.at, violation.rect.y - gap, gap)
        : drop(violation.ids, violation.at, violation.rect.y + violation.rect.height + gap, gap);
      if (done) pushes += 1;
    }
  }
  const stuck = members.flatMap((cluster) => {
    const own = holds(graph, cluster.members, byId);
    const rect = boundsOf(own, padding);
    if (rect === undefined) return [];
    const mine = new Set(own.map((point) => point.id));
    return points.flatMap((ids) =>
      ids
        .filter((point) => !mine.has(point.id) && inside(point, rect))
        .map((point) => `${point.id} in cluster ${cluster.id}`),
    );
  });
  if (stuck.length > 0) {
    throw new RangeError(
      `clusters cannot be kept apart after ${MAX_CONTAINMENT_ROUNDS} rounds: ${stuck.join(", ")}`,
    );
  }
  if (report !== undefined) {
    report.pushes = pushes;
    report.rounds = MAX_CONTAINMENT_ROUNDS;
  }
};

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

  const straighten = (): void => {
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
  };

  straighten();
  const padding = spacing.clusters?.padding ?? DEFAULT_CLUSTER_PADDING;
  if ((graph.clusters ?? []).length > 0) {
    contain(graph, points, nodeGap, padding, spacing.clusters?.report);
    straighten();
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
