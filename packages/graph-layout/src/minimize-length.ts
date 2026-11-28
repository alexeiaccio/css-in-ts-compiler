import type { Edge, Graph } from "./index.ts";

const effective = (graph: Graph): ReadonlyArray<Edge> => {
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const edge of graph.edges) {
    if (edge.source === edge.target) continue;
    const key = `${edge.source}>${edge.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push(edge);
  }
  return edges;
};

const indexOf = (
  edges: ReadonlyArray<Edge>,
  end: "source" | "target",
): ReadonlyMap<string, string[]> => {
  const map = new Map<string, string[]>();
  const other = end === "source" ? "target" : "source";
  for (const edge of edges) {
    map.set(edge[end], [...(map.get(edge[end]) ?? []), edge[other]]);
  }
  return map;
};

const componentsOf = (
  graph: Graph,
  edges: ReadonlyArray<Edge>,
): ReadonlyArray<ReadonlyArray<string>> => {
  const adjacent = new Map<string, string[]>();
  for (const edge of edges) {
    adjacent.set(edge.source, [...(adjacent.get(edge.source) ?? []), edge.target]);
    adjacent.set(edge.target, [...(adjacent.get(edge.target) ?? []), edge.source]);
  }
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const id of graph.nodes) {
    if (seen.has(id)) continue;
    const queue = [id];
    const component: string[] = [];
    for (let at = 0; at < queue.length; at += 1) {
      const node = queue[at] ?? "";
      component.push(node);
      for (const neighbour of adjacent.get(node) ?? []) {
        if (seen.has(neighbour)) continue;
        seen.add(neighbour);
        queue.push(neighbour);
      }
    }
    components.push(component);
  }
  return components;
};

/**
 * Phase 2's `minimize-length` strategy, over a graph whose edges point forward in model order: the longest path, then every
 * node with more out-edges than in-edges raised into the highest layer its successors leave free, in reverse model order,
 * until no node can move. A move lowers `Σ (layer(target) − layer(source))` over the dummy-expanded graph by at least one
 * and never breaks an edge, so the sweep terminates at a layering no single node can improve. Each weakly connected
 * component then starts at layer 0, which the length of its edges does not notice.
 *
 * @param {Graph} graph a graph as {@link breakCycles} returns it
 * @param {ReadonlyMap<string, number>} start a feasible layering to improve, the longest path
 * @returns {ReadonlyMap<string, number>} the layering
 */
export const relaxLayers = (
  graph: Graph,
  start: ReadonlyMap<string, number>,
): ReadonlyMap<string, number> => {
  const edges = effective(graph);
  const outgoing = indexOf(edges, "source");
  const incoming = indexOf(edges, "target");
  const layer = new Map(start);
  const balance = new Map(
    graph.nodes.map((id) => [
      id,
      (incoming.get(id)?.length ?? 0) - (outgoing.get(id)?.length ?? 0),
    ]),
  );

  let moved = true;
  while (moved) {
    moved = false;
    for (let at = graph.nodes.length - 1; at >= 0; at -= 1) {
      const id = graph.nodes[at];
      if (id === undefined) continue;
      if ((balance.get(id) ?? 0) >= 0) continue;
      const successors = outgoing.get(id) ?? [];
      let highest = Number.POSITIVE_INFINITY;
      for (const successor of successors) {
        highest = Math.min(highest, (layer.get(successor) ?? 0) - 1);
      }
      if (highest > (layer.get(id) ?? 0)) {
        layer.set(id, highest);
        moved = true;
      }
    }
  }

  for (const component of componentsOf(graph, edges)) {
    let lowest = Number.POSITIVE_INFINITY;
    for (const id of component) lowest = Math.min(lowest, layer.get(id) ?? 0);
    if (lowest === 0) continue;
    for (const id of component) layer.set(id, (layer.get(id) ?? 0) - lowest);
  }
  return layer;
};
