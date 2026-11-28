// Two-level graphs for the cluster suites: every cluster owns a contiguous band of layers, every node at layer k has an edge
// from k - 1 — which is what makes the longest-path layering give the layer the generator intended — and the unclustered nodes
// and the cross-hierarchy edges are spread over the same bands. A seed reproduces a failure.
const LCG_MULTIPLIER = 1_664_525;
const LCG_INCREMENT = 1_013_904_223;
const UINT32 = 0x1_0000_0000;

const lcg = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, LCG_MULTIPLIER) + LCG_INCREMENT) >>> 0;
    return state / UINT32;
  };
};

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/**
 * One two-level graph from a seed: clusters with a contiguous band of layers each, an edge into every node from the layer before,
 * and extra cross-hierarchy edges.
 *
 * @param {number} seed the generator's seed
 * @param {{ layers?: number; extra?: number }} options how many layers to draw and how dense the extra edges are
 * @returns {{ nodes: string[]; edges: { source: string; target: string }[]; clusters: { id: string; members: string[] }[] }} the graph
 */
export const clusterGraph = (seed, { layers = 3, extra = 0.25 } = {}) => {
  const rand = lcg(seed);
  const depth = 2 + Math.floor(rand() * layers);
  const count = 1 + Math.floor(rand() * 3);
  const at = Array.from({ length: depth }, () => []);
  const clusters = [];
  let next = 0;
  const name = () => `n${next++}`;

  const room = Math.max(1, Math.floor(depth / count));
  for (let index = 0; index < count; index += 1) {
    const low = Math.min(depth - 1, index * room);
    const high = Math.min(depth - 1, low + Math.max(0, room - 1));
    const members = [];
    const size = 2 + Math.floor(rand() * 3);
    for (let member = 0; member < size; member += 1) {
      const layer = low + Math.floor(rand() * (high - low + 1));
      const id = name();
      at[layer].push(id);
      members.push(id);
    }
    clusters.push({ id: `c${index + 1}`, members });
  }

  for (let layer = 0; layer < depth; layer += 1) {
    if (at[layer].length === 0) at[layer].push(name());
    if (rand() < 0.5) at[layer].push(name());
  }

  const nodes = at.flat();
  const edges = [];
  const link = (source, target) => {
    if (source === undefined || target === undefined || source === target) return;
    edges.push({ source, target });
  };
  for (let layer = 1; layer < depth; layer += 1) {
    for (const target of at[layer]) {
      link(pick(rand, at[layer - 1]), target);
    }
  }
  for (let layer = 0; layer < depth; layer += 1) {
    for (let other = layer + 1; other < depth; other += 1) {
      for (const source of at[layer]) {
        for (const target of at[other]) {
          if (rand() < extra / (other - layer)) link(source, target);
        }
      }
    }
  }
  return { nodes, edges, clusters };
};

/**
 * A corpus of two-level graphs, one per seed.
 *
 * @param {number} size how many graphs
 * @param {{ layers?: number; extra?: number }} options the generator's options
 * @returns {Array<{ nodes: string[]; edges: { source: string; target: string }[]; clusters: { id: string; members: string[] }[] }>} the graphs
 */
export const clusterCorpus = (size, options) =>
  Array.from({ length: size }, (_, seed) => clusterGraph(seed, options));

/**
 * The fixture of the oracle: three clusters, a long edge across two of them, and two unclustered nodes in the first column.
 *
 * @returns {{ nodes: string[]; edges: { source: string; target: string }[]; clusters: { id: string; members: string[] }[] }} the graph
 */
export const threeClusters = () => ({
  nodes: ["x", "y", "a", "b", "c", "d", "e", "f"],
  edges: [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
    { source: "c", target: "d" },
    { source: "x", target: "c" },
    { source: "d", target: "e" },
    { source: "e", target: "f" },
    { source: "a", target: "d" },
    { source: "y", target: "e" },
  ],
  clusters: [
    { id: "c1", members: ["a", "b"] },
    { id: "c2", members: ["c", "d"] },
    { id: "c3", members: ["e", "f"] },
  ],
});

/**
 * The two clusters of the oracle's smallest graph, with the unclustered node that points into one of them.
 *
 * @returns {{ nodes: string[]; edges: { source: string; target: string }[]; clusters: { id: string; members: string[] }[] }} the graph
 */
export const twoClusters = () => ({
  nodes: ["x", "a", "b", "c", "d"],
  edges: [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
    { source: "c", target: "d" },
    { source: "x", target: "c" },
  ],
  clusters: [
    { id: "c1", members: ["a", "b"] },
    { id: "c2", members: ["c", "d"] },
  ],
});
