import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedPanzoom, mountPanzoom } from "./panzoom.fixture";

// No APG pattern and no Quint spec exists for pan-zoom, so this file is the skin's oracle: it mounts the starter in a real
// Chromium, at a 480 px frame, and drives the same events a reader does. The accessible contract (a focusable named
// viewport, keys for every gesture, a live value) is only observable through the DOM, so nothing here reaches into the
// primitive except through the elements.
//
// The frame is 480 x 270 (the image is 16:9): at scale 1.5 the clamp is (120, 67.5), at 2 it is (240, 135), and an arrow
// step at 24 px is a whole number.

/** Solid 2 applies setters on the next flush, and the transform follows the flush: two frames settle both. */
const settle = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const live: MountedPanzoom[] = [];

const mounted = (): MountedPanzoom => {
  const instance = mountPanzoom();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const part = <T extends HTMLElement>(root: ParentNode, name: string): T => {
  const element = root.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`panzoom: no ${name}`);
  }
  return element;
};

const image = (root: ParentNode): HTMLImageElement => part<HTMLImageElement>(root, "panzoom-image");
const value = (root: ParentNode): HTMLElement => part(root, "panzoom-value");
const transform = (root: ParentNode): string => image(root).style.transform;

/** A key on the viewport, as a reader's would arrive. */
const press = async (
  viewport: HTMLElement,
  key: string,
  init: KeyboardEventInit = {},
): Promise<void> => {
  viewport.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
  );
  await settle();
};

const click = async (element: HTMLElement): Promise<void> => {
  element.click();
  await settle();
};

const button = (root: ParentNode, label: string): HTMLButtonElement => {
  const found = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (element) => element.textContent?.trim() === label,
  );
  if (found === undefined) {
    throw new Error(`panzoom: no button "${label}"`);
  }
  return found;
};

const pointer = (
  viewport: HTMLElement,
  type: string,
  at: readonly [number, number],
  pointerId = 9,
): void => {
  viewport.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: at[0],
      clientY: at[1],
    }),
  );
};

/** A point in the viewport, in client coordinates. */
const at = (viewport: HTMLElement, x: number, y: number): [number, number] => {
  const rect = viewport.getBoundingClientRect();
  return [rect.left + x, rect.top + y];
};

describe("Panzoom", () => {
  it("makes the frame a focusable, named viewport with a live value", () => {
    const { root } = mounted();
    const viewport = part(root, "panzoom-viewport");
    const readout = value(root);

    expect(viewport.tabIndex).toBe(0);
    expect(viewport.getAttribute("role")).toBe("group");
    expect(viewport.getAttribute("aria-roledescription")).toBe("zoomable image");
    expect(viewport.getAttribute("aria-label")).toBe("A mountain lake at dusk");
    expect(viewport.getAttribute("aria-describedby")).toBe(readout.id);
    expect(readout.getAttribute("role")).toBe("status");
    expect(readout.getAttribute("aria-live")).toBe("polite");
    expect(readout.textContent).toBe("100%");

    viewport.focus();
    expect(document.activeElement).toBe(viewport);
  });

  it("zooms with + and -, and returns to 100% with 0", async () => {
    const { root } = mounted();
    const viewport = part(root, "panzoom-viewport");

    await press(viewport, "+");
    expect(value(root).textContent).toBe("125%");
    expect(transform(root)).toBe("translate(0px, 0px) scale(1.25)");

    await press(viewport, "-");
    expect(value(root).textContent).toBe("100%");
    // an unhandled key stays the page's
    expect(
      viewport.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
      ),
    ).toBe(true);

    await press(viewport, "+");
    await press(viewport, "ArrowRight");
    await press(viewport, "0");
    expect(value(root).textContent).toBe("100%");
    expect(transform(root)).toBe("translate(0px, 0px) scale(1)");
  });

  it("pans with the arrows, and clamps at the edge of the frame", async () => {
    const { root } = mounted();
    const viewport = part(root, "panzoom-viewport");
    await press(viewport, "+");
    await press(viewport, "+");

    await press(viewport, "ArrowRight");
    await press(viewport, "ArrowDown");
    expect(transform(root)).toBe("translate(24px, 24px) scale(1.5)");

    // Shift pans four steps at once; 120 px is half the overflow at 1.5, so the second half of it stops at the frame
    await press(viewport, "ArrowRight", { shiftKey: true });
    await press(viewport, "ArrowRight", { shiftKey: true });
    expect(transform(root)).toBe("translate(120px, 24px) scale(1.5)");
  });

  it("resets the scale and the pan on a double click", async () => {
    const { root } = mounted();
    const viewport = part(root, "panzoom-viewport");
    await press(viewport, "+");
    await press(viewport, "+");
    await press(viewport, "ArrowRight");

    viewport.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    await settle();

    expect(value(root).textContent).toBe("100%");
    expect(transform(root)).toBe("translate(0px, 0px) scale(1)");
  });

  it("pans with a pointer drag and stops when the pointer lifts", async () => {
    const { root } = mounted();
    const viewport = part(root, "panzoom-viewport");
    await click(button(root, "Zoom in"));

    pointer(viewport, "pointerdown", at(viewport, 240, 135));
    pointer(viewport, "pointermove", at(viewport, 260, 145));
    await settle();
    expect(transform(root)).toBe("translate(20px, 10px) scale(1.25)");

    pointer(viewport, "pointerup", at(viewport, 260, 145));
    pointer(viewport, "pointermove", at(viewport, 440, 300));
    await settle();
    expect(transform(root)).toBe("translate(20px, 10px) scale(1.25)");
  });

  it("keeps the image covering the frame, however far it is dragged", async () => {
    const { root } = mounted();
    const viewport = part(root, "panzoom-viewport");
    for (let i = 0; i < 4; i += 1) {
      await click(button(root, "Zoom in"));
    }
    expect(value(root).textContent).toBe("200%");

    pointer(viewport, "pointerdown", at(viewport, 240, 135));
    pointer(viewport, "pointermove", at(viewport, 740, 535));
    await settle();
    // half the scaled overflow: 480 * (2 - 1) / 2 and 270 * (2 - 1) / 2
    expect(transform(root)).toBe("translate(240px, 135px) scale(2)");
    pointer(viewport, "pointerup", at(viewport, 740, 535));
  });

  it("zooms and resets from the controls, with the live value following", async () => {
    const { root } = mounted();
    const zoomIn = button(root, "Zoom in");
    const zoomOut = button(root, "Zoom out");
    const reset = button(root, "Reset");

    await click(zoomIn);
    expect(value(root).textContent).toBe("125%");
    expect(transform(root)).toBe("translate(0px, 0px) scale(1.25)");

    await click(zoomOut);
    expect(value(root).textContent).toBe("100%");

    await click(zoomIn);
    await click(zoomIn);
    expect(value(root).textContent).toBe("150%");
    await click(reset);
    expect(value(root).textContent).toBe("100%");
    expect(transform(root)).toBe("translate(0px, 0px) scale(1)");
  });
});
