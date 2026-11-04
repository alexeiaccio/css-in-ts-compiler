import { type CanvasMounted, mountCanvas } from "./canvas.fixture";
import { createCanvas } from "../src";
import { createRoot } from "solid-js";
import { describe, expect, it } from "vite-plus/test";

// cssints-wngf: the landing preview and the drop. The landing is spec state (`landingX` / `landingY`
// in pointer.qnt, compared by the differential walk through `state[landing]`); the ghost is the
// fixture's (the host's), because the primitive renders no elements. The drop is presentation, not
// spec state: `position(id)` stays the committed origin and the primitive exposes the from/to
// correction for `TWEEN_TICKS` frames, with the camera tween's frames and reduced-motion jump.

const NODE = { id: "a", x: 100, y: 100, width: 200, height: 100, label: "Alpha" };

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const part = (mounted: CanvasMounted, name: string): HTMLElement => {
  const element = mounted.root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no part ${name}`);
  }
  return element;
};

const ghost = (mounted: CanvasMounted): HTMLElement | null =>
  mounted.root.querySelector<HTMLElement>('[data-part="ghost"]');

describe("createCanvas landing preview (real DOM)", () => {
  it("a pointer drag shows the snapped landing and commits exactly there", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: [NODE], snap: true });
    try {
      await settle();
      const canvas = mounted.canvas;
      expect(canvas.peek().landing).toBeNull();

      canvas.pointerDown({ id: 1, x: 110, y: 110 });
      // origin 100 + 46 = 146 is 4 units from the 150 grid line: inside the 8 px reach
      canvas.pointerMove({ id: 1, x: 156, y: 110 });
      await settle();
      const landing = canvas.peek().landing;
      expect(landing).toEqual({ id: "a", x: 150, y: 100 });

      // the host draws the ghost at the landing; the live drag already renders the same slot
      const box = ghost(mounted);
      expect(box?.style.transform).toBe("translate(150px, 100px)");
      expect(box?.style.width).toBe("200px");
      const nodeBox = part(mounted, "nodea").getBoundingClientRect();
      const ghostBox = box?.getBoundingClientRect();
      expect(ghostBox?.left).toBeCloseTo(nodeBox.left, 3);
      expect(ghostBox?.top).toBeCloseTo(nodeBox.top, 3);

      canvas.pointerUp(1);
      await settle();
      expect(canvas.position("a")).toEqual({ x: landing?.x, y: landing?.y });
      expect(canvas.peek().landing).toBeNull();
      expect(ghost(mounted)).toBeNull();
      expect(canvas.peek().mode).toBe("idle");
    } finally {
      mounted.dispose();
    }
  });

  it("with snap off the landing follows the pointer off the grid, and the drop still starts no frames", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: [NODE], snap: false });
    try {
      await settle();
      const canvas = mounted.canvas;
      canvas.pointerDown({ id: 1, x: 110, y: 110 });
      canvas.pointerMove({ id: 1, x: 156, y: 110 });
      await settle();
      expect(canvas.peek().landing).toEqual({ id: "a", x: 146, y: 100 });
      expect(ghost(mounted)?.style.transform).toBe("translate(146px, 100px)");
      canvas.pointerUp(1);
      await settle();
      expect(canvas.position("a")).toEqual({ x: 146, y: 100 });
      expect(canvas.peek().landing).toBeNull();
      expect(ghost(mounted)).toBeNull();
      expect(canvas.peek().tweening).toBe(false);
    } finally {
      mounted.dispose();
    }
  });
});

describe("createCanvas drop tween (no DOM)", () => {
  /** A node at the right world bound, panned to the viewport origin, so a rightward drag is clamped. */
  const dragPastTheBound = (reducedMotion: boolean) => {
    const frames: Array<() => void> = [];
    const canvas = createRoot(() =>
      createCanvas({
        nodes: [{ id: "a", x: 999_800, y: 0, width: 200, height: 100, label: "Alpha" }],
        viewport: { width: 400, height: 200 },
        reducedMotion,
        requestFrame: (callback) => frames.push(callback),
      }),
    );
    canvas.panBy(-999_800, 0);
    canvas.pointerDown({ id: 1, x: 10, y: 10 });
    canvas.pointerMove({ id: 1, x: 30, y: 10 });
    return { canvas, frames };
  };

  it("exposes the drop's from and to for TWEEN_TICKS frames, then clears it", async () => {
    const { canvas, frames } = dragPastTheBound(false);
    await settle();
    expect(canvas.position("a").x).toBe(999_820);
    canvas.pointerUp(1);
    await settle();
    // the commit clamps to the world bound; the node is already there, the drop says where it was
    expect(canvas.position("a").x).toBe(999_800);
    expect(canvas.peek().drop).toEqual({
      id: "a",
      from: { x: 999_820, y: 0 },
      to: { x: 999_800, y: 0 },
    });
    expect(frames.length).toBe(1);
    for (let tick = 0; tick < 4; tick += 1) {
      frames.shift()?.();
    }
    await settle();
    expect(canvas.peek().drop).toBeNull();
    expect(frames).toEqual([]);
  });

  it("reduced motion jumps straight to the commit, with no drop and no frames", async () => {
    const { canvas, frames } = dragPastTheBound(true);
    await settle();
    canvas.pointerUp(1);
    await settle();
    expect(canvas.position("a").x).toBe(999_800);
    expect(canvas.peek().drop).toBeNull();
    expect(frames).toEqual([]);
  });
});
