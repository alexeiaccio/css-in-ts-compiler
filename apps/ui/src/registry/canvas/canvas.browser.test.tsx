// The canvas starter's check: the two things the skin adds to the primitive — a minimap that is also a camera, and a drag
// that pans at the frame's edge — plus the wiring a host must not get wrong (the frame's own style, the cards' tab stop and
// the live region). The pointer events are real `PointerEvent`s on the frame, the same path a user's mouse takes.
import { render } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Canvas, type CanvasNodeInput } from "./canvas.tsx";

const CARDS: ReadonlyArray<CanvasNodeInput> = [
  { id: "a", label: "Alpha", x: 40, y: 40, width: 200, height: 90 },
  { id: "b", label: "Beta", x: 360, y: 40, width: 200, height: 90 },
  { id: "c", label: "Gamma", x: 900, y: 260, width: 200, height: 90 },
];

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const dispose of mounted.splice(0)) {
    dispose();
  }
});

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 30);
  });

const frames = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const mount = (props: { readonly width?: number; readonly height?: number } = {}): HTMLElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const dispose = render(
    () => (
      <Canvas
        nodes={CARDS}
        label="Release board"
        width={props.width ?? 720}
        height={props.height ?? 460}
      />
    ),
    host,
  );
  mounted.push(() => {
    dispose();
    host.remove();
  });
  return host;
};

const part = <T extends Element>(host: ParentNode, name: string): T => {
  const element = host.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`canvas: no ${name}`);
  }
  return element;
};

/** The camera as the primitive renders it: the layer's own custom properties. */
const camera = (
  host: ParentNode,
): { readonly x: number; readonly y: number; readonly zoom: number } => {
  const style = getComputedStyle(part<HTMLElement>(host, "canvas-layer"));
  return {
    x: Number(style.getPropertyValue("--canvas-x")),
    y: Number(style.getPropertyValue("--canvas-y")),
    zoom: Number(style.getPropertyValue("--canvas-zoom")),
  };
};

/** A real pointer event on the frame, at a client position. */
const pointer = (target: Element, type: string, clientX: number, clientY: number): void => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX,
      clientY,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
    }),
  );
};

describe("Canvas", () => {
  it("renders the cards in the frame, one tab stop and a live region, and the world scrolls under them", () => {
    const host = mount();
    const frame = part<HTMLElement>(host, "canvas-frame");
    const cards = [...host.querySelectorAll<HTMLElement>('[data-part="canvas-card"]')];

    expect(frame.getAttribute("role")).toBe("region");
    expect(frame.getAttribute("aria-label")).toBe("Release board");
    // the primitive's own style survives the skin's: the frame is the clipping box the camera needs
    expect(getComputedStyle(frame).overflow).toBe("clip");
    expect(getComputedStyle(frame).width).toBe("720px");
    expect(cards.map((card) => card.dataset.node)).toEqual(["a", "b", "c"]);
    // Gamma is off screen, so its body is culled: the shell stays, named, and never costs a tab stop
    expect(cards.map((card) => card.textContent)).toEqual(["Alpha", "Beta", ""]);
    expect(cards[2]!.getAttribute("aria-label")).toBe("Gamma");
    // every card is its own tab stop (the canvas is a focusgroup, not one composite), culled or not
    expect(cards.filter((card) => card.tabIndex === 0)).toHaveLength(3);
    expect(part(host, "canvas-status").getAttribute("role")).toBe("status");
  });

  it("draws a minimap of every card and the frame's own view", () => {
    const host = mount();
    const map = part<SVGSVGElement>(host, "canvas-minimap");
    expect(map.getAttribute("aria-hidden")).toBe("true");
    expect(
      [...map.querySelectorAll('[data-part="canvas-minimap-node"]')].map((rect) =>
        rect.getAttribute("data-node"),
      ),
    ).toEqual(["a", "b", "c"]);
    const view = part<SVGRectElement>(host, "canvas-minimap-view");
    // the frame is 720 x 460 of a wider world, so the view rectangle is smaller than the map
    expect(Number(view.getAttribute("width"))).toBeGreaterThan(0);
    expect(Number(view.getAttribute("width"))).toBeLessThan(168);
  });

  it("centres the camera on a click on the minimap", async () => {
    const host = mount();
    const before = camera(host);
    const map = part<SVGSVGElement>(host, "canvas-minimap");
    const box = map.getBoundingClientRect();
    // the far corner of the map: the card that is out of the frame
    pointer(map, "pointerdown", box.right - 6, box.bottom - 6);
    await settle();
    // the camera tweens to its goal, so the frame needs a few of them
    for (let i = 0; i < 40; i += 1) {
      await frames();
    }
    const after = camera(host);
    expect(after.x).toBeLessThan(before.x);
    expect(after.y).toBeLessThanOrEqual(before.y);
  });

  it("pans when a drag reaches the frame's edge, and stays put in the middle", async () => {
    const host = mount();
    const frame = part<HTMLElement>(host, "canvas-frame");
    const box = frame.getBoundingClientRect();
    const card = part<HTMLElement>(host, "canvas-card");
    const start = card.getBoundingClientRect();

    // a drag that stays in the middle of the frame does not move the camera
    pointer(frame, "pointerdown", start.left + 20, start.top + 20);
    pointer(frame, "pointermove", start.left + 60, start.top + 40);
    await settle();
    const middle = camera(host);

    // …and one that reaches the right edge pulls it: the world moves under the pointer
    pointer(frame, "pointermove", box.right - 4, box.top + 120);
    await settle();
    const edge = camera(host);
    expect(edge.x).not.toBe(middle.x);

    pointer(frame, "pointerup", box.right - 4, box.top + 120);
    await settle();
  });

  it("keeps pulling while the pointer rests at the edge, and stops on release", async () => {
    const host = mount();
    const frame = part<HTMLElement>(host, "canvas-frame");
    const box = frame.getBoundingClientRect();
    const card = part<HTMLElement>(host, "canvas-card");
    const start = card.getBoundingClientRect();

    pointer(frame, "pointerdown", start.left + 20, start.top + 20);
    pointer(frame, "pointermove", box.right - 6, box.top + 160);
    await settle();
    const armed = camera(host).x;

    // no further moves: the loop is what keeps the camera going while the pointer is held in the margin
    for (let i = 0; i < 6; i += 1) {
      await frames();
    }
    const pulled = camera(host).x;
    expect(pulled).not.toBe(armed);

    pointer(frame, "pointerup", box.right - 6, box.top + 160);
    await settle();
    const released = camera(host).x;
    for (let i = 0; i < 6; i += 1) {
      await frames();
    }
    expect(camera(host).x).toBe(released);
  });
});
