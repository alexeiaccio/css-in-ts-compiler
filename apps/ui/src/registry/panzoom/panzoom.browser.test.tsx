import { createMachine, harness } from "@cssints/machine";
import { createMachineStore } from "@cssints/machine/solid";
import { createEffect, createRoot, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { PANZOOM_FLING_VELOCITY, panzoomGlideDefinition } from "./panzoom-glide.ts";
import { type MountedPanzoom, type MountPanzoomOptions, mountPanzoom } from "./panzoom.fixture";

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

const mounted = (options: MountPanzoomOptions = {}): MountedPanzoom => {
  const instance = mountPanzoom(options);
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

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * A real gesture in real time: the pointer is down, moves once after `ms`, and lifts `ms` later, so `timeStamp` gives the
 * release the velocity `dx / ms` (px/ms). The glide's own frames are the fixture's queue, not the browser's.
 */
const flick = async (
  viewport: HTMLElement,
  from: readonly [number, number],
  dx: number,
  dy: number,
  ms: number,
): Promise<void> => {
  pointer(viewport, "pointerdown", from);
  await sleep(ms);
  pointer(viewport, "pointermove", [from[0] + dx, from[1] + dy]);
  await sleep(ms);
  pointer(viewport, "pointerup", [from[0] + dx, from[1] + dy]);
  await settle();
};

/** Step the glide's frame queue, flushing Solid's transform after each frame. */
const stepFrames = async (instance: MountedPanzoom, count = 1): Promise<void> => {
  for (let index = 0; index < count; index += 1) {
    instance.frames.step();
    await settle();
  }
};

/** The offset in the image's transform, in px. */
const translate = (root: ParentNode): { x: number; y: number } => {
  const match = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(transform(root));
  if (match === null) {
    throw new Error(`panzoom: no translate in "${transform(root)}"`);
  }
  return { x: Number(match[1]), y: Number(match[2]) };
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

describe("Panzoom x the glide (machine)", () => {
  const start = () => harness(panzoomGlideDefinition(false));

  it("a slow release lands at rest with no effect, and a fast one glides", () => {
    const slow = start();
    slow.send({ type: "fling", vx: PANZOOM_FLING_VELOCITY / 2, vy: 0 });
    expect(slow.machine.getState().state).toBe("rest");
    expect(slow.machine.getState().context).toEqual({ vx: 0, vy: 0 });
    expect(slow.machine.effects()).toEqual([]);
    expect(slow.flushEffects()).toEqual([]);

    const fast = start();
    fast.send({ type: "fling", vx: 2, vy: -0.5 });
    expect(fast.machine.getState().state).toBe("gliding");
    expect(fast.machine.getState().context).toEqual({ vx: 2, vy: -0.5 });
    expect(fast.flushEffects().map((handle) => handle.type)).toEqual(["glide"]);
  });

  it("a frame is one tick: it issues the next frame and decays the velocity", () => {
    const h = start();
    h.send({ type: "fling", vx: 2, vy: -0.5 });
    const first = h.flushEffects()[0];
    if (first === undefined) {
      throw new Error("the fling issued no glide");
    }

    h.send({ type: "frame", id: first.id });
    expect(h.machine.getState().state).toBe("gliding");
    expect(h.machine.getState().context.vx).toBeLessThan(2);
    expect(h.machine.getState().context.vy).toBeGreaterThan(-0.5);

    const second = h.flushEffects()[0];
    expect(second?.type).toBe("glide");
    expect(second?.id).not.toBe(first.id);
    expect(h.machine.effects().map((handle) => handle.id)).toEqual([second?.id]);
  });

  it("a grab stops the glide, and a frame already in flight moves nothing", () => {
    const h = start();
    h.send({ type: "fling", vx: 2, vy: 0 });
    const live = h.machine.effects()[0];
    if (live === undefined) {
      throw new Error("the fling issued no glide");
    }

    h.send({ type: "grab" });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.getState().context).toEqual({ vx: 0, vy: 0 });
    expect(h.cancelled()).toEqual([live.id]);
    expect(h.machine.effects()).toEqual([]);

    // the frame the cancelled effect had already asked for: its id is dead before any transition is looked at
    h.send({ type: "frame", id: live.id });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.log.at(-1)).toMatchObject({ event: "frame", to: undefined, cancelled: true });
  });

  it("a glide the clamp has caught stops at rest on the host's stop", () => {
    const h = start();
    h.send({ type: "fling", vx: 4, vy: 0 });
    const live = h.machine.effects()[0];
    if (live === undefined) {
      throw new Error("the fling issued no glide");
    }

    h.send({ type: "stop" });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.getState().context).toEqual({ vx: 0, vy: 0 });
    expect(h.cancelled()).toEqual([live.id]);
    expect(h.machine.effects()).toEqual([]);
  });

  it("a take-over (the reader's key) stops the glide where it is", () => {
    const h = start();
    h.send({ type: "fling", vx: 1.5, vy: 0 });
    const live = h.machine.effects()[0];
    if (live === undefined) {
      throw new Error("the fling issued no glide");
    }

    h.send({ type: "stop" });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.cancelled()).toEqual([live.id]);
    // a frame the stopped loop still had in flight carries the dead id and is dropped
    h.send({ type: "frame", id: live.id });
    expect(h.log.at(-1)).toMatchObject({ event: "frame", to: undefined, cancelled: true });
  });

  it("under reduced motion a flick lands at rest with no loop at all", () => {
    const h = harness(panzoomGlideDefinition(true));
    h.send({ type: "fling", vx: 10, vy: 10 });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.getState().context).toEqual({ vx: 0, vy: 0 });
    expect(h.machine.effects()).toEqual([]);
    expect(h.log.filter((entry) => entry.effect !== undefined)).toEqual([]);
  });

  it("destroying the machine cancels the live frame", () => {
    const h = start();
    h.send({ type: "fling", vx: 1, vy: 0 });
    const live = h.machine.effects()[0];
    if (live === undefined) {
      throw new Error("the fling issued no glide");
    }

    h.machine.destroy();
    expect(h.cancelled()).toEqual([live.id]);
    expect(h.machine.effects()).toEqual([]);
  });

  it("writes the velocity every frame but not the phase: a phase reader does not re-run", () => {
    const machine = createMachine(panzoomGlideDefinition(false));
    let phaseRuns = 0;
    let velocityRuns = 0;
    const dispose = createRoot((stop) => {
      const store = createMachineStore(machine);
      createEffect(
        () => store.state.phase,
        () => {
          phaseRuns += 1;
        },
      );
      createEffect(
        () => store.state.vx,
        () => {
          velocityRuns += 1;
        },
      );
      createEffect(
        () => store.state.vy,
        () => {
          velocityRuns += 1;
        },
      );
      flush();
      return stop;
    });
    flush();

    const atRest = phaseRuns;
    machine.send({ type: "fling", vx: 2, vy: 0 });
    flush();
    expect(phaseRuns).toBe(atRest + 1);
    const moving = phaseRuns;
    const velocities = velocityRuns;

    for (let index = 0; index < 3; index += 1) {
      const live = machine.effects()[0];
      if (live === undefined) {
        throw new Error("the fling issued no glide");
      }
      machine.send({ type: "frame", id: live.id });
      flush();
    }
    expect(phaseRuns).toBe(moving);
    expect(velocityRuns).toBeGreaterThan(velocities);

    machine.send({ type: "grab" });
    flush();
    expect(phaseRuns).toBe(moving + 1);
    dispose();
  });
});

describe("Panzoom x the glide (real DOM)", () => {
  /** A frame that starts zoomed in: at `min` the clamp leaves nothing to pan, so nothing to glide. */
  const zoomed = (options: MountPanzoomOptions = {}): MountedPanzoom =>
    mounted({ defaultScale: 2, ...options });

  it("a grab takes the glide back where the last frame left it, and the drag continues from there", async () => {
    const instance = zoomed();
    const root = instance.root;
    const viewport = part(root, "panzoom-viewport");
    const centre = at(viewport, 240, 135);
    await flick(viewport, centre, 40, 0, 30);
    expect(viewport.getAttribute("data-gliding")).toBe("true");
    expect(instance.frames.pending()).toBe(1);

    await stepFrames(instance, 2);
    const glided = translate(root);
    expect(glided.x).toBeGreaterThan(40);

    pointer(viewport, "pointerdown", centre);
    await settle();
    expect(viewport.getAttribute("data-gliding")).toBeNull();
    expect(instance.frames.pending()).toBe(0);
    const grabbed = translate(root);
    // exactly the offset the last frame wrote: no jump back to the release, no jump to the drag's own origin
    expect(grabbed).toEqual(glided);

    await stepFrames(instance, 3);
    expect(translate(root)).toEqual(grabbed);

    // the drag continues from the grabbed offset: the pointer's own +12 px, not a rewind
    pointer(viewport, "pointermove", [centre[0] + 12, centre[1]]);
    await settle();
    expect(translate(root).x).toBeCloseTo(grabbed.x + 12, 3);
    pointer(viewport, "pointerup", [centre[0] + 12, centre[1]]);
  });

  it("does not fling a slow drag, and flings a fast one", async () => {
    const slow = zoomed();
    const slowViewport = part(slow.root, "panzoom-viewport");
    await flick(slowViewport, at(slowViewport, 240, 135), 10, 0, 60);
    expect(slowViewport.getAttribute("data-gliding")).toBeNull();
    expect(slow.frames.pending()).toBe(0);
    const rest = translate(slow.root);
    await stepFrames(slow, 3);
    expect(translate(slow.root)).toEqual(rest);

    const fast = zoomed();
    const fastViewport = part(fast.root, "panzoom-viewport");
    await flick(fastViewport, at(fastViewport, 240, 135), 40, 0, 30);
    expect(fastViewport.getAttribute("data-gliding")).toBe("true");
    expect(fast.frames.pending()).toBe(1);
    await stepFrames(fast, 1);
    expect(translate(fast.root).x).toBeGreaterThan(40);
  });

  it("stops at the clamp without overshooting, and the picture still covers the frame", async () => {
    const instance = zoomed();
    const root = instance.root;
    const viewport = part(root, "panzoom-viewport");
    await flick(viewport, at(viewport, 240, 135), 200, 0, 20);
    expect(viewport.getAttribute("data-gliding")).toBe("true");

    for (let index = 0; index < 20 && instance.frames.pending() > 0; index += 1) {
      await stepFrames(instance, 1);
    }
    expect(viewport.getAttribute("data-gliding")).toBeNull();
    expect(instance.frames.pending()).toBe(0);
    // half the scaled overflow: 480 * (2 - 1) / 2
    expect(transform(root)).toBe("translate(240px, 0px) scale(2)");

    const frame = viewport.getBoundingClientRect();
    const picture = image(root).getBoundingClientRect();
    expect(picture.left).toBeLessThanOrEqual(frame.left + 0.01);
    expect(picture.top).toBeLessThanOrEqual(frame.top + 0.01);
    expect(picture.right).toBeGreaterThanOrEqual(frame.right - 0.01);
    expect(picture.bottom).toBeGreaterThanOrEqual(frame.bottom - 0.01);

    const landed = translate(root);
    await stepFrames(instance, 3);
    expect(translate(root)).toEqual(landed);
  });

  it("moves nothing when a frame outlives the effect that asked for it", async () => {
    const instance = zoomed();
    const root = instance.root;
    const viewport = part(root, "panzoom-viewport");
    const centre = at(viewport, 240, 135);
    await flick(viewport, centre, 40, 0, 30);
    const live = instance.glide().machine.effects()[0];
    if (live === undefined) {
      throw new Error("the fling issued no glide");
    }
    // the frame the browser had already dispatched when the pointer went down
    const [late] = instance.frames.take();

    pointer(viewport, "pointerdown", centre);
    await settle();
    const grabbed = translate(root);
    late?.(1000);
    await settle();
    expect(translate(root)).toEqual(grabbed);
    expect(viewport.getAttribute("data-gliding")).toBeNull();

    // and the machine drops a frame whose handle is dead: no transition, no store write, no movement
    instance.glide().machine.send({ type: "frame", id: live.id });
    await settle();
    expect(instance.glide().machine.getState().state).toBe("rest");
    expect(translate(root)).toEqual(grabbed);
    pointer(viewport, "pointerup", centre);
  });

  it("never starts a loop under prefers-reduced-motion", async () => {
    const instance = zoomed({ reducedMotion: true });
    const root = instance.root;
    const viewport = part(root, "panzoom-viewport");
    await flick(viewport, at(viewport, 240, 135), 120, 0, 30);
    expect(viewport.getAttribute("data-gliding")).toBeNull();
    expect(instance.frames.pending()).toBe(0);

    const landed = translate(root);
    await stepFrames(instance, 4);
    expect(translate(root)).toEqual(landed);
  });

  it("cancels the frame loop when the picture unmounts", async () => {
    const instance = mountPanzoom({ defaultScale: 2 });
    const viewport = part(instance.root, "panzoom-viewport");
    await flick(viewport, at(viewport, 240, 135), 40, 0, 30);
    expect(instance.frames.pending()).toBe(1);
    // the element outlives the render: its own style is still readable after the dispose
    const picture = image(instance.root);
    const release = picture.style.transform;

    instance.dispose();
    expect(instance.frames.pending()).toBe(0);
    instance.frames.step(100);
    flush();
    expect(picture.style.transform).toBe(release);
  });

  it("stops the glide when a key takes over", async () => {
    const instance = zoomed();
    const root = instance.root;
    const viewport = part(root, "panzoom-viewport");
    await flick(viewport, at(viewport, 240, 135), 40, 0, 30);
    const moved = translate(root);

    await press(viewport, "ArrowRight");
    expect(viewport.getAttribute("data-gliding")).toBeNull();
    expect(instance.frames.pending()).toBe(0);
    const after = translate(root);
    expect(after.x).toBeCloseTo(moved.x + 24, 3);

    await stepFrames(instance, 3);
    expect(translate(root)).toEqual(after);
  });
});
