import { describe, expect, it } from "vite-plus/test";
import { ZMIN } from "../src/canvas-math";
import { mountCanvas } from "./canvas.fixture";

// effects-of-atmosphere-72rl, the measurement the `jayj` decision requires before LOD or a
// spatial index exists. It reports, per handler call, the O(n) work the ticket names:
//
//   - a camera commit (`panBy`): `spatialOrder` is built twice (once to detect a reorder, once
//     for the next state) and every node's memo is recomputed, then `snapshotOf` collects the
//     culled list;
//   - a pointer move during a drag: the same shape on the live positions;
//   - `peek`: `snapshotOf` alone, i.e. the culled list;
//   - a pointerdown that misses every node: the linear `hitAt` scan over the whole set.
//
// "Frame time" here is our handler cost, not the compositor's: that is the part LOD or an index
// would change. The numbers are the deliverable; the only assertion is a generous ceiling, so a
// pathological regression fails without flaking when the machine is loaded.

const frames = async (count: number): Promise<void> => {
  for (let frame = 0; frame < count; frame += 1) {
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
};

const COUNT = 2000;
const COLUMNS = 25;
const SAMPLES = 30;

/** A grid of `count` nodes, all on screen once zoomed to `ZMIN` (the worst case: nothing culled). */
const makeNodes = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `n${index}`,
    x: (index % COLUMNS) * 100,
    y: Math.floor(index / COLUMNS) * 100,
    width: 80,
    height: 40,
    label: `Node ${index}`,
  }));

const median = (samples: readonly number[]): number => {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

const timeIt = ({ times, run }: { readonly times: number; readonly run: () => void }): number => {
  const samples: number[] = [];
  for (let index = 0; index < times; index += 1) {
    const start = performance.now();
    run();
    samples.push(performance.now() - start);
  }
  return median(samples);
};

describe("createCanvas scale benchmark (real Chromium)", () => {
  it(`reports the per-handler O(n) cost with ${COUNT} nodes, all visible at ZMIN`, async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: makeNodes(COUNT) });
    try {
      mounted.canvas.zoomTo(ZMIN);
      await frames(3);
      const snapshot = mounted.canvas.peek();
      // the worst case for per-node work: at the minimum zoom every node is still on screen
      expect(snapshot.culled).toHaveLength(0);

      const commitMs = timeIt({
        times: SAMPLES,
        run: () => mounted.canvas.panBy(1, 0),
      });
      // a drag: pointerdown on a node, then the move handler (live positions, same O(n) shape)
      mounted.canvas.pointerDown({ id: 1, x: 2, y: 1 });
      const moveMs = timeIt({
        times: SAMPLES,
        run: () => mounted.canvas.pointerMove({ id: 1, x: 12, y: 10 }),
      });
      mounted.canvas.pointerUp(1);
      const snapshotMs = timeIt({
        times: SAMPLES,
        run: () => {
          mounted.canvas.peek();
        },
      });
      // a press far from the cluster: `hitAt` scans every node before it misses
      const missMs = timeIt({
        times: SAMPLES,
        run: () => {
          mounted.canvas.pointerDown({ id: 2, x: 780, y: 580 });
          mounted.canvas.pointerCancel(2);
        },
      });

      const report =
        `[canvas bench] N=${COUNT} culled=${snapshot.culled.length} ` +
        `commit=${commitMs.toFixed(2)}ms move=${moveMs.toFixed(2)}ms ` +
        `snapshot=${snapshotMs.toFixed(2)}ms hitMiss=${missMs.toFixed(2)}ms`;
      // oxlint-disable-next-line no-console
      console.log(report);

      // a generous ceiling: order-of-magnitude, not a frame budget. The report is the message so
      // a failure prints the numbers it failed on.
      expect(commitMs, report).toBeLessThan(50);
    } finally {
      mounted.dispose();
    }
  });
});
