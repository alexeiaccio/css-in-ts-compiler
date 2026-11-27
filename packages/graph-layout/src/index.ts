/**
 * Layered (Sugiyama) graph layout: the discrete half of the pipeline Eclipse Layout Kernel runs — cycle breaking, layer
 * assignment and ordering — in the three pure functions the spec `specs/patterns/graph-layout.qnt` states, plus their
 * composition. Coordinates, spacing, dummy nodes and edge routing are not here yet.
 *
 * The node order of the input is the model order: an edge whose target precedes its source is backwards, and reversing it
 * is what makes the graph acyclic (every effective edge runs from a lower index to a higher one).
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
}

/** The layout: one array of node ids per layer (left to right), and each node's rank inside its layer. */
export interface Layout {
  readonly layers: ReadonlyArray<ReadonlyArray<string>>;
  readonly ranks: Readonly<Record<string, number>>;
}

const positionOf = (nodes: ReadonlyArray<string>): ReadonlyMap<string, number> =>
  new Map(nodes.map((id, position) => [id, position]));

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
 * Phase 2: the longest path from a source over a graph whose edges all point forward in model order.
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
 * Phase 3: order each layer by model order, the rank being the position inside its layer.
 *
 * @param {ReadonlyArray<string>} nodes the graph's nodes, in model order
 * @param {ReadonlyMap<string, number>} layerOf each node's layer
 * @returns {Layout} the layers and the ranks
 */
export const orderNodes = (
  nodes: ReadonlyArray<string>,
  layerOf: ReadonlyMap<string, number>,
): Layout => {
  const layers: string[][] = [];
  const ranks: Record<string, number> = {};
  for (const id of nodes) {
    const ids = (layers[layerOf.get(id) ?? 0] ??= []);
    ranks[id] = ids.length;
    ids.push(id);
  }
  return { layers: layers.filter((ids) => ids !== undefined), ranks };
};

/**
 * All three phases, in the order the spec runs them.
 *
 * @param {Graph} graph the graph in model order
 * @returns {Layout} the layers and the ranks
 */
export const layout = (graph: Graph): Layout =>
  orderNodes(graph.nodes, assignLayers(breakCycles(graph)));
