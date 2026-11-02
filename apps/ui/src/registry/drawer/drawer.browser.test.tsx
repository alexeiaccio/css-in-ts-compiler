import { createMachine, harness } from "@cssints/machine";
import { createMachineStore } from "@cssints/machine/solid";
import { createEffect, createRoot, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { overlayMotionDefinition } from "../overlay-motion.ts";
import {
  bottomSheetDragDefinition,
  SHEET_DISMISS_DISTANCE,
  SHEET_DISMISS_VELOCITY,
} from "./drawer.tsx";
import {
  type MountAnimatedDrawerOptions,
  type MountedDrawer,
  type MountedMotionDrawer,
  mountAnimatedDrawer,
  mountDrawer,
} from "./drawer.fixture";

/** Solid 2 delivers events through its delegated listener on a later turn. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

/** The slide is 200 ms: the geometry is final only after it, as a reader sees it. */
const settleSlide = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 260));

const live: MountedDrawer[] = [];

const mounted = (): MountedDrawer => {
  const instance = mountDrawer();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends HTMLElement>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`drawer: no ${selector}`);
  }
  return element;
};

/** The trigger of a drawer, by its label: the fixture has one per drawer. */
const trigger = (root: HTMLElement, label: string): HTMLButtonElement => {
  const found = [...root.querySelectorAll<HTMLButtonElement>('[aria-haspopup="dialog"]')].find(
    (element) => element.textContent?.trim() === label,
  );
  if (found === undefined) {
    throw new Error(`drawer: no trigger "${label}"`);
  }
  return found;
};

/** A panel by the text of its title: both drawers are in the DOM, closed ones included. */
const panel = (title: string): HTMLElement => {
  const found = [...document.querySelectorAll<HTMLElement>('[data-part="drawer"]')].find(
    (element) => element.querySelector('[data-part="drawer-title"]')?.textContent === title,
  );
  if (found === undefined) {
    throw new Error(`drawer: no panel "${title}"`);
  }
  return found;
};

const inside = (root: HTMLElement, name: string): HTMLElement =>
  required(root, `[data-part="${name}"]`);

const click = async (element: HTMLElement): Promise<void> => {
  element.click();
  await settle();
};

/** A key on whatever holds the focus, as a reader's would arrive. */
const press = async (key: string, init: KeyboardEventInit = {}): Promise<void> => {
  const target =
    document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
  );
  await settle();
};

const background = (token: string): string => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
};

describe("Drawer", () => {
  it("opens from its trigger as a modal dialog", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    const dialog = panel("Filters");

    expect(open.getAttribute("aria-expanded")).toBe("false");
    expect(open.getAttribute("aria-controls")).toBe(dialog.id);
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBeNull();
    // a closed rail is off screen and out of the accessibility tree, not in the page's flow
    expect(getComputedStyle(dialog).visibility).toBe("hidden");

    open.focus();
    await click(open);

    expect(open.getAttribute("aria-expanded")).toBe("true");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("data-state")).toBe("right-open");
    expect(getComputedStyle(dialog).visibility).toBe("visible");
    // portalled out of the fixture, into the body, so no ancestor can clip it or hold its `position: fixed`
    expect(root.contains(dialog)).toBe(false);
    expect(dialog.closest('[data-part="drawer-layer"]')?.parentElement).toBe(document.body);
  });

  it("names the panel by its title", async () => {
    const { root } = mounted();
    await click(trigger(root, "Filters"));
    const dialog = panel("Filters");
    const title = inside(dialog, "drawer-title");

    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(title.textContent).toBe("Filters");
    // the close control is an icon button with an accessible name
    expect(inside(dialog, "drawer-close").getAttribute("aria-label")).toBe("Close");
  });

  it("moves the focus into the panel, keeps Tab inside, and returns it on Escape", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    open.focus();
    await click(open);
    const dialog = panel("Filters");
    const close = inside(dialog, "drawer-close");
    const footerButtons = [
      ...inside(dialog, "drawer-footer").querySelectorAll<HTMLButtonElement>("button"),
    ];
    const last = footerButtons[footerButtons.length - 1];
    if (last === undefined) {
      throw new Error("drawer: no footer button");
    }

    expect(document.activeElement).toBe(close);

    last.focus();
    await press("Tab");
    expect(document.activeElement).toBe(close);

    close.focus();
    await press("Tab", { shiftKey: true });
    expect(document.activeElement).toBe(last);

    await press("Escape");
    expect(open.getAttribute("aria-expanded")).toBe("false");
    expect(dialog.getAttribute("aria-modal")).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it("closes on a press on the backdrop", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    open.focus();
    await click(open);
    const backdrop = required<HTMLElement>(document, '[data-part="drawer-backdrop"]');

    expect(backdrop.hidden).toBe(false);
    backdrop.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    await settle();

    expect(open.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(open);
  });

  it("locks the page's scroll while open and releases it on close", async () => {
    const { root } = mounted();
    const open = trigger(root, "Filters");
    expect(document.documentElement.style.overflow).toBe("");

    await click(open);
    expect(document.documentElement.style.overflow).toBe("hidden");

    await press("Escape");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("renders the bottom variant as a full-width sheet on its own surface", async () => {
    const { root } = mounted();
    await click(trigger(root, "Open the sheet"));
    await settleSlide();
    const sheet = panel("Share");
    const style = getComputedStyle(sheet);
    const rect = sheet.getBoundingClientRect();

    // the top corners are the theme's radius, the bottom ones meet the viewport edge
    expect(style.borderTopLeftRadius).not.toBe("0px");
    expect(style.borderTopRightRadius).not.toBe("0px");
    expect(style.borderBottomLeftRadius).toBe("0px");
    expect(Math.round(rect.left)).toBe(0);
    expect(Math.round(rect.width)).toBe(window.innerWidth);
    expect(Math.round(rect.bottom)).toBe(window.innerHeight);
    expect(style.maxHeight).not.toBe("none");
    // the sheet's surface is a token of its own, not the rail's
    expect(style.backgroundColor).toBe(background("--color-sheet-background"));
  });

  it("lets a controlled host refuse to close", async () => {
    const instance = mounted();
    const open = trigger(instance.root, "Filters");
    await click(open);
    expect(open.getAttribute("aria-expanded")).toBe("true");

    instance.hold();
    await press("Escape");

    expect(instance.requests.at(-1)).toBe(false);
    expect(open.getAttribute("aria-expanded")).toBe("true");
    expect(panel("Filters").getAttribute("aria-modal")).toBe("true");
  });
});

// The animated drawer is the same primitive and the same box as the dialog (`apps/ui/.../overlay-motion.ts`), so its
// harness cases are the protocol's own here as well: what differs between the two components is the skin.
const animated: MountedMotionDrawer[] = [];

const animatedDrawer = (options: MountAnimatedDrawerOptions = {}): MountedMotionDrawer => {
  const instance = mountAnimatedDrawer(options);
  animated.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of animated.splice(0)) {
    instance.dispose();
  }
});

const openTheDrawer = async (instance: MountedMotionDrawer): Promise<void> => {
  instance.trigger().focus();
  instance.trigger().click();
  await settle();
  instance.finish();
  await settle();
};

describe("Drawer x the animated box (harness)", () => {
  it("a close during the close is a superseded intent, not a second effect", () => {
    const h = harness(overlayMotionDefinition(false));
    h.send({ type: "open" });
    h.send({ type: "finish", id: h.machine.effects()[0]?.id ?? 0 });
    h.send({ type: "close" });
    const leaving = h.machine.effects()[0]?.id;
    h.send({ type: "close" });
    h.send({ type: "close" });
    expect(h.machine.getState().state).toBe("leaving");
    expect(h.machine.effects().map((handle) => handle.id)).toEqual([leaving]);
  });

  it("reduced motion has no leaving phase to animate", () => {
    const h = harness(overlayMotionDefinition(true));
    h.send({ type: "open" });
    h.send({ type: "close" });
    expect(h.log.map((entry) => entry.to)).toEqual(["open", "closed"]);
    expect(h.machine.effects()).toEqual([]);
  });
});

describe("Drawer x the animated box (real DOM)", () => {
  it("slides the panel out through leaving and unmounts it only at closed", async () => {
    const instance = animatedDrawer();
    expect(instance.layer()).toBeNull();

    instance.trigger().focus();
    instance.trigger().click();
    await settle();
    expect(instance.phase()).toBe("right-entering");
    const panel = instance.panel();
    expect(panel).not.toBeNull();
    // the primitive moves the focus into the panel it finds by id: the layer mounts in the same flush
    expect(panel?.contains(document.activeElement)).toBe(true);

    instance.finish();
    await settle();
    expect(instance.phase()).toBe("right-open");
    expect(getComputedStyle(panel as HTMLElement).visibility).toBe("visible");

    await press("Escape");
    expect(instance.phase()).toBe("right-leaving");
    expect(instance.panel()).toBe(panel);
    expect(instance.layer()).not.toBeNull();
    expect(getComputedStyle(panel as HTMLElement).visibility).not.toBe("hidden");

    instance.finish();
    await settle();
    expect(instance.panel()).toBeNull();
    expect(instance.layer()).toBeNull();
    expect(instance.phases()).toEqual(["right-entering", "right-open", "right-leaving"]);
  });

  it("slides a bottom sheet along its own edge", async () => {
    const instance = animatedDrawer({ side: "bottom" });
    instance.trigger().focus();
    instance.trigger().click();
    await settle();
    const animation = instance.animations().at(-1);
    const frames = (animation?.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
    expect(frames[0]?.transform).toBe("translate(0%, 100%)");
    expect(frames.at(-1)?.transform).toBe("translate(0%, 0%)");
    expect(instance.phase()).toBe("bottom-entering");
  });

  it("gives the focus back once and starts no second close on an Escape during the close", async () => {
    const instance = animatedDrawer({ controlled: true });
    await openTheDrawer(instance);
    expect(instance.requests).toEqual([true]);
    const base = instance.focuses();

    await press("Escape");
    expect(instance.phase()).toBe("right-leaving");
    expect(instance.focuses()).toBe(base + 1);
    const started = instance.animations().length;

    await press("Escape");
    expect(instance.phase()).toBe("right-leaving");
    expect(instance.focuses()).toBe(base + 1);
    expect(instance.animations()).toHaveLength(started);
    // one dismissal, one request
    expect(instance.requests).toEqual([true, false]);
  });

  it("reverses a closing drawer from where it stopped", async () => {
    const instance = animatedDrawer();
    await openTheDrawer(instance);
    const panel = instance.panel();

    await press("Escape");
    instance.seek(0.25);
    instance.trigger().click();
    await settle();

    expect(instance.phase()).toBe("right-entering");
    expect(instance.animations().at(-1)?.id.split(":")[0]).toBe("0.25");
    expect(instance.panel()).toBe(panel);

    await settle();
    expect(instance.phase()).toBe("right-entering");
  });

  it("closes in one step with reduced motion", async () => {
    const instance = animatedDrawer({ reducedMotion: true });
    instance.trigger().focus();
    instance.trigger().click();
    await settle();
    expect(instance.phase()).toBe("right-open");
    expect(instance.animations()).toEqual([]);

    await press("Escape");
    expect(instance.panel()).toBeNull();
    expect(instance.phases()).toEqual(["right-open"]);
  });

  it("asks the host once for a backdrop click and an Escape in the same frame", async () => {
    const instance = animatedDrawer({ controlled: true });
    await openTheDrawer(instance);
    const base = instance.focuses();
    const wash = document.querySelector<HTMLElement>('[data-part="drawer-backdrop"]');
    if (wash === null) {
      throw new Error("drawer: no backdrop");
    }
    wash.click();
    await press("Escape");
    expect(instance.requests).toEqual([true, false]);
    expect(instance.focuses()).toBe(base + 1);
  });

  it("keeps a leaving panel painted and out of the pointer", async () => {
    const instance = animatedDrawer();
    await openTheDrawer(instance);
    const layer = instance.layer();
    const panel = instance.panel();
    if (layer === null || panel === null) {
      return;
    }
    expect(getComputedStyle(panel).pointerEvents).toBe("auto");

    await press("Escape");
    expect(panel.hasAttribute("hidden")).toBe(false);
    expect(getComputedStyle(panel).display).not.toBe("none");
    expect(getComputedStyle(panel).pointerEvents).toBe("none");
  });
});

// The sheet's drag is the kit's, not the primitive's: it starts from the grab handle and runs on its own machine beside
// the overlay's. The harness proves the protocol (plain JS, no browser); the DOM cases below are what the panel and the
// one leave animation really did.
describe("Drawer x the sheet's drag (harness)", () => {
  const start = (
    h: { send: (event: { readonly type: "grab"; readonly offset: number }) => void },
    offset = 0,
  ): void => {
    h.send({ type: "grab", offset });
  };

  it("a release below the threshold snaps back from the offset it holds", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "move", offset: 40 });
    h.send({ type: "release", velocity: 0 });

    expect(h.machine.getState().state).toBe("settling");
    expect(h.machine.getState().context.offset).toBe(40);
    const issued = h.machine.effects();
    expect(issued.map((handle) => handle.type)).toEqual(["settle"]);
    // no dismissal: the only effect belongs to settling
    expect(h.log.some((entry) => entry.to === "rest" && entry.effect !== undefined)).toBe(false);

    h.send({ type: "finish", id: issued[0]?.id ?? 0 });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.getState().context.offset).toBe(0);
    expect(h.machine.effects()).toEqual([]);
  });

  it("a release past the distance dismisses through one dismiss effect and no settle", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "move", offset: SHEET_DISMISS_DISTANCE });
    h.send({ type: "release", velocity: 0 });

    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.getState().context.offset).toBe(0);
    expect(h.machine.effects().map((handle) => handle.type)).toEqual(["dismiss"]);
    // one dismissal, not a leave plus a snap-back
    expect(h.log.some((entry) => entry.effect !== undefined && entry.to === "settling")).toBe(
      false,
    );

    // a second release in the same frame is not a transition: the machine is already at rest
    h.send({ type: "release", velocity: 1 });
    expect(h.machine.effects().map((handle) => handle.type)).toEqual(["dismiss"]);
  });

  it("a fast flick dismisses below the distance", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "move", offset: 24 });
    h.send({ type: "release", velocity: SHEET_DISMISS_VELOCITY + 0.5 });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.effects().map((handle) => handle.type)).toEqual(["dismiss"]);
    expect(h.machine.getState().context.velocity).toBe(SHEET_DISMISS_VELOCITY + 0.5);
  });

  it("a grab during the snap-back continues from the offset it is handed (ReversalKeepsPosition)", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "move", offset: 120 });
    h.send({ type: "release", velocity: 0 });
    const first = h.machine.effects()[0];
    if (first === undefined) {
      throw new Error("the release issued no settle");
    }

    // the host reads the running animation's position before cancelling it and sends it with the grab
    h.send({ type: "grab", offset: 60 });
    expect(h.machine.getState().state).toBe("dragging");
    expect(h.machine.getState().context.offset).toBe(60);
    expect(h.cancelled()).toEqual([first.id]);
    expect(h.machine.effects()).toEqual([]);

    h.send({ type: "release", velocity: 0 });
    expect(h.machine.getState().state).toBe("settling");
    expect(h.machine.getState().context.offset).toBe(60);
    expect(h.machine.effects()[0]?.id).not.toBe(first.id);
  });

  it("a stale finish of a cancelled settle moves nothing", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "move", offset: 120 });
    h.send({ type: "release", velocity: 0 });
    const stale = h.machine.effects()[0];
    if (stale === undefined) {
      throw new Error("the release issued no settle");
    }
    h.send({ type: "grab", offset: 60 });
    h.send({ type: "finish", id: stale.id });

    expect(h.machine.getState().state).toBe("dragging");
    expect(h.machine.getState().context.offset).toBe(60);
    expect(h.machine.effects()).toEqual([]);
    expect(h.log.at(-1)?.event).toBe("finish");
    expect(h.log.at(-1)?.cancelled).toBe(true);
  });

  it("Escape during the drag snaps back, issues no dismissal, and a second Escape does not restart it", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "move", offset: 80 });
    h.send({ type: "cancel" });

    expect(h.machine.getState().state).toBe("settling");
    expect(h.machine.getState().context.offset).toBe(80);
    const settle = h.machine.effects()[0];
    expect(settle?.type).toBe("settle");
    expect(h.machine.effects().some((handle) => handle.type === "dismiss")).toBe(false);

    // settling has no cancel: the snap-back that is running is the coalescer
    h.send({ type: "cancel" });
    expect(h.machine.getState().state).toBe("settling");
    expect(h.machine.effects()[0]?.id).toBe(settle?.id);
  });

  it("a reset (the overlay is no longer open) drops the drag without a second animation", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "move", offset: 80 });
    h.send({ type: "release", velocity: 0 });
    const settle = h.machine.effects()[0];
    if (settle === undefined) {
      throw new Error("the release issued no settle");
    }
    h.send({ type: "reset" });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.getState().context.offset).toBe(0);
    expect(h.cancelled()).toEqual([settle.id]);
    expect(h.machine.effects()).toEqual([]);
  });

  it("a tap on the handle does nothing", () => {
    const h = harness(bottomSheetDragDefinition(false));
    start(h);
    h.send({ type: "release", velocity: 0 });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.getState().context.offset).toBe(0);
    expect(h.machine.effects()).toEqual([]);
    expect(h.log.filter((entry) => entry.effect !== undefined)).toEqual([]);
  });

  it("reduced motion lands a snap-back in one step and still dismisses a pull", () => {
    const h = harness(bottomSheetDragDefinition(true));
    start(h);
    h.send({ type: "move", offset: 40 });
    h.send({ type: "release", velocity: 0 });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.effects()).toEqual([]);

    start(h);
    h.send({ type: "move", offset: SHEET_DISMISS_DISTANCE });
    h.send({ type: "release", velocity: 0 });
    expect(h.machine.getState().state).toBe("rest");
    expect(h.machine.effects().map((handle) => handle.type)).toEqual(["dismiss"]);
  });

  it("writes one store field at a time: a phase reader does not re-run when the offset moves", () => {
    const machine = createMachine(bottomSheetDragDefinition(false));
    let phaseRuns = 0;
    let offsetRuns = 0;
    const dispose = createRoot((stop) => {
      const store = createMachineStore(machine);
      createEffect(
        () => store.state.phase,
        () => {
          phaseRuns += 1;
        },
      );
      createEffect(
        () => store.state.offset,
        () => {
          offsetRuns += 1;
        },
      );
      flush();
      return stop;
    });
    flush();

    machine.send({ type: "grab", offset: 0 });
    flush();
    const phases = phaseRuns;
    const offsets = offsetRuns;

    machine.send({ type: "move", offset: 40 });
    flush();
    machine.send({ type: "move", offset: 90 });
    flush();
    expect(phaseRuns).toBe(phases);
    expect(offsetRuns).toBeGreaterThan(offsets);

    machine.send({ type: "release", velocity: 0 });
    flush();
    expect(phaseRuns).toBe(phases + 1);
    dispose();
  });
});

/** One pointer event on the handle; a real sequence, with an id and coordinates. */
const pointer = async (type: string, target: HTMLElement, clientY: number): Promise<void> => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      isPrimary: true,
      pointerType: "mouse",
      button: 0,
      clientY,
    }),
  );
  await settle();
};

/** A whole gesture in one task: the same timestamp on every event, so the release's velocity is 0 unless a test waits. */
const drag = (handle: HTMLElement, fromY: number, toY: number): void => {
  for (const [type, y] of [
    ["pointerdown", fromY],
    ["pointermove", toY],
    ["pointerup", toY],
  ] as const) {
    handle.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        isPrimary: true,
        pointerType: "mouse",
        button: 0,
        clientY: y,
      }),
    );
  }
};

const openTheSheet = async (
  instance: MountedMotionDrawer,
): Promise<{ handle: HTMLElement; panel: HTMLElement }> => {
  await openTheDrawer(instance);
  const handle = instance.handle();
  const panel = instance.panel();
  if (handle === null || panel === null) {
    throw new Error("drawer: the sheet did not render its handle");
  }
  return { handle, panel };
};

const transformOf = (animation: Animation | undefined): ReadonlyArray<Keyframe> =>
  (animation?.effect as KeyframeEffect | null)?.getKeyframes() ?? [];

describe("Drawer x the sheet's drag (real DOM)", () => {
  it("only the handle is a drag surface: the body keeps its scroll, the handle takes the pointer", async () => {
    const instance = animatedDrawer({ side: "bottom" });
    const { handle, panel } = await openTheSheet(instance);
    const body = inside(panel, "drawer-body");

    expect(getComputedStyle(handle).touchAction).toBe("none");
    expect(getComputedStyle(handle).cursor).toBe("grab");
    expect(getComputedStyle(body).overflowY).toBe("auto");
    expect(getComputedStyle(body).touchAction).toBe("auto");

    // a drag on the body is the body's: nothing grabs, and the panel does not move
    const handleEvents = instance.animations().length;
    for (const type of ["pointerdown", "pointermove", "pointerup"]) {
      body.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          clientY: type === "pointermove" ? 300 : 200,
        }),
      );
    }
    await settle();
    expect(panel.getAttribute("data-drag-state")).toBe("rest");
    expect(getComputedStyle(panel).translate).toBe("none");
    expect(instance.animations()).toHaveLength(handleEvents);
    expect(instance.requests).toEqual([true]);
  });

  it("a release below the threshold snaps back from where the finger left it", async () => {
    const instance = animatedDrawer({ side: "bottom" });
    const { handle, panel } = await openTheSheet(instance);
    const before = instance.animations().length;

    drag(handle, 200, 245);
    await settle();

    // the overlay is still open; only the drag moved
    expect(instance.phase()).toBe("bottom-open");
    expect(panel.getAttribute("data-drag-state")).toBe("settling");
    expect(instance.requests).toEqual([true]);
    expect(instance.animations()).toHaveLength(before + 1);

    const settleBack = instance.animations().at(-1);
    expect(settleBack?.id.startsWith("settle:")).toBe(true);
    expect(transformOf(settleBack)[0]?.translate).toBe("0px 45px");
    expect(String(transformOf(settleBack).at(-1)?.translate)).toMatch(/^0px/);
    expect(getComputedStyle(panel).translate).toBe("0px 45px");

    instance.finish();
    await settle();
    expect(panel.getAttribute("data-drag-state")).toBe("rest");
    expect(panel.style.translate).toBe("");
    expect(instance.requests).toEqual([true]);
  });

  it("a release past the threshold dismisses through the overlay's leaving: one leave, not two", async () => {
    const instance = animatedDrawer({ side: "bottom", controlled: true });
    const { handle, panel } = await openTheSheet(instance);
    const height = panel.getBoundingClientRect().height;
    const pulled = Math.round(height * 0.6);
    const before = instance.animations().length;

    drag(handle, 200, 200 + pulled);
    await settle();

    // the primitive was asked once, and the box is leaving, not closed
    expect(instance.requests).toEqual([true, false]);
    expect(instance.phase()).toBe("bottom-leaving");
    expect(instance.panel()).toBe(panel);
    // exactly one animation was added: the leave, from the drag's position, with no snap-back of its own
    expect(instance.animations()).toHaveLength(before + 1);
    const leave = instance.animations().at(-1);
    expect(leave?.id.startsWith("settle:")).toBe(false);
    const start = Number(leave?.id.split(":")[0]);
    expect(start).toBeCloseTo(1 - pulled / height, 2);
    const frames = transformOf(leave);
    const drawn = Number.parseFloat(String(frames[0]?.transform).replace(/[^0-9.]/g, ""));
    expect(drawn).toBeCloseTo((pulled / height) * 100, 1);
    expect(frames.at(-1)?.transform).toBe("translate(0%, 100%)");
    expect(panel.style.translate).toBe("");
    expect(panel.hasAttribute("hidden")).toBe(false);

    instance.finish();
    await settle();
    expect(instance.panel()).toBeNull();
    expect(instance.layer()).toBeNull();
    expect(instance.phases()).toEqual(["bottom-entering", "bottom-open", "bottom-leaving"]);
  });

  it("a grab during the snap-back continues from the running position, and the cancelled finish moves nothing", async () => {
    const instance = animatedDrawer({ side: "bottom" });
    const { handle, panel } = await openTheSheet(instance);
    drag(handle, 200, 245);
    await settle();
    const settleBack = instance.animations().at(-1);
    if (settleBack === undefined) {
      throw new Error("the release issued no snap-back");
    }
    // halfway back: the sheet is at 22.5px, and a grab must continue from there
    instance.seek(0.5);
    expect(getComputedStyle(panel).translate).toBe("0px 22.5px");

    await pointer("pointerdown", handle, 200);
    expect(settleBack.playState).toBe("idle");
    expect(panel.getAttribute("data-drag-state")).toBe("dragging");
    await pointer("pointermove", handle, 205);

    // no jump: 22.5 + 5; the cancelled animation's own completion (a dead id) left the drag alone
    expect(getComputedStyle(panel).translate).toBe("0px 27.5px");
    expect(panel.getAttribute("data-drag-state")).toBe("dragging");

    // a slow release below the threshold snaps back again, from here
    await pointer("pointerup", handle, 205);
    expect(panel.getAttribute("data-drag-state")).toBe("settling");
    expect(transformOf(instance.animations().at(-1))[0]?.translate).toBe("0px 27.5px");
    expect(instance.requests).toEqual([true]);
  });

  it("Escape during the drag snaps back and does not close the drawer", async () => {
    const instance = animatedDrawer({ side: "bottom" });
    const { handle, panel } = await openTheSheet(instance);

    await pointer("pointerdown", handle, 200);
    await pointer("pointermove", handle, 280);
    expect(panel.getAttribute("data-drag-state")).toBe("dragging");

    await press("Escape");
    expect(panel.getAttribute("data-drag-state")).toBe("settling");
    // the drawer is still open, and no close was requested
    expect(instance.phase()).toBe("bottom-open");
    expect(instance.requests).toEqual([true]);
    expect(transformOf(instance.animations().at(-1))[0]?.translate).toBe("0px 80px");

    // the lift that ends the gesture is dropped: the snap-back is already the coalescer
    await pointer("pointerup", handle, 280);
    expect(panel.getAttribute("data-drag-state")).toBe("settling");
    expect(instance.requests).toEqual([true]);
  });

  it("a flick dismisses below the distance", async () => {
    const instance = animatedDrawer({ side: "bottom", controlled: true });
    const { handle } = await openTheSheet(instance);

    // 40px in 20ms: below SHEET_DISMISS_DISTANCE, above SHEET_DISMISS_VELOCITY
    await pointer("pointerdown", handle, 200);
    await pointer("pointermove", handle, 240);
    await pointer("pointerup", handle, 240);
    await settle();

    expect(instance.requests).toEqual([true, false]);
    expect(instance.phase()).toBe("bottom-leaving");
    instance.finish();
    await settle();
    expect(instance.panel()).toBeNull();
  });

  it("a hold before the release is not a flick", async () => {
    const instance = animatedDrawer({ side: "bottom" });
    const { handle, panel } = await openTheSheet(instance);
    const before = instance.animations().length;

    await pointer("pointerdown", handle, 200);
    await pointer("pointermove", handle, 240);
    // the pointer rests: the last move is older than the velocity window, so the release has no velocity
    await new Promise((resolve) => setTimeout(resolve, 150));
    await pointer("pointerup", handle, 240);
    await settle();

    expect(panel.getAttribute("data-drag-state")).toBe("settling");
    expect(instance.animations()).toHaveLength(before + 1);
    expect(instance.requests).toEqual([true]);
  });

  it("a tap on the handle does nothing", async () => {
    const instance = animatedDrawer({ side: "bottom" });
    const { handle, panel } = await openTheSheet(instance);
    const before = instance.animations().length;

    await pointer("pointerdown", handle, 200);
    await pointer("pointerup", handle, 200);

    expect(panel.getAttribute("data-drag-state")).toBe("rest");
    expect(panel.style.translate).toBe("");
    expect(instance.animations()).toHaveLength(before);
    expect(instance.requests).toEqual([true]);
  });

  it("reduced motion snaps back and closes in one step, with no animation", async () => {
    const instance = animatedDrawer({ side: "bottom", reducedMotion: true });
    const { handle, panel } = await openTheSheet(instance);
    expect(instance.phase()).toBe("bottom-open");
    expect(instance.animations()).toEqual([]);

    drag(handle, 200, 240);
    await settle();
    expect(panel.getAttribute("data-drag-state")).toBe("rest");
    expect(panel.style.translate).toBe("");
    expect(instance.animations()).toEqual([]);
    expect(instance.requests).toEqual([true]);

    drag(handle, 200, 200 + SHEET_DISMISS_DISTANCE);
    await settle();
    expect(instance.panel()).toBeNull();
    expect(instance.animations()).toEqual([]);
    expect(instance.requests).toEqual([true, false]);
  });
});
