// What the engine costs and what the crossing minimization buys: the phases over a corpus of random graphs, the crossings
// before and after the sweep, and the shape a diagram is most likely to hurt — a 200-node chain.
import { performance } from "node:perf_hooks";

import {
  assignLayers,
  breakCycles,
  crossings,
  layout,
  minimizeCrossings,
  orderSlots,
  place,
  route,
} from "../src/index.ts";
import { chain, corpus, cycle } from "./graphs.mjs";

const graphs = corpus(1000);
const oriented = graphs.map(breakCycles);
const layered = oriented.map(assignLayers);
const sized = graphs.map((graph) => ({
  ...graph,
  sizes: Object.fromEntries(graph.nodes.map((id) => [id, { width: 40, height: 20 }])),
}));
const ordered = graphs.map((graph, index) => orderSlots(oriented[index], layered[index]));
const swept = graphs.map((graph, index) => minimizeCrossings(graph, ordered[index]));
const placed = sized.map((graph, index) => place(graph, swept[index]));

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
  ["orderSlots", (index) => orderSlots(oriented[index], layered[index]).slots.length],
  ["layout", (index) => layout(graphs[index]).slots.length],
  ["minimizeCrossings", (index) => minimizeCrossings(graphs[index], ordered[index]).slots.length],
  ["place", (index) => place(sized[index], swept[index]).length],
  ["route", (index) => route(sized[index], swept[index], placed[index]).length],
];

console.log(
  `layered layout over ${graphs.length} random graphs: ${nodes} nodes, ${edges} edges, at most 80 nodes a graph`,
);
for (const [name, perRun] of phases) {
  console.log(`  ${name.padEnd(17)} ${micros(perRun, graphs.length).toFixed(2)} µs/graph`);
}
for (const [name, graph] of [
  ["chain of 200", longest],
  ["cycle of 200", around],
]) {
  console.log(
    `  ${name.padEnd(17)} ${micros(() => layout(graph).slots.length, 1000).toFixed(2)} µs/layout`,
  );
}

const before = graphs.reduce((sum, graph, index) => sum + crossings(graph, ordered[index]), 0);
const after = graphs.reduce((sum, graph, index) => sum + crossings(graph, swept[index]), 0);
const improved = graphs.filter(
  (graph, index) => crossings(graph, swept[index]) < crossings(graph, ordered[index]),
).length;
const crossing = graphs.filter((graph, index) => crossings(graph, swept[index]) > 0).length;
console.log(
  `crossings: ${before} at the model order, ${after} after the sweep (${improved} of ${graphs.length} graphs improve, ${crossing} still cross)`,
);
