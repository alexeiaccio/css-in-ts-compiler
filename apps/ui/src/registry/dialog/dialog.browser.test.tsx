import { createMachine, harness } from "@cssints/machine";
import { createMachineStore } from "@cssints/machine/solid";
import { createEffect, createRoot, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { overlayMotionDefinition } from "../overlay-motion.ts";
import { type MountDialogOptions, type MountedDialog, mountDialog } from "./dialog.fixture";

// Two oracles for two questions (`specs/apg/dialog-modal.qnt` and `specs/patterns/animation.qnt`): the primitive's
// contract is the APG model replayed by the kit's browser tests, and the box's protocol is the harness — plain JS, no
// browser, no real time. The DOM cases below are the second half of every race: what the layer really did.

const live: MountedDialog[] = [];

const mounted = (options: MountDialogOptions = {}): MountedDialog => {
  const instance = mountDialog(options);
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
  // a page that a test opened a modal on: the kit's lock is the component's, and this file's first case leaves it open
  document.body.style.overflow = "";
});

/** Solid's writes and an animation's completion are microtasks: flush on both sides of a macrotask. */
const settle = async (): Promise<void> => {
  flush();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  flush();
};

const key = async (name: string, init: KeyboardEventInit = {}): Promise<void> => {
  const target =
    document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...init }),
  );
  await settle();
};

const backdrop = (instance: MountedDialog): HTMLElement => {
  const element = instance.layer()?.querySelector<HTMLElement>('[data-part="dialog-backdrop"]');
  if (element === null || element === undefined) {
    throw new Error("dialog: no backdrop");
  }
  return element;
};

/** Open the dialog from its trigger and land the box, so a case starts at `open`. */
const openAndSettle = async (instance: MountedDialog): Promise<void> => {
  instance.trigger().focus();
  instance.trigger().click();
  await settle();
  instance.finish();
  await settle();
};

describe("Dialog (the primitive's contract: specs/apg/dialog-modal.qnt)", () => {
  it("opens from its trigger as a modal dialog, with the focus in the panel", async () => {
    const instance = mounted();
    const trigger = instance.trigger();
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(instance.panel()).toBeNull();

    trigger.focus();
    trigger.click();
    await settle();

    const panel = instance.panel();
    expect(panel).not.toBeNull();
    if (panel === null) {
      return;
    }
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    expect(panel.getAttribute("aria-label")).toBe("Rename file");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    // the layer is portalled out of the fixture, into the body
    expect(instance.root.contains(panel)).toBe(false);
    expect(panel.closest('[data-part="dialog-layer"]')?.parentElement).toBe(document.body);
    expect(document.activeElement).toBe(panel);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("returns the focus to the trigger on Escape, once", async () => {
    const instance = mounted();
    await openAndSettle(instance);
    // the setup's own focus of the trigger is the first count: the close's return is the second
    const base = instance.focuses();

    await key("Escape");

    expect(instance.panel()).toBeNull();
    expect(document.activeElement).toBe(instance.trigger());
    expect(instance.focuses()).toBe(base + 1);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on a press on the backdrop, unless the host says otherwise", async () => {
    const instance = mounted();
    await openAndSettle(instance);
    backdrop(instance).click();
    await settle();
    expect(instance.panel()).toBeNull();

    const fixed = mounted({ dismissable: false });
    await openAndSettle(fixed);
    backdrop(fixed).click();
    await settle();
    expect(fixed.panel()).not.toBeNull();
  });

  it("closes from the close control inside the panel", async () => {
    const instance = mounted();
    await openAndSettle(instance);
    const close = instance.panel()?.querySelector<HTMLElement>("[data-part] button");
    expect(close?.textContent).toBe("Cancel");
    close?.click();
    await settle();
    expect(instance.panel()).toBeNull();
    expect(instance.requests).toEqual([true, false]);
  });
});

describe("Dialog x the animated box (specs/patterns/animation.qnt, harness)", () => {
  it("a close during the close is a superseded intent: no transition, no second effect", () => {
    const h = harness(overlayMotionDefinition(false));
    h.send({ type: "open" });
    expect(h.machine.getState().state).toBe("entering");
    const entering = h.machine.effects()[0]?.id;

    h.send({ type: "close" });
    expect(h.machine.getState().state).toBe("leaving");
    // the entering effect was cancelled by leaving its state, and replacing it issued exactly one
    expect(h.cancelled()).toEqual([entering]);
    expect(h.machine.effects()).toHaveLength(1);
    const leaving = h.machine.effects()[0]?.id;

    h.send({ type: "close" });
    expect(h.machine.getState().state).toBe("leaving");
    expect(h.log.at(-1)).toMatchObject({ event: "close", from: "leaving", to: undefined });
    expect(h.machine.effects().map((handle) => handle.id)).toEqual([leaving]);
  });

  it("an open during the close reverses: the superseded effect is replaced, never joined", () => {
    const h = harness(overlayMotionDefinition(false));
    h.send({ type: "open" });
    h.send({ type: "finish", id: h.machine.effects()[0]?.id ?? 0 });
    expect(h.machine.getState().state).toBe("open");

    h.send({ type: "close" });
    const leaving = h.machine.effects()[0]?.id;
    expect(h.machine.getState().state).toBe("leaving");

    h.send({ type: "open" });
    expect(h.machine.getState().state).toBe("entering");
    expect(h.cancelled()).toContain(leaving);
    // one live effect, and it is not the one that was cancelled: the box never holds two
    expect(h.machine.effects()).toHaveLength(1);
    expect(h.machine.effects()[0]?.id).not.toBe(leaving);
    // and it never passed through closed on the way back
    expect(h.log.map((entry) => entry.to)).not.toContain("closed");
  });

  it("a cancelled effect's late completion moves nothing", () => {
    const h = harness(overlayMotionDefinition(false));
    h.send({ type: "open" });
    const entering = h.machine.effects()[0]?.id ?? 0;
    h.send({ type: "close" });
    const leaving = h.machine.effects()[0]?.id ?? 0;

    h.send({ type: "finish", id: entering });
    expect(h.machine.getState().state).toBe("leaving");
    expect(h.log.at(-1)).toMatchObject({ event: "finish", from: "leaving", cancelled: true });

    h.send({ type: "finish", id: leaving });
    expect(h.machine.getState().state).toBe("closed");
    expect(h.machine.getState().context.committed).toBe("closed");
  });

  it("reduced motion lands the intent in one step, with no transition and no effect", () => {
    const h = harness(overlayMotionDefinition(true));
    h.send({ type: "open" });

    expect(h.machine.getState().state).toBe("open");
    expect(h.machine.getState().context.committed).toBe("open");
    expect(h.machine.effects()).toEqual([]);
    expect(h.log.map((entry) => entry.to)).toEqual(["open"]);

    h.send({ type: "close" });
    expect(h.machine.getState().state).toBe("closed");
    expect(h.machine.effects()).toEqual([]);
    expect(h.log.map((entry) => entry.to)).not.toContain("leaving");
  });

  it("a backdrop click and an Escape in the same frame are one dismissal", () => {
    const h = harness(overlayMotionDefinition(false));
    h.send({ type: "open" });
    h.send({ type: "finish", id: h.machine.effects()[0]?.id ?? 0 });

    const states = h.race({ type: "close" }, { type: "close" });
    expect(states.map((state) => state.state)).toEqual(["leaving", "leaving"]);
    // one dismissal issued one effect; the second intent had no transition to take
    expect(h.machine.effects()).toHaveLength(1);
    expect(
      h.log.filter((entry) => entry.to === "leaving" && entry.effect !== undefined),
    ).toHaveLength(1);
  });

  it("no state is a trap: every state an intent or a completion can reach ends at open or closed", () => {
    const walk = (events: ReadonlyArray<"open" | "close" | "finish">): string => {
      const h = harness(overlayMotionDefinition(false));
      for (const event of events) {
        if (event === "finish") {
          for (const handle of h.machine.effects()) {
            h.send({ type: "finish", id: handle.id });
          }
        } else {
          h.send({ type: event });
        }
      }
      // once nothing is in flight, a completion must land the box
      for (const handle of h.machine.effects()) {
        h.send({ type: "finish", id: handle.id });
      }
      return h.machine.getState().state;
    };
    for (const events of [
      [],
      ["open"],
      ["open", "finish"],
      ["open", "close"],
      ["open", "close", "open"],
      ["open", "close", "finish"],
      ["open", "close", "open", "close"],
      ["open", "close", "open", "finish"],
    ] as const) {
      expect(["open", "closed"]).toContain(walk(events));
    }
  });

  it("writes one store field at a time: a phase reader does not re-run when the preference moves", () => {
    // the machine is driven from outside the root: a store write belongs to no owned scope, which is why the components
    // deliver every event from a handler, an animation's completion or a microtask
    const machine = createMachine(overlayMotionDefinition(false));
    let phaseRuns = 0;
    let logicalRuns = 0;
    const dispose = createRoot((stop) => {
      const store = createMachineStore(machine);
      createEffect(
        () => store.state.phase,
        () => {
          phaseRuns += 1;
        },
      );
      createEffect(
        () => store.state.logical,
        () => {
          logicalRuns += 1;
        },
      );
      flush();
      return stop;
    });
    flush();
    const phases = phaseRuns;
    const logicals = logicalRuns;

    // the preference moves while the box is still: one field changes, the phase does not
    machine.send({ type: "motion", reduced: false });
    flush();
    machine.send({ type: "motion", reduced: true });
    flush();
    expect(phaseRuns).toBe(phases);
    expect(logicalRuns).toBe(logicals);

    machine.send({ type: "open" });
    flush();
    expect(phaseRuns).toBe(phases + 1);
    expect(logicalRuns).toBe(logicals + 1);
    dispose();
  });
});

describe("Dialog x the animated box (real DOM)", () => {
  it("keeps the layer mounted through leaving and removes it only at closed", async () => {
    const instance = mounted({ animated: true });
    expect(instance.layer()).toBeNull();

    instance.trigger().focus();
    instance.trigger().click();
    await settle();
    expect(instance.phase()).toBe("entering");
    const panel = instance.panel();
    expect(panel).not.toBeNull();

    instance.finish();
    await settle();
    expect(instance.phase()).toBe("open");

    await key("Escape");
    expect(instance.phase()).toBe("leaving");
    // the same node, in the page, while the box plays out
    expect(instance.panel()).toBe(panel);
    expect(instance.layer()).not.toBeNull();

    instance.finish();
    await settle();
    expect(instance.panel()).toBeNull();
    expect(instance.layer()).toBeNull();
    expect(instance.phases()).toEqual(["entering", "open", "leaving"]);
  });

  it("does not start a second close on an Escape during the close, and gives the focus back once", async () => {
    const instance = mounted({ animated: true });
    await openAndSettle(instance);
    const before = instance.animations().length;
    const base = instance.focuses();

    await key("Escape");
    expect(instance.phase()).toBe("leaving");
    expect(instance.focuses()).toBe(base + 1);

    // the same key again, on whatever has the focus now
    await key("Escape");
    expect(instance.phase()).toBe("leaving");
    expect(instance.animations()).toHaveLength(before + 1);
    expect(instance.focuses()).toBe(base + 1);
    // one dismissal, one request
    expect(instance.requests).toEqual([true, false]);

    instance.finish();
    await settle();
    expect(instance.focuses()).toBe(base + 1);
  });

  it("reverses a close from the box's own position, and never unmounts the panel on the way", async () => {
    const instance = mounted({ animated: true });
    await openAndSettle(instance);
    const panel = instance.panel();

    await key("Escape");
    expect(instance.phase()).toBe("leaving");
    // half way out, then the host asks for it back
    instance.seek(0.5);
    instance.trigger().click();
    await settle();

    expect(instance.phase()).toBe("entering");
    // the new animation starts where the cancelled one stopped: no jump back to the open end
    const reversal = instance.animations().at(-1);
    expect(reversal?.id.split(":")[0]).toBe("0.5");
    expect(instance.panel()).toBe(panel);
    expect(instance.layer()).not.toBeNull();

    // the cancelled close's own late completion carries a dead id and moves nothing
    await settle();
    expect(instance.phase()).toBe("entering");
    instance.finish();
    await settle();
    expect(instance.phase()).toBe("open");
  });

  it("closes in one step with prefers-reduced-motion: no leaving, no animation", async () => {
    const instance = mounted({ animated: true, reducedMotion: true });
    instance.trigger().focus();
    instance.trigger().click();
    await settle();
    expect(instance.phase()).toBe("open");
    expect(instance.animations()).toEqual([]);
    const base = instance.focuses();

    await key("Escape");
    expect(instance.panel()).toBeNull();
    expect(instance.layer()).toBeNull();
    expect(instance.phases()).toEqual(["open"]);
    expect(instance.focuses()).toBe(base + 1);
  });

  it("asks the host once for a backdrop click and an Escape in the same frame", async () => {
    const instance = mounted({ animated: true, controlled: true });
    await openAndSettle(instance);
    expect(instance.requests).toEqual([true]);
    const base = instance.focuses();

    backdrop(instance).click();
    await key("Escape");

    expect(instance.requests).toEqual([true, false]);
    expect(instance.focuses()).toBe(base + 1);
    instance.finish();
    await settle();
    expect(instance.panel()).toBeNull();
  });

  it("keeps the panel painted and out of the pointer while it leaves (Atomic)", async () => {
    const instance = mounted({ animated: true });
    await openAndSettle(instance);
    const panel = instance.panel();
    const layer = instance.layer();
    if (panel === null || layer === null) {
      return;
    }
    expect(getComputedStyle(layer).pointerEvents).toBe("auto");

    await key("Escape");
    const leaving = instance.panel();
    expect(leaving).toBe(panel);
    // not cut from the accessibility tree or the page mid-fade: the primitive's `hidden` is `!open()`, and `!open()` is
    // exactly this frame
    expect(leaving?.hasAttribute("hidden")).toBe(false);
    expect(getComputedStyle(panel).display).not.toBe("none");
    expect(getComputedStyle(panel).visibility).not.toBe("hidden");
    // and it takes no clicks: the dialog is closed, the box is only finishing
    expect(getComputedStyle(layer).pointerEvents).toBe("none");
  });

  it("leaves the static mode untouched: no phase attribute, no animation, unmounted at once", async () => {
    const instance = mounted();
    await openAndSettle(instance);
    expect(instance.panel()?.hasAttribute("data-state")).toBe(false);
    expect(instance.animations()).toEqual([]);
    // `finish()` above is a no-op: there was never an animation to land
    expect(instance.panel()).not.toBeNull();
  });
});
