import { type CanvasMounted, mountCanvas } from "./canvas.fixture";
import { describe, expect, it } from "vite-plus/test";
import { ZONE } from "../src";
import { userEvent } from "vite-plus/test/browser";

// The accessibility contract of effects-of-atmosphere-h9vk, checked on the real DOM and with real
// keyboard / mouse input. None of this is in the Quint specs (they model pointer and camera only),
// so it is tested directly instead of through the differential walk.

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const SIZE = { width: 100, height: 60 };
const node = (id: string, x: number, y: number, label: string) => ({
  id,
  x,
  y,
  label,
  ...SIZE,
});

const parts = (mounted: CanvasMounted): HTMLElement[] => [
  ...mounted.root.querySelectorAll<HTMLElement>('[data-part^="node"]'),
];
const order = (mounted: CanvasMounted): string[] =>
  parts(mounted).map((element) => element.dataset["part"] ?? "");
const part = (mounted: CanvasMounted, name: string): HTMLElement => {
  const element = mounted.root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no part ${name}`);
  }
  return element;
};
const live = (mounted: CanvasMounted): string => part(mounted, "live").textContent;

const withMounted = async (
  mounted: CanvasMounted,
  body: (mounted: CanvasMounted) => Promise<void>,
): Promise<void> => {
  try {
    await settle();
    await body(mounted);
  } finally {
    mounted.dispose();
  }
};

describe("createCanvas accessibility contract (real DOM)", () => {
  const scrambled = [
    node("c", 400, 300, "Gamma"),
    node("a", 300, 100, "Alpha"),
    node("b", 50, 100, "Beta"),
    node("d", 50, 100, "Delta"),
  ];

  it("DOM order is the spatial order: rows by y, then x, input order breaks ties", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: scrambled });
    await withMounted(mounted, async () => {
      expect(order(mounted)).toEqual(["nodeb", "noded", "nodea", "nodec"]);
      expect(mounted.canvas.nodeIds()).toEqual(["b", "d", "a", "c"]);
    });
    const reversed = mountCanvas({
      kind: "camera",
      nodes: [...scrambled].reverse(),
    });
    await withMounted(reversed, async () => {
      // the tie between Beta and Delta now resolves the other way: input order, not id order
      expect(order(reversed)).toEqual(["noded", "nodeb", "nodea", "nodec"]);
    });
  });

  it("every node is a focusable, named element; the viewport is a labelled region, never an application", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: scrambled });
    await withMounted(mounted, async () => {
      expect(mounted.root.querySelector('[role="application"]')).toBeNull();
      const viewport = part(mounted, "viewport");
      expect(viewport.getAttribute("role")).toBe("region");
      expect(viewport.getAttribute("aria-label")).toBe("Canvas");
      for (const element of parts(mounted)) {
        expect(element.tabIndex).toBe(0);
        expect(element.getAttribute("role")).toBe("group");
        expect(element.getAttribute("aria-roledescription")).toBe("canvas node");
        expect(element.getAttribute("aria-label")).not.toBe("");
      }
      expect(part(mounted, "live").getAttribute("aria-live")).toBe("polite");
    });
  });

  it("Tab walks the nodes in DOM (= spatial) order", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: scrambled });
    await withMounted(mounted, async () => {
      const visited: string[] = [];
      for (let step = 0; step < scrambled.length; step += 1) {
        await userEvent.tab();
        visited.push(
          document.activeElement instanceof HTMLElement
            ? (document.activeElement.dataset["part"] ?? "")
            : "",
        );
      }
      expect(visited).toEqual(order(mounted));
    });
  });

  it("arrow keys move the focused node, Shift multiplies, the live region says where, focus survives the reorder", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 100, 100, "Alpha"), node("b", 100, 200, "Beta")],
    });
    await withMounted(mounted, async () => {
      expect(order(mounted)).toEqual(["nodea", "nodeb"]);
      part(mounted, "nodea").focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(live(mounted)).toBe("Alpha moved right to 110, 100");
      expect(mounted.events.get("onNodesMove")).toEqual([[{ id: "a", x: 110, y: 100 }]]);
      // Shift = one grid cell (5 x 10): 100 -> 150 -> 200 (a tie with Beta, still first) -> 250
      for (let press = 0; press < 3; press += 1) {
        await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
      }
      await settle();
      expect(live(mounted)).toBe("Alpha moved down to 110, 250");
      expect(part(mounted, "nodea").style.getPropertyValue("--node-y")).toBe("250");
      // Alpha is now below Beta: the DOM reorders, and the focus must still be on Alpha
      expect(order(mounted)).toEqual(["nodeb", "nodea"]);
      expect(document.activeElement).toBe(part(mounted, "nodea"));
      expect(document.activeElement?.getAttribute("aria-label")).toBe("Alpha");
    });
  });

  // Chromium drops focus (and fires blur) when insertBefore / append re-inserts a focused element;
  // only moveBefore keeps it, and Solid's `For` does not use it. Whether the focused element is the
  // one that gets moved depends on the reconcile, so run several reorders and require that at least
  // one physically moved the focused node, otherwise this test would prove nothing.
  it("focus survives a reorder that moves the focused element itself", async () => {
    const cases = [
      { focus: "a", key: "{Shift>}{ArrowDown}{/Shift}", presses: 8, last: "c" },
      { focus: "c", key: "{Shift>}{ArrowUp}{/Shift}", presses: 8, last: "c" },
      { focus: "b", key: "{Shift>}{ArrowDown}{/Shift}", presses: 8, last: "b" },
      {
        focus: "a",
        key: "{Shift>}{ArrowRight}{/Shift}",
        presses: 2,
        last: "a",
      },
    ];
    let focusedWasMoved = false;
    for (const { focus, key, presses } of cases) {
      const mounted = mountCanvas({
        kind: "camera",
        nodes: [
          node("a", 100, 100, "Alpha"),
          node("b", 100, 200, "Beta"),
          node("c", 100, 300, "Gamma"),
        ],
      });
      await withMounted(mounted, async () => {
        const element = part(mounted, `node${focus}`);
        const layer = part(mounted, "layer");
        const observer = new MutationObserver((records) => {
          if (records.some((record) => [...record.removedNodes].includes(element))) {
            focusedWasMoved = true;
          }
        });
        observer.observe(layer, { childList: true });
        element.focus();
        for (let press = 0; press < presses; press += 1) {
          await userEvent.keyboard(key);
          await settle();
          expect(document.activeElement).toBe(element);
        }
        observer.disconnect();
      });
    }
    expect(focusedWasMoved).toBe(true);
  });

  it("arrows stop at the world bound and announce the clamped position", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 999_890, 0, "Alpha")],
    });
    await withMounted(mounted, async () => {
      part(mounted, "nodea").focus();
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      await settle();
      // 1e6 - width 100 = 999900 is the largest x that keeps the node inside the bound
      expect(live(mounted)).toBe("Alpha moved right to 999900, 0");
    });
  });

  it("Enter selects, Shift+Enter toggles; F2 edits and an editing node ignores arrows", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: [node("a", 100, 100, "Alpha"), node("b", 300, 100, "Beta")],
    });
    await withMounted(mounted, async () => {
      part(mounted, "nodea").focus();
      await userEvent.keyboard("{Enter}");
      await settle();
      expect(part(mounted, "nodea").getAttribute("aria-selected")).toBe("true");
      expect(live(mounted)).toBe("Alpha selected");
      part(mounted, "nodeb").focus();
      await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
      await settle();
      expect(live(mounted)).toBe("2 nodes selected: Alpha, Beta");
      expect(mounted.events.get("onSelectionChange")).toEqual([["a"], ["a", "b"]]);

      await userEvent.keyboard("{Enter}");
      await settle();
      expect(mounted.canvas.peek().selection).toEqual(["b"]);
      await userEvent.keyboard("{F2}");
      await settle();
      expect(mounted.canvas.peek().editing).toBe("b");
      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(mounted.canvas.position("b")).toEqual({ x: 300, y: 100 });
      await userEvent.keyboard("{Escape}");
      await settle();
      expect(mounted.canvas.peek().editing).toBeNull();
    });
  });
});

describe("createCanvas focus reveals the node (real DOM)", () => {
  const far = [node("near", 100, 100, "Near"), node("far", 5000, 4000, "Far")];

  const centreOf = (mounted: CanvasMounted, name: string) => {
    const viewport = part(mounted, "viewport").getBoundingClientRect();
    const box = part(mounted, name).getBoundingClientRect();
    return {
      x: box.left + box.width / 2 - viewport.left,
      y: box.top + box.height / 2 - viewport.top,
    };
  };

  it("a tween and a reduced-motion jump end in the same camera, with the node centred", async () => {
    const animated = mountCanvas({ kind: "camera", nodes: far });
    const reduced = mountCanvas({
      kind: "camera",
      nodes: far,
      reducedMotion: true,
    });
    await settle();
    try {
      part(animated, "nodefar").focus();
      part(reduced, "nodefar").focus();
      await settle();
      expect(animated.canvas.peek().tweening).toBe(true);
      // reduced motion: no tween at all, the camera is already there
      expect(reduced.canvas.peek().tweening).toBe(false);
      for (let frame = 0; frame < 4; frame += 1) {
        animated.canvas.tick();
      }
      await settle();
      expect(animated.canvas.peek().tweening).toBe(false);
      expect(animated.canvas.peek().camera).toEqual(reduced.canvas.peek().camera);
      // world (5050, 4030) centred in 800 x 600
      expect(animated.canvas.peek().camera).toEqual({
        tx: 102_400 - 5050 * 256,
        ty: 76_800 - 4030 * 256,
        z: ZONE,
      });
      for (const mounted of [animated, reduced]) {
        const centre = centreOf(mounted, "nodefar");
        expect(centre.x).toBeCloseTo(400, 2);
        expect(centre.y).toBeCloseTo(300, 2);
      }
      expect(document.activeElement).toBe(part(reduced, "nodefar"));
    } finally {
      animated.dispose();
      reduced.dispose();
    }
  });

  // With `overflow: hidden` the browser scrolls the viewport natively to the focused node (it was
  // measured jumping to 4300 / 3460) before the camera tween has moved anything.
  it("focusing a far node never scrolls the viewport natively, by focus() or by Tab", async () => {
    for (const how of ["focus", "tab"] as const) {
      const mounted = mountCanvas({ kind: "camera", nodes: far });
      await withMounted(mounted, async () => {
        const viewport = part(mounted, "viewport");
        if (how === "focus") {
          part(mounted, "nodefar").focus();
        } else {
          part(mounted, "nodenear").focus();
          await userEvent.tab();
        }
        await settle();
        expect(document.activeElement).toBe(part(mounted, "nodefar"));
        expect(mounted.canvas.peek().tweening).toBe(true);
        expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([0, 0]);
      });
    }
  });

  it("requestAnimationFrame drives the tween by default", async () => {
    const mounted = mountCanvas({
      kind: "camera",
      nodes: far,
      autoFrames: true,
    });
    try {
      await settle();
      part(mounted, "nodefar").focus();
      await expect.poll(() => mounted.canvas.peek().tweening).toBe(false);
      expect(mounted.canvas.peek().camera.tx).toBe(102_400 - 5050 * 256);
    } finally {
      mounted.dispose();
    }
  });

  it("a node already fully in view does not move the camera", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: far });
    await withMounted(mounted, async () => {
      part(mounted, "nodenear").focus();
      await settle();
      expect(mounted.canvas.peek().tweening).toBe(false);
      expect(mounted.canvas.peek().camera).toEqual({ tx: 0, ty: 0, z: ZONE });
    });
  });
});

describe("createCanvas rendered geometry and real pointer input", () => {
  it("the camera layer places every node where screen = (world + t) * zoom says", async () => {
    const mounted = mountCanvas({ kind: "pointer" });
    await withMounted(mounted, async () => {
      mounted.canvas.zoomBy(2 * ZONE, [0, 0]);
      mounted.canvas.panBy(-100, -50);
      await settle();
      const { tx, ty, z } = mounted.canvas.peek().camera;
      const viewport = part(mounted, "viewport");
      const frame = viewport.getBoundingClientRect();
      for (const [name, x, y, width] of [
        ["node0", 100, 100, 200],
        ["node1", 250, 150, 200],
        ["node2", 600, 400, 100],
      ] as const) {
        const box = part(mounted, name).getBoundingClientRect();
        const scale = z / ZONE;
        expect(box.left - frame.left - viewport.clientLeft).toBeCloseTo((x + tx / 256) * scale, 3);
        expect(box.top - frame.top - viewport.clientTop).toBeCloseTo((y + ty / 256) * scale, 3);
        expect(box.width).toBeCloseTo(width * scale, 3);
      }
    });
  });

  it("a real click selects the node, focuses its element and announces it", async () => {
    const mounted = mountCanvas({ kind: "pointer" });
    await withMounted(mounted, async () => {
      await userEvent.click(part(mounted, "node1"));
      await settle();
      expect(mounted.canvas.peek().selection).toEqual(["1"]);
      expect(document.activeElement).toBe(part(mounted, "node1"));
      expect(live(mounted)).toBe("Node B selected");
      expect(part(mounted, "node1").getAttribute("aria-selected")).toBe("true");
    });
  });

  it("a real drag moves the node by the pointer delta and commits once", async () => {
    const mounted = mountCanvas({ kind: "pointer" });
    await withMounted(mounted, async () => {
      const source = part(mounted, "node0").getBoundingClientRect();
      const target = part(mounted, "viewport").getBoundingClientRect();
      const dx = Math.round(target.left + target.width / 2 - (source.left + source.width / 2));
      const dy = Math.round(target.top + target.height / 2 - (source.top + source.height / 2));
      await userEvent.dragAndDrop(part(mounted, "node0"), part(mounted, "viewport"));
      await settle();
      expect(mounted.canvas.peek().mode).toBe("idle");
      expect(mounted.events.get("onNodesMove")).toEqual([[{ id: "0", x: 100 + dx, y: 100 + dy }]]);
      expect(mounted.canvas.position("0")).toEqual({
        x: 100 + dx,
        y: 100 + dy,
      });
    });
  });
});
