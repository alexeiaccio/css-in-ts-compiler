import { afterEach, describe, expect, it } from "vite-plus/test";
import { byOrder, sceneToCanvasNodes } from "./scene";
import { mountScene, pointer, settle } from "./canvas.nested.fixture";
import type { Scene } from "./scene";
import type { SceneMounted } from "./canvas.nested.fixture";

// Input order a, b, c, e, d; `order` ranks them b < c < a and (tied at 400) d < e by id. So the
// input index and the stacking order disagree for a, b and the e / d pair.
const text = (id: string, x: number, y: number, order: number): Scene["nodes"][number] => ({
  id,
  x,
  y,
  width: 100,
  height: 100,
  order,
  content: { kind: "text", text: id },
});

const scene: Scene = {
  nodes: [
    text("a", 0, 0, 300),
    text("b", 50, 0, 100),
    text("c", 75, 50, 200),
    text("e", 230, 0, 400),
    text("d", 200, 0, 400),
  ],
};

// Where the nodes overlap, in viewport px (the camera is the identity at 1x).
const A_AND_B = [60, 25] as const;
const ALL_THREE = [90, 75] as const;
const B_AND_C = [125, 75] as const;
const TIED = [245, 30] as const;

let mounted: SceneMounted | undefined;
afterEach(() => {
  mounted?.dispose();
  mounted = undefined;
});

const mount = (): SceneMounted => {
  mounted = mountScene({ scene });
  return mounted;
};

const clientAt = (m: SceneMounted, at: readonly [number, number]): readonly [number, number] => {
  const rect = m.viewport("outer").getBoundingClientRect();
  return [rect.left + at[0], rect.top + at[1]];
};

/** Press and release at a viewport point; the settled selection is the node that took the press. */
const pressAt = async (
  m: SceneMounted,
  at: readonly [number, number],
): Promise<readonly string[]> => {
  const viewport = m.viewport("outer");
  pointer(viewport, "pointerdown", 1, clientAt(m, at));
  pointer(viewport, "pointerup", 1, clientAt(m, at));
  await settle();
  return m.canvas("outer").peek().selection;
};

describe("sceneToCanvasNodes x createCanvas: z-order", () => {
  it("feeds createCanvas the nodes bottom first, by byOrder", () => {
    expect(sceneToCanvasNodes(scene).map((node) => node.id)).toEqual(
      [...scene.nodes].sort(byOrder).map((node) => node.id),
    );
  });

  it("renders z-index = the rank by byOrder, not the input index", async () => {
    const m = mount();
    await settle();
    const zIndex = (id: string): string => getComputedStyle(m.node("outer", id)).zIndex;
    expect(zIndex("b")).toBe("0");
    expect(zIndex("c")).toBe("1");
    expect(zIndex("a")).toBe("2");
    // equal orders: the id breaks the tie, whatever the input order
    expect(zIndex("d")).toBe("3");
    expect(zIndex("e")).toBe("4");
    expect([...scene.nodes].sort(byOrder).map((node) => Number(zIndex(node.id)))).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  it("a pointer hit on an overlap picks the higher order, not the higher input index", async () => {
    const m = mount();
    await settle();
    // a is input index 0 and b index 1, but a's order is higher
    expect(await pressAt(m, A_AND_B)).toEqual(["a"]);
    // a (index 0, order 300) over c (index 2, order 200) and b (index 1, order 100)
    expect(await pressAt(m, ALL_THREE)).toEqual(["a"]);
    // no a here: c is above b
    expect(await pressAt(m, B_AND_C)).toEqual(["c"]);
    // tied orders: e (id after d) is above d although it comes first in the input
    expect(await pressAt(m, TIED)).toEqual(["e"]);
  });

  it("agrees with what the browser paints on top", async () => {
    const m = mount();
    await settle();
    const painted = (at: readonly [number, number]): string | undefined => {
      const [x, y] = clientAt(m, at);
      return document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>('[data-part^="node:outer:"]')
        ?.dataset["part"]?.replace("node:outer:", "");
    };
    expect(painted(ALL_THREE)).toBe("a");
    expect(painted(B_AND_C)).toBe("c");
    expect(painted(TIED)).toBe("e");
  });
});
