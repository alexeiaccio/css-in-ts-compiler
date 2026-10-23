import { type SnapCandidates, type SnapContext, createCanvas, gridCandidates } from "../src";
import { describe, expect, it } from "vite-plus/test";
import { createRoot } from "solid-js";

// effects-of-atmosphere-wqml: the snap candidate policy is the host's. The mechanism (nearest
// candidate, the 8 SCREEN px threshold converted by the zoom, guides) stays the primitive's, and
// the default is the 50-unit grid the spec models (the contract scenarios cover that path).

const NODE = { id: "a", x: 100, y: 100, width: 200, height: 100, label: "A" };

const make = (snapCandidates: SnapCandidates | undefined) => {
  const moves: unknown[] = [];
  const canvas = createRoot(() =>
    createCanvas({
      nodes: [NODE],
      snap: true,
      requestFrame: () => {},
      ...(snapCandidates === undefined ? {} : { snapCandidates }),
      onNodesMove: (batch) => moves.push(...batch),
    }),
  );
  return { canvas, moves };
};

// Solid 2 applies signal writes on the microtask flush; `position` / `guides` read after it.
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** Press inside the node, drag it by `dx` screen px and report the live state. */
const drag = async ({
  canvas,
  dx,
}: {
  readonly canvas: ReturnType<typeof make>["canvas"];
  readonly dx: number;
}) => {
  canvas.pointerDown({ id: 1, x: 110, y: 110 });
  canvas.pointerMove({ id: 1, x: 110 + dx, y: 110 });
  await settle();
  return {
    x: canvas.position("a").x,
    y: canvas.position("a").y,
    guides: canvas.peek().guides,
  };
};

describe("createCanvas snapCandidates", () => {
  it("defaults to the 50-unit grid", async () => {
    const implicit = make(undefined);
    const explicit = make(gridCandidates);
    // 100 + 22 = 122 is 22 px from 100 and 28 from 150: out of the 8 px reach, free
    expect(await drag({ canvas: implicit.canvas, dx: 22 })).toEqual(
      await drag({ canvas: explicit.canvas, dx: 22 }),
    );
    expect(implicit.canvas.position("a").x).toBe(122);
    // 100 + 46 = 146 is 4 px from 150: snaps
    const near = make(undefined);
    expect((await drag({ canvas: near.canvas, dx: 46 })).x).toBe(150);
    expect(near.canvas.peek().guides).toEqual({ x: true, y: true });
  });

  it("asks per axis, snaps to the host candidate and nothing else", async () => {
    const asked: string[] = [];
    const { canvas, moves } = make(({ axis }) => {
      asked.push(axis);
      return axis === "x" ? [130] : [];
    });
    // origin 100 + 27 = 127: 3 px from 130
    expect(await drag({ canvas, dx: 27 })).toEqual({
      x: 130,
      y: 100,
      guides: { x: true, y: false },
    });
    expect(new Set(asked)).toEqual(new Set(["x", "y"]));
    canvas.pointerUp(1);
    await settle();
    expect(canvas.peek().guides).toEqual({ x: false, y: false });
    expect(moves).toEqual([{ id: "a", x: 130, y: 100 }]);
  });

  it("keeps the threshold in screen px: the same world gap snaps zoomed out, not at 100%", async () => {
    // origin 100 -> 110, candidate 120: a 10 unit gap
    const atFull = make(() => [120]);
    expect((await drag({ canvas: atFull.canvas, dx: 10 })).x).toBe(110);
    expect(atFull.canvas.peek().guides.x).toBe(false);

    const zoomedOut = make(() => [120]);
    // zoom 1/2 about the screen origin: the node now sits at screen (50, 50), 100 x 50
    zoomedOut.canvas.zoomTo(2048, [0, 0]);
    zoomedOut.canvas.pointerDown({ id: 1, x: 60, y: 60 });
    // 5 screen px = 10 world units; the gap to 120 is 10 units = 5 px <= 8
    zoomedOut.canvas.pointerMove({ id: 1, x: 65, y: 60 });
    await settle();
    expect(zoomedOut.canvas.position("a").x).toBe(120);
    expect(zoomedOut.canvas.peek().guides.x).toBe(true);
  });

  it("ignores a fractional candidate (candidates are whole world units)", async () => {
    const { canvas } = make(() => [122.5]);
    expect((await drag({ canvas, dx: 20 })).x).toBe(120);
    expect(canvas.peek().guides).toEqual({ x: false, y: false });
  });

  it("picks the nearest candidate, a tie going to the larger", async () => {
    const { canvas } = make(() => [100, 120, 400]);
    // origin 106: 6 from 100, 14 from 120
    expect((await drag({ canvas, dx: 6 })).x).toBe(100);
    // origin 110: 6 from 104 and 6 from 116 -> the larger
    const tie = make(() => [104, 116]);
    expect((await drag({ canvas: tie.canvas, dx: 10 })).x).toBe(116);
  });

  // effects-of-atmosphere-qcat: the policy sees the node, so right / bottom edges can align.
  it("hands the policy the dragged node: id, size, axis and origin", async () => {
    const contexts: SnapContext[] = [];
    const { canvas } = make((context) => {
      contexts.push(context);
      return [];
    });
    await drag({ canvas, dx: 5 });
    expect(contexts.length).toBeGreaterThan(0);
    expect(
      contexts.every(({ id, width, height }) => id === "a" && width === 200 && height === 100),
    ).toBe(true);
    // the origin on each axis: x 100 + 5, y 100
    expect(contexts).toContainEqual({
      axis: "x",
      value: 105,
      id: "a",
      width: 200,
      height: 100,
    });
    expect(contexts).toContainEqual({
      axis: "y",
      value: 100,
      id: "a",
      width: 200,
      height: 100,
    });
  });

  it("aligns the right and bottom edge through the node size", async () => {
    // right edge on x = 400, bottom edge on y = 300: origin = target - size
    const edges: SnapCandidates = ({ axis, width, height }) =>
      axis === "x" ? [400 - width] : [300 - height];
    const { canvas } = make(edges);
    canvas.pointerDown({ id: 1, x: 110, y: 110 });
    // origin (100, 100) -> (196, 196): 4 px short of the origin 200 on both axes
    canvas.pointerMove({ id: 1, x: 206, y: 206 });
    await settle();
    expect(canvas.position("a")).toEqual({ x: 200, y: 200 });
    const { x, y } = canvas.position("a");
    expect({ right: x + 200, bottom: y + 100 }).toEqual({
      right: 400,
      bottom: 300,
    });
    expect(canvas.peek().guides).toEqual({ x: true, y: true });
  });

  it("asks about the pressed node, with its own size, among several", async () => {
    const small = {
      id: "b",
      x: 500,
      y: 400,
      width: 80,
      height: 40,
      label: "B",
    };
    const canvas = createRoot(() =>
      createCanvas({
        nodes: [NODE, small],
        snap: true,
        requestFrame: () => {},
        snapCandidates: ({ axis, width }) => (axis === "x" ? [800 - width] : []),
      }),
    );
    // right edge on 800: a (200 wide) -> origin 600, b (80 wide) -> origin 720
    canvas.pointerDown({ id: 1, x: 510, y: 410 });
    canvas.pointerMove({ id: 1, x: 510 + 214, y: 410 });
    await settle();
    expect(canvas.position("b").x).toBe(720);
    expect(canvas.position("a").x).toBe(100);
  });

  it("keeps ties to the larger and ignores non-integers with a node-aware policy", async () => {
    // width 200: candidates 106, 114 and 110.5; origin 110 is 4 from both whole ones -> the larger
    const { canvas } = make(({ width }) => [width - 94, width - 86, 110.5]);
    expect((await drag({ canvas, dx: 10 })).x).toBe(114);
  });

  it("snap off ignores the policy", async () => {
    const { canvas } = make(() => [130]);
    canvas.setSnap(false);
    expect((await drag({ canvas, dx: 27 })).x).toBe(127);
  });
});
