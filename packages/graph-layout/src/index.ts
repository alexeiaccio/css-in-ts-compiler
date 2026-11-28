/**
 * Layered (Sugiyama) graph layout: the discrete half of the pipeline Eclipse Layout Kernel runs — cycle breaking, layer
 * assignment, ordering, and crossing minimization over the result — as pure functions. Coordinates, spacing and edge routing
 * are not here; the dummy nodes a long edge becomes are, because ordering and crossings are about slots, not nodes.
 *
 * The node order of the input is the model order: an edge whose target precedes its source is backwards, and reversing it is
 * what makes the graph acyclic (every effective edge runs from a lower index to a higher one).
 *
 * A slot is a position in a layer: a node id, or `a>d@1` — the dummy of the edge `a>d` passing through layer 1. Parallel
 * edges are one line, because two lines between the same two nodes would be drawn as one (bundling is the point, not a
 * special case).
 */

/** One edge of the input graph, directed from `source` to `target`. */
export interface Edge {
  readonly source: string;
  readonly target: string;
}

/** A graph in model order: the array order of `nodes` is the order every phase reads. */
export interface Graph {
  readonly nodes: ReadonlyArray<string>;
  readonly edges: ReadonlyArray<Edge>;
  /** What a node's box reserves; a node without an entry is a point (see {@link place}). */
  readonly sizes?: Readonly<Record<string, Size>>;
}

/**
 * The layout: `slots` is the drawing order per layer — node ids and dummies together — and `layers` and `ranks` are the
 * nodes alone, in the order they occupy among those slots.
 */
export interface Layout {
  readonly layers: ReadonlyArray<ReadonlyArray<string>>;
  readonly ranks: Readonly<Record<string, number>>;
  readonly slots: ReadonlyArray<ReadonlyArray<string>>;
}

import { dummyId } from "./dummy.ts";
import type { Size } from "./place.ts";

const positionOf = (nodes: ReadonlyArray<string>): ReadonlyMap<string, number> =>
  new Map(nodes.map((id, position) => [id, position]));

const unique = (edges: ReadonlyArray<Edge>): ReadonlyArray<Edge> => {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.source}>${edge.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const slotsOf = (graph: Graph, layerOf: ReadonlyMap<string, number>): ReadonlyArray<string[]> => {
  const count = Math.max(0, ...graph.nodes.map((id) => (layerOf.get(id) ?? 0) + 1));
  const slots: string[][] = Array.from({ length: count }, () => []);
  for (const id of graph.nodes) {
    slots[layerOf.get(id) ?? 0]?.push(id);
  }
  for (const edge of unique(graph.edges)) {
    const from = layerOf.get(edge.source) ?? 0;
    const to = layerOf.get(edge.target) ?? 0;
    for (let layer = from + 1; layer < to; layer += 1) {
      slots[layer]?.push(dummyId(edge, layer));
    }
  }
  return slots;
};

const build = (graph: Graph, slots: ReadonlyArray<ReadonlyArray<string>>): Layout => {
  const nodes = new Set(graph.nodes);
  const layers = slots.map((ids) => ids.filter((id) => nodes.has(id)));
  const ranks: Record<string, number> = {};
  for (const ids of layers) {
    ids.forEach((id, rank) => {
      ranks[id] = rank;
    });
  }
  return { layers, ranks, slots };
};

/**
 * Phase 1: reverse every edge that points backwards in model order.
 *
 * @param {Graph} graph the graph in model order
 * @returns {Graph} the same nodes, every edge pointing forward in model order
 */
export const breakCycles = (graph: Graph): Graph => {
  const position = positionOf(graph.nodes);
  const edges = graph.edges.map((edge) => {
    const source = position.get(edge.source);
    const target = position.get(edge.target);
    if (source === undefined || target === undefined) {
      throw new RangeError(`edge ${edge.source} -> ${edge.target} is not in the graph's nodes`);
    }
    return target < source ? { source: edge.target, target: edge.source } : edge;
  });
  return { nodes: graph.nodes, edges };
};

/**
 * Phase 2: the longest path from a source over a graph whose edges point forward in model order.
 *
 * @param {Graph} graph a graph as {@link breakCycles} returns it
 * @returns {ReadonlyMap<string, number>} each node's layer, a source at 0
 */
export const assignLayers = (graph: Graph): ReadonlyMap<string, number> => {
  const outgoing = new Map<string, string[]>();
  for (const edge of graph.edges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }
  const layer = new Map(graph.nodes.map((id) => [id, 0]));
  for (const id of graph.nodes) {
    const below = (layer.get(id) ?? 0) + 1;
    for (const target of outgoing.get(id) ?? []) {
      if (below > (layer.get(target) ?? 0)) {
        layer.set(target, below);
      }
    }
  }
  return layer;
};

/**
 * Phase 3: the slots of every layer — its nodes in model order, then the dummies of the edges that pass through it.
 *
 * @param {Graph} graph a graph as {@link breakCycles} returns it
 * @param {ReadonlyMap<string, number>} layerOf each node's layer
 * @returns {Layout} the baseline order, before any crossing minimization
 */
export const orderSlots = (graph: Graph, layerOf: ReadonlyMap<string, number>): Layout =>
  build(graph, slotsOf(graph, layerOf));

/**
 * All three phases, in the order the spec runs them.
 *
 * @param {Graph} graph the graph in model order
 * @returns {Layout} the layers, the ranks and the slots
 */
export const layout = (graph: Graph): Layout => {
  const oriented = breakCycles(graph);
  return orderSlots(oriented, assignLayers(oriented));
};

const boundaryPairs = (
  graph: Graph,
  slots: ReadonlyArray<ReadonlyArray<string>>,
): ReadonlyArray<string[][]> => {
  const layerOf = new Map<string, number>();
  slots.forEach((ids, layer) => ids.forEach((id) => layerOf.set(id, layer)));
  const pairs: string[][][] = Array.from({ length: Math.max(0, slots.length - 1) }, () => []);
  for (const edge of unique(graph.edges)) {
    const from = layerOf.get(edge.source);
    const to = layerOf.get(edge.target);
    if (from === undefined || to === undefined) continue;
    let left = edge.source;
    for (let layer = from; layer < to; layer += 1) {
      const right = layer + 1 === to ? edge.target : dummyId(edge, layer + 1);
      pairs[layer]?.push([left, right]);
      left = right;
    }
  }
  return pairs;
};

/**
 * Barycentre passes and a greedy switch: forward and backward sweeps over the layers, each ordering a layer by the average
 * position of its neighbours in the adjacent one, ties kept where they were, then adjacent swaps that lower the crossings at
 * a layer's two boundaries. A pass can make a graph worse; the layout it returns only if it is better, so the composition
 * never costs a crossing.
 *
 * @param {Graph} graph the graph in model order
 * @param {Layout} layout a layout of that graph, typically {@link layout}'s
 * @returns {Layout} the same slots, reordered
 */
export const minimizeCrossings = (graph: Graph, layout: Layout): Layout => {
  const oriented = breakCycles(graph);
  const slots = layout.slots.map((ids) => [...ids]);
  const pairs = boundaryPairs(oriented, slots);

  for (let round = 0; round < 4; round += 1) {
    for (let layer = 1; layer < slots.length; layer += 1) {
      reorder(slots, layer, pairs[layer - 1] ?? [], "previous");
    }
    for (let layer = slots.length - 2; layer >= 0; layer -= 1) {
      reorder(slots, layer, pairs[layer] ?? [], "next");
    }
  }
  greedySwitch(slots, pairs);
  const swept = build(oriented, slots);
  return crossings(graph, swept) < crossings(graph, layout) ? swept : layout;
};

const reorder = (
  slots: string[][],
  layer: number,
  boundary: ReadonlyArray<ReadonlyArray<string>>,
  side: "previous" | "next",
): void => {
  const other = slots[side === "previous" ? layer - 1 : layer + 1];
  const ids = slots[layer];
  if (other === undefined || ids === undefined) return;
  const otherIndex = new Map(other.map((id, index) => [id, index]));
  const mineIndex = new Map(ids.map((id, index) => [id, index]));
  const neighbours = new Map<string, number[]>();
  for (const pair of boundary) {
    const [left, right] = pair;
    if (left === undefined || right === undefined) continue;
    const mine = side === "previous" ? right : left;
    const theirs = side === "previous" ? left : right;
    const at = otherIndex.get(theirs);
    if (at === undefined) continue;
    neighbours.set(mine, [...(neighbours.get(mine) ?? []), at]);
  }
  const barycentre = (id: string): number => {
    const at = neighbours.get(id);
    if (at === undefined || at.length === 0) return mineIndex.get(id) ?? 0;
    return at.reduce((sum, position) => sum + position, 0) / at.length;
  };
  slots[layer] = [...ids].sort(
    (one, two) =>
      barycentre(one) - barycentre(two) || (mineIndex.get(one) ?? 0) - (mineIndex.get(two) ?? 0),
  );
};

const swap = (ids: string[], index: number): boolean => {
  const first = ids[index];
  const second = ids[index + 1];
  if (first === undefined || second === undefined) return false;
  ids[index] = second;
  ids[index + 1] = first;
  return true;
};

const inversions = (
  slots: ReadonlyArray<ReadonlyArray<string>>,
  boundary: ReadonlyArray<ReadonlyArray<string>>,
  layer: number,
): number => {
  const left = slots[layer];
  const right = slots[layer + 1];
  if (left === undefined || right === undefined) return 0;
  const leftIndex = new Map(left.map((id, index) => [id, index]));
  const rightIndex = new Map(right.map((id, index) => [id, index]));
  const points = boundary.map((pair) => [
    leftIndex.get(pair[0] ?? ""),
    rightIndex.get(pair[1] ?? ""),
  ]);
  let count = 0;
  for (let one = 0; one < points.length; one += 1) {
    for (let two = one + 1; two < points.length; two += 1) {
      const a = points[one];
      const b = points[two];
      if (a === undefined || b === undefined) continue;
      if (a[0] === undefined || a[1] === undefined) continue;
      if (b[0] === undefined || b[1] === undefined) continue;
      if ((a[0] - b[0]) * (a[1] - b[1]) < 0) count += 1;
    }
  }
  return count;
};

/**
 * The crossings of the pairs that touch one of `targets`, counted once each: the outer loop is the target pairs, the inner
 * one is everything, and two target pairs are counted by their smaller index only — which is what makes a swap cost
 * `targets × pairs` instead of `pairs²`.
 *
 * @param {ReadonlyArray<ReadonlyArray<string>>} boundary the pairs crossing one layer boundary
 * @param {ReadonlyArray<ReadonlyMap<string, number>>} positions each layer's slot index per id
 * @param {number} layer the boundary's left layer
 * @param {ReadonlySet<string>} targets the slots that moved
 * @returns {number} the crossings among the pairs that touch a target
 */
const touching = (
  boundary: ReadonlyArray<ReadonlyArray<string>>,
  positions: ReadonlyArray<ReadonlyMap<string, number>>,
  layer: number,
  targets: ReadonlySet<string>,
): number => {
  const left = positions[layer];
  const right = positions[layer + 1];
  if (left === undefined || right === undefined) return 0;
  const points = boundary.map((pair) => ({
    one: pair[0] ?? "",
    two: pair[1] ?? "",
    left: left.get(pair[0] ?? ""),
    right: right.get(pair[1] ?? ""),
  }));
  const affected = points.map((point) => targets.has(point.one) || targets.has(point.two));
  let count = 0;
  for (let outer = 0; outer < points.length; outer += 1) {
    if (affected[outer] !== true) continue;
    const a = points[outer];
    if (a === undefined || a.left === undefined || a.right === undefined) continue;
    for (let inner = 0; inner < points.length; inner += 1) {
      if (inner === outer) continue;
      if (affected[inner] === true && inner < outer) continue;
      const b = points[inner];
      if (b === undefined || b.left === undefined || b.right === undefined) continue;
      if ((a.left - b.left) * (a.right - b.right) < 0) count += 1;
    }
  }
  return count;
};

const greedySwitch = (slots: string[][], pairs: ReadonlyArray<string[][]>): void => {
  const positions = slots.map((ids) => new Map(ids.map((id, index) => [id, index])));
  const local = (layer: number, targets: ReadonlySet<string>): number =>
    touching(pairs[layer - 1] ?? [], positions, layer - 1, targets) +
    touching(pairs[layer] ?? [], positions, layer, targets);

  for (let pass = 0; pass < 4; pass += 1) {
    let improved = false;
    for (const [layer, ids] of slots.entries()) {
      const slotsAt = positions[layer];
      if (slotsAt === undefined) continue;
      for (let index = 0; index + 1 < ids.length; index += 1) {
        const first = ids[index];
        const second = ids[index + 1];
        if (first === undefined || second === undefined) continue;
        const targets = new Set([first, second]);
        const before = local(layer, targets);
        if (!swap(ids, index)) continue;
        slotsAt.set(first, index + 1);
        slotsAt.set(second, index);
        if (local(layer, targets) < before) {
          improved = true;
        } else {
          swap(ids, index);
          slotsAt.set(first, index);
          slotsAt.set(second, index + 1);
        }
      }
    }
    if (!improved) break;
  }
};

/**
 * The crossings of a layout, counted per layer boundary: two edges cross when their slots at the boundary are in the opposite
 * order on its two sides. Dummies make a long edge a chain of one-boundary segments, so no boundary is counted twice.
 *
 * @param {Graph} graph the graph the layout belongs to
 * @param {Layout} layout the layout
 * @returns {number} the number of crossing pairs
 */
export const crossings = (graph: Graph, layout: Layout): number => {
  const pairs = boundaryPairs(breakCycles(graph), layout.slots);
  return pairs.reduce((sum, boundary, layer) => sum + inversions(layout.slots, boundary, layer), 0);
};

export { dummyId } from "./dummy.ts";
export * from "./place.ts";
