// Graphs for the property suite and the bench: a seeded generator, so a failure reproduces from its seed, and the shapes a
// diagram actually holds — isolates, several components, cycles, parallel edges.
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

export const randomGraph = (seed, { maxNodes = 60, density = 0.12, isolates = 0 } = {}) => {
  const rand = lcg(seed);
  const count = 1 + Math.floor(rand() * maxNodes);
  const nodes = Array.from({ length: count }, (_, index) => `n${index}`);
  const linked = Math.max(0, count - isolates);
  const edges = [];
  for (let first = 0; first < linked; first += 1) {
    for (let second = first + 1; second < linked; second += 1) {
      if (rand() >= density) continue;
      const [source, target] =
        rand() < 0.75 ? [nodes[first], nodes[second]] : [nodes[second], nodes[first]];
      edges.push({ source, target });
      if (rand() < 0.05) {
        edges.push({ source: nodes[first], target: nodes[second] });
      }
    }
  }
  return { nodes, edges };
};

export const corpus = (size) =>
  Array.from({ length: size }, (_, seed) =>
    randomGraph(seed, {
      maxNodes: 1 + (seed % 80),
      density: 0.02 + (seed % 7) * 0.02,
      isolates: seed % 5,
    }),
  );

export const chain = (count) => {
  const nodes = Array.from({ length: count }, (_, index) => `n${index}`);
  return {
    nodes,
    edges: nodes.slice(1).map((target, index) => ({ source: nodes[index], target })),
  };
};

export const cycle = (count) => {
  const graph = chain(count);
  return {
    nodes: graph.nodes,
    edges: [...graph.edges, { source: graph.nodes.at(-1), target: graph.nodes[0] }],
  };
};
