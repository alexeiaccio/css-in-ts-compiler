// What the engine costs: the three phases separately and composed, over a corpus of random graphs, plus the shape a diagram
// is most likely to hurt — a 200-node chain, the longest layering possible for the node limit.
import { performance } from "node:perf_hooks";

import { assignLayers, breakCycles, layout, orderNodes } from "../src/index.ts";
import { chain, corpus, cycle } from "./graphs.mjs";

const graphs = corpus(1000);
const oriented = graphs.map(breakCycles);
const layered = oriented.map(assignLayers);

// `perRun` returns a number, summed into a checksum nobody prints: without a consumer the JIT may delete the whole loop.
const micros = (perRun, count) => {
  const run = () => {
    let checksum = 0;
    for (let index = 0; index < count; index += 1) checksum += perRun(index);
    return checksum;
  };
  run();
  let best = Infinity;
  for (let round = 0; round < 5; round += 1) {
    const start = performance.now();
    const checksum = run();
    best = Math.min(best, performance.now() - start);
    if (!Number.isFinite(checksum)) console.log(`checksum ${checksum}`);
  }
  return (best * 1000) / count;
};

const nodes = graphs.reduce((sum, graph) => sum + graph.nodes.length, 0);
const edges = graphs.reduce((sum, graph) => sum + graph.edges.length, 0);
const longest = chain(200);
const around = cycle(200);

const phases = [
  ["breakCycles", (index) => breakCycles(graphs[index]).edges.length],
  ["assignLayers", (index) => assignLayers(oriented[index]).size],
  ["orderNodes", (index) => orderNodes(graphs[index].nodes, layered[index]).layers.length],
  ["layout", (index) => layout(graphs[index]).layers.length],
];

console.log(
  `layered layout over ${graphs.length} random graphs: ${nodes} nodes, ${edges} edges, at most 80 nodes a graph`,
);
for (const [name, perRun] of phases) {
  console.log(`  ${name.padEnd(13)} ${micros(perRun, graphs.length).toFixed(2)} µs/graph`);
}
for (const [name, graph] of [
  ["chain of 200", longest],
  ["cycle of 200", around],
]) {
  console.log(
    `  ${name.padEnd(13)} ${micros(() => layout(graph).layers.length, 1000).toFixed(2)} µs/layout`,
  );
}
