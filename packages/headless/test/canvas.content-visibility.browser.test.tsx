import { describe, expect, it } from "vite-plus/test";
import { mountCanvas } from "./canvas.fixture";
import { userEvent } from "vite-plus/test/browser";

// effects-of-atmosphere-ki8x, the point the prior-art research left unverified: does
// `content-visibility: auto` skip content correctly inside a scaled / transformed ancestor, and does
// skipped content stay focusable and findable? Measured in the real Chromium that runs the suite
// (the vitest browser iframe is 414 x 896; the canvas viewport below is 400 x 300).
//
// FINDING (Chromium 153, recorded 2026-10-05):
//  1. The skip DOES see the transform. The element's position is mapped through
//     `scale(z) translate(t)`: a node 6000 layout px away that lands 375 px from the viewport at
//     zoom 1/16 is rendered, a node at the same layout distance with no zoom is skipped, and a
//     translation that brings a far node on screen un-skips it.
//  2. The skip DISTANCE is not in screen px. The relevance margin behaves as a fixed distance in
//     the node's local (pre-transform) space, so on screen the horizon grows with the zoom:
//     measured first-skipped distance, x axis: 800 px at 1/16, 1200 at 1/4, 2500 at 1, 10000
//     at 4, 50000 at 16 (y axis the same shape: 500, 800, 1600, 6000, 20000). Zoomed in,
//     content-visibility skips almost nothing even though almost everything is off screen:
//     at 16x a node 20000 screen px away (50 viewports) is still rendered.
//  3. Skipped content stays focusable, tabbable and findable (focus() / Tab / window.find all
//     reach it, and doing so un-skips it). The skip never costs accessibility.
//
// DECISION this drives: keep `content-visibility: auto` + `contain-intrinsic-size` on every node
// that is not selected / focused / editing (free, never breaks focus, helps when zoomed out), but
// do NOT treat it as the culling mechanism. Culling is the primitive's own predicate
// (`isCulled`, from state, zoom independent). Since every node must stay a focusable element, a
// host culls the node BODY (children) and keeps the shell (role, label, tabindex).

const frames = async (count: number): Promise<void> => {
  for (let frame = 0; frame < count; frame += 1) {
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
};

interface Probe {
  readonly item: HTMLElement;
  readonly inner: HTMLButtonElement;
}

/** The real layer shape: viewport (clip) > layer `scale(z) translate(t)` > absolutely placed nodes. */
const build = (
  camera: {
    readonly scale: number;
    readonly tx?: number;
    readonly ty?: number;
  },
  items: ReadonlyArray<readonly [name: string, x: number, y: number]>,
) => {
  const viewport = document.createElement("div");
  viewport.style.cssText = "position:relative;overflow:clip;width:400px;height:300px;margin:20px";
  const layer = document.createElement("div");
  layer.style.cssText = `position:absolute;left:0;top:0;transform-origin:0 0;transform:scale(${camera.scale}) translate(${camera.tx ?? 0}px, ${camera.ty ?? 0}px)`;
  const probes = new Map<string, Probe>();
  for (const [name, x, y] of items) {
    const item = document.createElement("div");
    item.style.cssText = `position:absolute;left:0;top:0;width:100px;height:60px;transform:translate(${x}px, ${y}px);content-visibility:auto;contain-intrinsic-size:auto 100px 60px`;
    const inner = document.createElement("button");
    inner.textContent = `needle-${name}`;
    item.append(inner);
    layer.append(item);
    probes.set(name, { item, inner });
  }
  viewport.append(layer);
  document.body.append(viewport);
  const rendered = (name: string): boolean =>
    probes.get(name)?.inner.checkVisibility({ contentVisibilityAuto: true }) ?? false;
  return { viewport, probes, rendered };
};

describe("content-visibility: auto inside a scaled ancestor (real Chromium)", () => {
  it("maps the node position through the scale: layout-far but on screen is rendered, far on screen is skipped", async () => {
    const zoomedOut = build({ scale: 1 / 16 }, [
      ["onScreen", 6000, 50],
      ["offScreen", 250_000, 50],
    ]);
    const plain = build({ scale: 1 }, [
      ["sameLayoutDistance", 6000, 50],
      ["origin", 0, 50],
    ]);
    const translated = build({ scale: 1, tx: -5900 }, [
      ["revealedByTranslate", 6000, 50],
      ["origin", 0, 50],
    ]);
    try {
      await frames(3);
      // 6000 layout px at zoom 1/16 is 375 screen px: on screen, so rendered ...
      expect(zoomedOut.rendered("onScreen")).toBe(true);
      expect(zoomedOut.rendered("offScreen")).toBe(false);
      // ... while the same layout distance without the scale is far off screen, so skipped
      expect(plain.rendered("origin")).toBe(true);
      expect(plain.rendered("sameLayoutDistance")).toBe(false);
      // a translation that brings the far node on screen un-skips it, and skips the origin
      expect(translated.rendered("revealedByTranslate")).toBe(true);
      expect(translated.rendered("origin")).toBe(false);
    } finally {
      zoomedOut.viewport.remove();
      plain.viewport.remove();
      translated.viewport.remove();
    }
  });

  it("skips at a distance that grows with the zoom (it is not a screen-px margin)", async () => {
    // one item per screen distance along x; the first skipped distance is the horizon
    const distances = [500, 800, 1200, 1600, 2000, 2500, 3000, 4000, 6000, 10_000, 20_000, 50_000];
    const horizonAt = async (scale: number): Promise<number> => {
      const { viewport, rendered } = build(
        { scale },
        distances.map((distance) => [String(distance), distance / scale, 20 / scale] as const),
      );
      try {
        await frames(3);
        return (
          distances.find((distance) => !rendered(String(distance))) ?? Number.POSITIVE_INFINITY
        );
      } finally {
        viewport.remove();
      }
    };
    const zoomedOut = await horizonAt(1 / 16);
    const unit = await horizonAt(1);
    const zoomedIn = await horizonAt(16);
    expect(zoomedOut).toBeLessThan(unit);
    expect(unit).toBeLessThan(zoomedIn);
    // zoomed in 16x, a node 20000 screen px (about 50 viewports) away is still rendered
    expect(zoomedIn).toBeGreaterThan(20_000);
  });

  it("skipped content stays focusable, tabbable and findable, and doing so un-skips it", async () => {
    const focus = build({ scale: 1 / 16 }, [
      ["near", 50, 50],
      ["far", 400_000, 50],
    ]);
    try {
      await frames(3);
      expect(focus.rendered("far")).toBe(false);
      focus.probes.get("far")?.inner.focus({ preventScroll: true });
      expect(document.activeElement).toBe(focus.probes.get("far")?.inner);
      await frames(3);
      expect(focus.rendered("far")).toBe(true);
    } finally {
      focus.viewport.remove();
    }

    const tab = build({ scale: 1 / 16 }, [
      ["first", 400_000, 50],
      ["second", 800_000, 50],
    ]);
    try {
      await frames(3);
      expect(tab.rendered("first")).toBe(false);
      expect(tab.rendered("second")).toBe(false);
      document.body.focus();
      const reached: string[] = [];
      for (let press = 0; press < 2; press += 1) {
        await userEvent.tab();
        reached.push(document.activeElement?.textContent ?? "");
      }
      expect(reached).toEqual(["needle-first", "needle-second"]);
    } finally {
      tab.viewport.remove();
    }

    const find = build({ scale: 1 }, [
      ["near", 50, 50],
      ["far", 6000, 50],
    ]);
    try {
      await frames(3);
      expect(find.rendered("far")).toBe(false);
      // `window.find` is non-standard but is Chromium's find-in-page entry point
      const found = (window as unknown as { find: (query: string) => boolean }).find("needle-far");
      expect(found).toBe(true);
      await frames(3);
      expect(find.rendered("far")).toBe(true);
    } finally {
      find.viewport.remove();
    }
  });
});

describe("createCanvas culling contract (real Chromium)", () => {
  const nodes = [
    { id: "a", x: 100, y: 100, width: 100, height: 60, label: "Alpha" },
    { id: "b", x: 300, y: 100, width: 100, height: 60, label: "Beta" },
  ];

  it("drops the body of a culled node but keeps its shell: role, name, tab stop, containment", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes });
    const shell = (id: string) =>
      mounted.root.querySelector<HTMLElement>(`[data-part="node${id}"]`);
    const body = (id: string) => shell(id)?.querySelector<HTMLElement>(":scope > div") ?? null;
    try {
      await frames(2);
      // nothing is culled while both nodes are on screen
      expect(body("a")).not.toBeNull();
      expect(body("b")).not.toBeNull();

      // pan 100000 px: both nodes are now far outside any skip horizon at zoom 1
      mounted.canvas.panBy(-100_000, 0);
      await frames(3);
      expect(mounted.canvas.isCulled("a")).toBe(true);
      expect(mounted.canvas.isCulled("b")).toBe(true);

      // the body is gone, the shell is not
      expect(body("a")).toBeNull();
      expect(body("b")).toBeNull();
      const b = shell("b");
      expect(b).not.toBeNull();
      expect(b?.getAttribute("role")).toBe("group");
      expect(b?.getAttribute("aria-label")).toBe("Beta");
      expect(b?.getAttribute("tabindex")).toBe("0");
      expect(b?.style.getPropertyValue("content-visibility")).toBe("auto");
      expect(b?.style.getPropertyValue("contain-intrinsic-size")).toBe("auto 100px 60px");

      // and the shell is still the focusable tab stop with its body culled
      b?.focus({ preventScroll: true });
      expect(document.activeElement).toBe(b);
    } finally {
      mounted.dispose();
    }
  });

  it("focusing a culled node mounts its body and pans it into view", async () => {
    // reduced motion jumps the camera to the tween's end state, so the pan settles in one step
    const mounted = mountCanvas({ kind: "camera", nodes, reducedMotion: true });
    const shell = (id: string) =>
      mounted.root.querySelector<HTMLElement>(`[data-part="node${id}"]`);
    const body = (id: string) => shell(id)?.querySelector<HTMLElement>(":scope > div") ?? null;
    try {
      await frames(2);
      mounted.canvas.panBy(-100_000, 0);
      await frames(3);
      expect(mounted.canvas.isCulled("b")).toBe(true);
      expect(body("b")).toBeNull();
      const cameraBefore = mounted.canvas.peek().camera;

      shell("b")?.focus({ preventScroll: true });
      await frames(3);
      // focus exempts the node, so its body is mounted again ...
      expect(mounted.canvas.isCulled("b")).toBe(false);
      expect(body("b")).not.toBeNull();
      // ... and the default focusFollowsCamera moved the camera toward it
      expect(mounted.canvas.peek().camera).not.toEqual(cameraBefore);
    } finally {
      mounted.dispose();
    }
  });

  it("a selected, focused or editing node is never culled", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes, reducedMotion: true });
    const shell = (id: string) =>
      mounted.root.querySelector<HTMLElement>(`[data-part="node${id}"]`);
    const body = (id: string) => shell(id)?.querySelector<HTMLElement>(":scope > div") ?? null;
    try {
      await frames(2);
      // marquee-select `a` without focusing it, so selection is the only exemption
      mounted.canvas.pointerDown({ id: 1, x: 50, y: 50 });
      mounted.canvas.pointerMove({ id: 1, x: 250, y: 250 });
      mounted.canvas.pointerUp(1);
      await frames(2);
      expect(mounted.canvas.isSelected("a")).toBe(true);

      mounted.canvas.panBy(-100_000, 0);
      await frames(3);
      expect(mounted.canvas.isCulled("a")).toBe(false);
      expect(body("a")).not.toBeNull();
      expect(shell("a")?.style.getPropertyValue("content-visibility")).toBe("visible");
      // while the untouched node is culled
      expect(mounted.canvas.isCulled("b")).toBe(true);
      expect(body("b")).toBeNull();

      // editing is an exemption too
      mounted.canvas.toggleEdit();
      await frames(2);
      expect(mounted.canvas.isCulled("a")).toBe(false);
      expect(body("a")).not.toBeNull();
    } finally {
      mounted.dispose();
    }
  });
});
