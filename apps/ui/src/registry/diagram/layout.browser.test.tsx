import { describe, expect, it } from "vite-plus/test";

import { layOut } from "./layout.ts";
import type { DiagramEdgeInput, DiagramNodeInput } from "./diagram.tsx";

const graphOf = (count: number): { nodes: DiagramNodeInput[]; edges: DiagramEdgeInput[] } => ({
  nodes: Array.from({ length: count }, (_, index) => ({
    id: `n${index}`,
    label: `N${index}`,
    x: 0,
    y: 0,
    width: 120,
    height: 44,
  })),
  edges: Array.from({ length: count }, (_, index) => index)
    .flatMap((index) => [
      { id: `e${index}`, from: `n${index}`, to: `n${index + 1}` },
      { id: `f${index}`, from: `n${index}`, to: `n${index + 3}` },
    ])
    .filter((edge) => Number.parseInt(edge.to.slice(1), 10) < count),
});

const median = (run: () => void, rounds = 20): number => {
  run();
  const samples: number[] = [];
  for (let round = 0; round < rounds; round += 1) {
    const start = performance.now();
    run();
    samples.push(performance.now() - start);
  }
  samples.sort((one, two) => one - two);
  return samples[Math.floor(samples.length / 2)] ?? 0;
};

describe("laying a graph out in the handler", () => {
  for (const count of [4, 20, 60]) {
    it(`lays out ${count} nodes inside a frame`, () => {
      const { nodes, edges } = graphOf(count);
      const first = layOut(nodes, edges);
      const time = median(() => {
        layOut(nodes, edges);
      });
      // eslint-disable-next-line no-console
      console.log(`${count} nodes: ${time.toFixed(2)} ms`);
      expect(first).toHaveLength(count);
      if (count <= 20) expect(time).toBeLessThan(16);
    });
  }

  it("gives the same drawing the second time", () => {
    const { nodes, edges } = graphOf(20);
    expect(layOut(layOut(nodes, edges), edges)).toEqual(layOut(nodes, edges));
  });
});
