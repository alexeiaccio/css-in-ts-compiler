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

/** Which placement runs: `median` is the median sweeps and settles, `brandes-kopf` the balanced four alignments. */
export type PlacementStrategy = "median" | "brandes-kopf";

/** The knobs of {@link place}: the placement strategy, `median` when absent. */
export interface PlacementOptions {
  readonly placement?: PlacementStrategy;
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
 * The drawing's relations, from the slots: nodes that meet across one boundary (what the alignment passes move), the
 * dummies with the two nodes their edge joins (which are placed on the straight line between them, not aligned themselves),
 * and the proper graph of every edge split at each layer it crosses (what Brandes–Köpf aligns).
 *
 * @param {Graph} graph the graph the layout belongs to
 * @param {Layout} layout a layout of that graph
 * @returns {{ before: Map<string, string[]>; after: Map<string, string[]>; chains: Map<string, Chain>;
 *   proper: ReadonlyArray<readonly [string, string]> }} the adjacency, the dummies' chains and the proper graph
 */
const relationsOf = (
  graph: Graph,
  layout: Layout,
): {
  before: Map<string, string[]>;
  after: Map<string, string[]>;
  chains: Map<string, Chain>;
  proper: ReadonlyArray<readonly [string, string]>;
} => {
  const layerOf = new Map<string, number>();
  layout.slots.forEach((ids, layer) => ids.forEach((id) => layerOf.set(id, layer)));
  const before = new Map<string, string[]>();
  const after = new Map<string, string[]>();
  const chains = new Map<string, Chain>();
  const proper: Array<readonly [string, string]> = [];
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
    let previous = from;
    for (let layer = first + 1; layer <= last; layer += 1) {
      const next = layer === last ? to : dummyId({ source: from, target: to }, layer);
      proper.push([previous, next]);
      if (layer < last) chains.set(next, { from, to, layer });
      previous = next;
    }
  }
  return { before, after, chains, proper };
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

const conflictKey = (one: string, two: string): string => `${one}\u0000${two}`;

/**
 * Brandes–Köpf's preprocessing: the non-inner segments that cross an inner segment are marked, so the vertical alignment
 * keeps a long edge's chain straight in preference to a node's.
 *
 * @param {ReadonlyArray<ReadonlyArray<Point>>} points the slots per layer, in drawing order
 * @param {ReadonlyMap<string, string[]>} pred each slot's neighbours in the layer before
 * @param {(id: string) => boolean} dummy whether a slot is a dummy
 * @returns {(one: string, two: string) => boolean} whether the segment `one → two` is marked
 */
const conflictsOf = (
  points: ReadonlyArray<ReadonlyArray<Point>>,
  pred: ReadonlyMap<string, string[]>,
  dummy: (id: string) => boolean,
): ((one: string, two: string) => boolean) => {
  const marked = new Set<string>();
  for (let layer = 1; layer < points.length; layer += 1) {
    const previous = points[layer - 1] ?? [];
    const current = points[layer] ?? [];
    const at = new Map(previous.map((point, index) => [point.id, index]));
    let k0 = 0;
    let scan = 0;
    for (const [index, point] of current.entries()) {
      const inner = dummy(point.id)
        ? (pred.get(point.id) ?? []).find((id) => dummy(id))
        : undefined;
      if (inner === undefined && index !== current.length - 1) continue;
      const k1 = inner === undefined ? previous.length : (at.get(inner) ?? previous.length);
      for (let cursor = scan; cursor <= index; cursor += 1) {
        const node = current[cursor];
        if (node === undefined) continue;
        for (const id of pred.get(node.id) ?? []) {
          const position = at.get(id);
          if (position === undefined) continue;
          if ((position < k0 || position > k1) && !(dummy(id) && dummy(node.id))) {
            marked.add(conflictKey(id, node.id));
          }
        }
      }
      scan = index + 1;
      k0 = k1;
    }
  }
  return (one, two) => marked.has(conflictKey(one, two)) || marked.has(conflictKey(two, one));
};

const traversal = (count: number, lower: boolean): number[] =>
  Array.from({ length: Math.max(0, count - 1) }, (_, index) =>
    lower ? count - 2 - index : index + 1,
  );

interface Assignment {
  readonly right: boolean;
  readonly centres: Map<string, number>;
}

/**
 * The slots of one block: the root each vertex is aligned to, from the paper's median-neighbour alignment with its type-0
 * conflicts resolved in the traversal's direction.
 *
 * @param {ReadonlyArray<ReadonlyArray<string>>} lists the slots per layer in the traversal's order
 * @param {ReadonlyArray<number>} layers the layers the alignment visits, in order
 * @param {(id: string) => ReadonlyArray<string>} neighbour a vertex's neighbours in the layer before
 * @param {(one: string, two: string) => boolean} conflicted whether a segment is marked
 * @returns {ReadonlyMap<string, string>} each slot's block root
 */
const rootsOf = (
  lists: ReadonlyArray<ReadonlyArray<string>>,
  layers: ReadonlyArray<number>,
  neighbour: (id: string) => ReadonlyArray<string>,
  conflicted: (one: string, two: string) => boolean,
): ReadonlyMap<string, string> => {
  const root = new Map<string, string>();
  const align = new Map<string, string>();
  const pos = new Map<string, number>();
  for (const ids of lists) {
    ids.forEach((id, at) => {
      root.set(id, id);
      align.set(id, id);
      pos.set(id, at);
    });
  }
  for (const layer of layers) {
    let last = -1;
    for (const id of lists[layer] ?? []) {
      const candidates = [...neighbour(id)].sort(
        (one, two) => (pos.get(one) ?? 0) - (pos.get(two) ?? 0),
      );
      if (candidates.length === 0) continue;
      const count = candidates.length;
      const high = Math.ceil((count + 1) / 2) - 1;
      const low = Math.floor((count + 1) / 2) - 1;
      for (const at of high === low ? [high] : [high, low]) {
        if (align.get(id) !== id) break;
        const upper = candidates[at];
        if (upper === undefined || conflicted(upper, id)) continue;
        const position = pos.get(upper) ?? -1;
        if (position <= last) continue;
        align.set(upper, id);
        root.set(id, root.get(upper) ?? upper);
        align.set(id, root.get(id) ?? id);
        last = position;
      }
    }
  }
  return root;
};

/**
 * Horizontal compaction: the smallest coordinates of the blocks that respect the slot order and the separation, as the
 * longest path over the block graph the ordering induces.
 *
 * @param {ReadonlyArray<ReadonlyArray<string>>} lists the slots per layer in the compaction's order
 * @param {ReadonlyMap<string, string>} root each slot's block root
 * @param {(id: string) => number} height each slot's box height
 * @param {number} gap the space between two boxes of a layer
 * @returns {ReadonlyMap<string, number>} each block root's coordinate
 */
const compactionOf = (
  lists: ReadonlyArray<ReadonlyArray<string>>,
  root: ReadonlyMap<string, string>,
  height: (id: string) => number,
  gap: number,
): ReadonlyMap<string, number> => {
  const outgoing = new Map<string, Map<string, number>>();
  const incoming = new Map<string, number>();
  const blocks = new Set<string>();
  const add = (from: string, to: string, weight: number): void => {
    const mine = outgoing.get(from) ?? new Map<string, number>();
    outgoing.set(from, mine);
    if (!mine.has(to)) incoming.set(to, (incoming.get(to) ?? 0) + 1);
    mine.set(to, Math.max(mine.get(to) ?? 0, weight));
  };
  for (const ids of lists) {
    for (const id of ids) blocks.add(root.get(id) ?? id);
    for (let at = 1; at < ids.length; at += 1) {
      const above = ids[at - 1];
      const below = ids[at];
      if (above === undefined || below === undefined) continue;
      const from = root.get(above) ?? above;
      const to = root.get(below) ?? below;
      if (from === to) continue;
      add(from, to, (height(above) + height(below)) / 2 + gap);
    }
  }
  const coords = new Map<string, number>();
  const queue = [...blocks].filter((id) => (incoming.get(id) ?? 0) === 0);
  for (const id of queue) coords.set(id, 0);
  for (let at = 0; at < queue.length; at += 1) {
    const from = queue[at];
    if (from === undefined) continue;
    const next = coords.get(from) ?? 0;
    for (const [to, weight] of outgoing.get(from) ?? []) {
      coords.set(to, Math.max(coords.get(to) ?? 0, next + weight));
      const left = (incoming.get(to) ?? 0) - 1;
      incoming.set(to, left);
      if (left === 0) queue.push(to);
    }
  }
  return coords;
};

/**
 * The four alignments of Brandes–Köpf, balanced into one placement: the layers traversed down and up, each with the
 * leftmost and the rightmost resolution of type-0 conflicts, the smallest of the four as the anchor, and each slot's
 * coordinate the average of the middle two of the four. All four respect the slot order and the separation, so their
 * balanced coordinate does too.
 *
 * @param {Graph} graph the graph the placement belongs to
 * @param {ReadonlyArray<ReadonlyArray<Point>>} points the slots per layer, mutated
 * @param {ReadonlyArray<readonly [string, string]>} proper every edge split at each layer it crosses
 * @param {number} gap the space between two boxes of a layer
 */
const brandesKopf = (
  graph: Graph,
  points: ReadonlyArray<ReadonlyArray<Point>>,
  proper: ReadonlyArray<readonly [string, string]>,
  gap: number,
): void => {
  const nodes = new Set(graph.nodes);
  const dummy = (id: string): boolean => !nodes.has(id);
  const byId = new Map<string, Point>();
  for (const ids of points) for (const point of ids) byId.set(point.id, point);
  const pred = new Map<string, string[]>();
  const succ = new Map<string, string[]>();
  for (const [from, to] of proper) {
    push(pred, to, from);
    push(succ, from, to);
  }
  const conflicted = conflictsOf(points, pred, dummy);
  const lists = points.map((ids) => ids.map((point) => point.id));
  const height = (id: string): number => byId.get(id)?.height ?? 0;
  const assignments: Assignment[] = [];
  for (const lower of [false, true]) {
    for (const right of [false, true]) {
      const ordered = right ? lists.map((ids) => [...ids].reverse()) : lists;
      const root = rootsOf(
        ordered,
        traversal(lists.length, lower),
        lower ? (id) => succ.get(id) ?? [] : (id) => pred.get(id) ?? [],
        conflicted,
      );
      const coords = compactionOf(ordered, root, height, gap);
      const sign = right ? -1 : 1;
      assignments.push({
        right,
        centres: new Map(
          lists.flat().map((id) => [id, sign * (coords.get(root.get(id) ?? id) ?? 0)]),
        ),
      });
    }
  }
  const extent = (assignment: Assignment): { low: number; high: number } => {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const [id, centre] of assignment.centres) {
      low = Math.min(low, centre - height(id) / 2);
      high = Math.max(high, centre + height(id) / 2);
    }
    return { low, high };
  };
  let anchor = assignments[0];
  let width = Number.POSITIVE_INFINITY;
  for (const assignment of assignments) {
    const box = extent(assignment);
    if (box.high - box.low < width) {
      width = box.high - box.low;
      anchor = assignment;
    }
  }
  const target = anchor === undefined ? { low: 0, high: 0 } : extent(anchor);
  for (const assignment of assignments) {
    const box = extent(assignment);
    const shift = assignment.right ? target.high - box.high : target.low - box.low;
    for (const [id, centre] of assignment.centres) assignment.centres.set(id, centre + shift);
  }
  const sorted = assignments.map((assignment) => assignment.centres);
  for (const point of points.flat()) {
    const values = sorted
      .map((centres) => centres.get(point.id) ?? 0)
      .sort((one, two) => one - two);
    const below = values[1] ?? 0;
    const above = values[2] ?? below;
    point.y = (below + above) / 2 - point.height / 2;
  }
};

/**
 * Boxes for a layout: each layer a column at its own x, each slot a box below the one before, then the boxes moved to the
 * strategy's y — the median sweeps (a pass forward, a pass backward, twice, each layer settled as one piece onto its
 * neighbours) or Brandes–Köpf's balanced four alignments — and every dummy put on the straight line between the two nodes
 * its edge joins. The slot order and the gaps are never broken, so the result is a placement the invariants hold for.
 *
 * Sizes come from `graph.sizes`; a node without one is placed as a point, and so is every dummy.
 *
 * @param {Graph} graph the graph the layout belongs to
 * @param {Layout} layout a layout of that graph
 * @param {Spacing} spacing the gaps between boxes and between layers
 * @param {PlacementOptions} options the placement strategy, `median` when absent
 * @returns {ReadonlyArray<Placement>} the slots' boxes, dummies included
 */
export const place = (
  graph: Graph,
  layout: Layout,
  spacing: Spacing = {},
  options: PlacementOptions = {},
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
  const { before, after, chains, proper } = relationsOf(graph, layout);

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
  if ((options.placement ?? "median") === "brandes-kopf") {
    brandesKopf(graph, points, proper, nodeGap);
  } else {
    for (let round = 0; round < 2; round += 1) {
      align(before, spine);
      compact();
      align(after, [...spine].reverse());
      compact();
      settle(before, spine);
      settle(after, [...spine].reverse());
    }
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
