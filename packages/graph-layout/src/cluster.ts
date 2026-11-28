import type { Cluster, Graph } from "./index.ts";

/** A graph's clusters, validated: each member's cluster is in `owner`, and no node is in two. */
export interface ClusterIndex {
  readonly clusters: ReadonlyArray<Cluster>;
  readonly owner: ReadonlyMap<string, string>;
}

/**
 * Read a graph's clusters and prove they name real nodes: a member that is not a node, a node in two clusters, a cluster id
 * that is also a node id, a cluster declared twice and an empty cluster are all refused with the offending id.
 *
 * A cluster of one member is allowed: it owns a border for the edges that cross it, and there is no inner order to keep.
 * Dummies belong to no cluster, because an edge is not a node.
 *
 * @param {Graph} graph the graph to read
 * @returns {ClusterIndex} the clusters as declared, and the cluster of every member
 */
export const clusterIndexOf = (graph: Graph): ClusterIndex => {
  const clusters = graph.clusters ?? [];
  const nodes = new Set(graph.nodes);
  const owner = new Map<string, string>();
  const ids = new Set<string>();
  for (const cluster of clusters) {
    if (ids.has(cluster.id)) {
      throw new RangeError(`cluster ${cluster.id} is declared twice`);
    }
    if (nodes.has(cluster.id)) {
      throw new RangeError(`cluster ${cluster.id} is also a node id`);
    }
    ids.add(cluster.id);
    if (cluster.members.length === 0) {
      throw new RangeError(`cluster ${cluster.id} has no members`);
    }
    for (const member of cluster.members) {
      if (!nodes.has(member)) {
        throw new RangeError(`cluster ${cluster.id}: ${member} is not a node`);
      }
      const already = owner.get(member);
      if (already !== undefined) {
        throw new RangeError(`${member} is in clusters ${already} and ${cluster.id}`);
      }
      owner.set(member, cluster.id);
    }
  }
  return { clusters, owner };
};

/**
 * The slots of one layer grouped into blocks: a cluster's members keep their order and stay together, and every slot that
 * is in no cluster is a block of its own. With no clusters the answer is one singleton per slot.
 *
 * @param {ReadonlyArray<string>} ids the layer's slots, in their current order
 * @param {ReadonlyMap<string, string>} owner each member's cluster
 * @returns {ReadonlyArray<ReadonlyArray<string>>} the blocks, a cluster's in the order of its first member
 */
export const blocksOf = (
  ids: ReadonlyArray<string>,
  owner: ReadonlyMap<string, string>,
): ReadonlyArray<ReadonlyArray<string>> => {
  const blocks: string[][] = [];
  const at = new Map<string, number>();
  for (const id of ids) {
    const cluster = owner.get(id);
    if (cluster === undefined) {
      blocks.push([id]);
      continue;
    }
    const index = at.get(cluster);
    if (index === undefined) {
      at.set(cluster, blocks.length);
      blocks.push([id]);
      continue;
    }
    blocks[index]?.push(id);
  }
  return blocks;
};

/**
 * A layer's slots with every cluster's members in one contiguous run, ahead of the slots that belong to no cluster: the
 * baseline order the sweep starts from, so contiguity holds before any barycentre pass.
 *
 * @param {ReadonlyArray<string>} ids the layer's slots in model order, dummies last
 * @param {ReadonlyMap<string, string>} owner each member's cluster
 * @returns {ReadonlyArray<string>} the same slots, the clustered ones in blocks
 */
export const contiguous = (
  ids: ReadonlyArray<string>,
  owner: ReadonlyMap<string, string>,
): ReadonlyArray<string> => {
  if (owner.size === 0) return ids;
  const blocks = blocksOf(ids, owner);
  return [
    ...blocks.filter((block) => owner.has(block[0] ?? "")).flat(),
    ...ids.filter((id) => !owner.has(id)),
  ];
};
