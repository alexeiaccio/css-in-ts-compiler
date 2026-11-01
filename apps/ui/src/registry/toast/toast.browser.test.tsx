import { type EffectHandle, harness } from "@cssints/machine";
import { createMachineStore } from "@cssints/machine/solid";
import { createMemo, createRoot, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedToaster, mountToaster } from "./toast.fixture";
import { type ToastPhase, toastRowMachine } from "./toast.tsx";

/** Solid 2 applies setters and delivers delegated events on a later tick. */
const tick = (ms = 20): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls until `done` holds and returns how long it took. Timers run late on a loaded machine, so a countdown is waited for,
 * never slept through.
 */
const waitFor = async (done: () => boolean, limit = 10_000): Promise<number> => {
  const start = Date.now();
  while (!done()) {
    if (Date.now() - start > limit) {
      throw new Error(`waitFor timed out after ${limit} ms`);
    }
    await tick();
  }
  return Date.now() - start;
};

const mounts: MountedToaster[] = [];

const mount = (
  options = {},
  host?: HTMLElement,
  ui: { readonly reducedMotion?: boolean } = {},
): MountedToaster => {
  const mounted = mountToaster(options, host, ui);
  mounts.push(mounted);
  return mounted;
};

afterEach(() => {
  for (const mounted of mounts.splice(0)) {
    mounted.dispose();
  }
});

// The stack is portalled, so the region is in `document.body`, not inside the element the fixture rendered into.
const stack = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-part="toast-region"]');

const rows = (): ReadonlyArray<HTMLElement> => [
  ...document.querySelectorAll<HTMLElement>('[data-part="toast"]'),
];

const rowOf = (title: string): HTMLElement | undefined =>
  rows().find((row) => row.querySelector('[data-part="toast-title"]')?.textContent === title);

const closeOf = (title: string): HTMLButtonElement | undefined =>
  rowOf(title)?.querySelector<HTMLButtonElement>('[data-part="toast-close"]') ?? undefined;

/** Every `data-state` a row is given, from the click to the unmount: the phases the DOM actually painted. */
const watchPhases = (
  row: HTMLElement,
): { readonly phases: string[]; readonly stop: () => void } => {
  const phases: string[] = [];
  const observer = new MutationObserver(() => {
    const phase = row.getAttribute("data-state");
    if (phase !== null) {
      phases.push(phase);
    }
  });
  observer.observe(row, { attributes: true, attributeFilter: ["data-state"] });
  return { phases, stop: () => observer.disconnect() };
};

// --- the protocol, on the harness: no browser, no real time -----------------------------------------------------------------
// The three properties the row's protocol has that an `open` signal cannot express: a dismissal during the enter reverses,
// a cancelled effect's completion is dropped by its handle id, and the second intent of a burst lands in a state that
// does not react to it. The harness starts the machine, so its enter effect is already issued and every delivery, effect
// and cancellation is logged.

const only = (h: { readonly machine: { effects(): readonly EffectHandle[] } }): EffectHandle => {
  const handles = h.machine.effects();
  expect(handles).toHaveLength(1);
  return handles[0] as EffectHandle;
};

describe("Toast x the row machine (the harness)", () => {
  it("reverses a dismiss during entering, and the leave ends gone", () => {
    const h = harness(toastRowMachine(false));
    expect(h.machine.getState().state).toBe("entering");
    const enter = only(h);
    expect(enter.spec.type).toBe("enter");

    h.send({ type: "dismiss" });
    expect(h.machine.getState().state).toBe("leaving");
    // leaving `entering` cancelled its effect and issued one leave: the box continues from where it was
    expect(h.cancelled()).toEqual([enter.id]);
    const leave = only(h);
    expect(leave.spec.type).toBe("leave");

    h.send({ type: "finish", id: leave.id });
    expect(h.machine.getState().state).toBe("gone");
    expect(h.machine.effects()).toHaveLength(0);
    // one departure, which is the one `onDismiss` the primitive hears
    expect(h.log.filter((entry) => entry.to === "gone")).toHaveLength(1);
  });

  it("ignores a cancelled enter's finish, so the row keeps leaving", () => {
    const h = harness(toastRowMachine(false));
    const enter = only(h);
    h.send({ type: "dismiss" });
    expect(h.machine.getState().state).toBe("leaving");
    const leave = only(h);

    // the cancelled animation's own rejection: the id it carries is no longer a live handle
    h.send({ type: "finish", id: enter.id });
    expect(h.machine.getState().state).toBe("leaving");
    expect(only(h).id).toBe(leave.id);
    expect(h.log.at(-1)).toMatchObject({ event: "finish", to: undefined, cancelled: true });
  });

  it("does not restart a leave that is already running", () => {
    const h = harness(toastRowMachine(false));
    h.send({ type: "dismiss" });
    const leave = only(h);

    h.send({ type: "dismiss" });
    expect(h.machine.getState().state).toBe("leaving");
    expect(only(h).id).toBe(leave.id);
    // the second intent was dropped, not queued: leaving is the state that coalesces the burst
    expect(
      h.log.filter((entry) => entry.event === "dismiss" && entry.effect !== undefined),
    ).toHaveLength(1);
  });

  it("two dismisses in one frame produce one effect and one departure", () => {
    const h = harness(toastRowMachine(false));
    // a close click twice, before a frame has passed: the second lands in `leaving`
    h.race({ type: "dismiss" }, { type: "dismiss" });
    const leave = only(h);
    h.send({ type: "finish", id: leave.id });

    expect(h.machine.getState().state).toBe("gone");
    expect(
      h.log.filter((entry) => entry.event === "dismiss" && entry.effect !== undefined),
    ).toHaveLength(1);
    expect(h.log.filter((entry) => entry.to === "gone")).toHaveLength(1);
  });

  it("takes the timeout's dismiss and a close click in the same frame as one dismissal", () => {
    const h = harness(toastRowMachine(false));
    // the countdown is the primitive's; its expiry reaches the row as the same `dismiss` a click sends
    h.race({ type: "dismiss" }, { type: "dismiss" });
    const leave = only(h);
    h.send({ type: "finish", id: leave.id });

    expect(h.machine.getState().state).toBe("gone");
    expect(h.log.filter((entry) => entry.to === "gone")).toHaveLength(1);
    // and nothing asked again once the row was gone
    h.send({ type: "dismiss" });
    expect(h.machine.getState().state).toBe("gone");
    expect(
      h.log.filter((entry) => entry.event === "dismiss" && entry.effect !== undefined),
    ).toHaveLength(1);
  });

  it("skips entering and leaving when the preference asks for no motion", () => {
    const h = harness(toastRowMachine(true));
    // the machine is built at `visible`: no enter effect exists to cancel
    expect(h.machine.getState().state).toBe("visible");
    expect(h.machine.effects()).toHaveLength(0);

    h.send({ type: "dismiss" });
    expect(h.machine.getState().state).toBe("gone");
    // one transition, no effect, and no phase in between
    expect(h.log.every((entry) => entry.effect === undefined)).toBe(true);
    expect(h.log.map((entry) => entry.from)).toEqual(["visible"]);
  });
});

// --- the DOM, in Chromium ----------------------------------------------------------------------------------------------------

describe("Toaster", () => {
  it("renders a pushed toast in the region with the live-region role it announces", async () => {
    const mounted = mount({ labels: { region: "Toasts" } });
    mounted.api.show({ title: "Draft saved" });
    mounted.api.show({ title: "Published", tone: "success" });
    mounted.api.show({
      title: "Upload failed",
      description: "The file is larger than 10 MB.",
      tone: "error",
    });
    await waitFor(() => rows().length === 3);

    const region = stack();
    expect(region?.getAttribute("role")).toBe("region");
    expect(region?.getAttribute("aria-label")).toBe("Toasts");
    // the F6 target the primitive's docs describe: focusable by a host handler, out of the page's tab order
    expect(region?.getAttribute("tabindex")).toBe("-1");
    expect(rows()).toHaveLength(3);

    const info = rowOf("Draft saved");
    const success = rowOf("Published");
    const error = rowOf("Upload failed");
    expect(info?.getAttribute("role")).toBe("status");
    expect(info?.getAttribute("aria-atomic")).toBe("true");
    expect(info?.getAttribute("data-tone")).toBe("info");
    expect(info?.querySelector('[data-part="toast-description"]')).toBeNull();
    // a success is polite too: only the error tone is assertive
    expect(success?.getAttribute("role")).toBe("status");
    expect(success?.getAttribute("data-tone")).toBe("success");
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.getAttribute("aria-atomic")).toBe("true");
    expect(error?.getAttribute("data-tone")).toBe("error");
    expect(error?.querySelector('[data-part="toast-description"]')?.textContent).toBe(
      "The file is larger than 10 MB.",
    );
  });

  it("keeps three at the default ceiling and drops the oldest of four", async () => {
    const mounted = mount({ timeout: 10_000 });
    const ids = ["One", "Two", "Three", "Four"].map((title) => mounted.api.show({ title }));
    await waitFor(() => rows().length === 3);

    // the primitive's default max is 3: the first shown is gone, the last three are in the stack
    expect(
      rows().map((row) => row.querySelector('[data-part="toast-title"]')?.textContent),
    ).toEqual(["Two", "Three", "Four"]);
    expect(mounted.dismissed).toEqual([ids[0]]);
  });

  it("dismisses a toast from its close button", async () => {
    const mounted = mount({ timeout: 10_000 });
    mounted.api.show({ title: "Saved" });
    await waitFor(() => rows().length === 1);

    const close = closeOf("Saved");
    expect(close?.getAttribute("aria-label")).toBe("Dismiss");
    close?.click();
    await waitFor(() => rows().length === 0);
    expect(mounted.dismissed).toHaveLength(1);
  });

  it("auto-dismisses after the timeout", async () => {
    const mounted = mount({ timeout: 60 });
    const id = mounted.api.show({ title: "Gone soon" });
    await waitFor(() => rows().length === 1);

    await waitFor(() => rows().length === 0);
    expect(mounted.dismissed).toEqual([id]);
  });

  it("enters a pushed toast and settles it at visible", async () => {
    const mounted = mount({ timeout: 10_000 });
    mounted.api.show({ title: "Entering" });
    await waitFor(() => rowOf("Entering")?.getAttribute("data-state") === "entering");
    const row = rowOf("Entering") as HTMLElement;
    // the enter is a real animation the machine's effect started, and the row is painted throughout it
    expect(row.getAnimations()).toHaveLength(1);
    expect(row.hidden).toBe(false);

    await waitFor(() => row.getAttribute("data-state") === "visible");
    expect(row.hidden).toBe(false);
    expect(row.getAnimations()).toHaveLength(0);
  });

  it("reverses a close during the enter, and removes the row", async () => {
    const mounted = mount({ timeout: 10_000 });
    mounted.api.show({ title: "Reversed" });
    await waitFor(() => rowOf("Reversed")?.getAttribute("data-state") === "entering");
    const row = rowOf("Reversed") as HTMLElement;
    const watched = watchPhases(row);

    closeOf("Reversed")?.click();
    await tick(0);
    expect(row.getAttribute("data-state")).toBe("leaving");
    // the leave starts at the opacity the enter had reached, not at 1: no snap to visible first
    const leaving = row.getAnimations()[0];
    const [from] = ((leaving?.effect as KeyframeEffect | null)?.getKeyframes() ?? []) as Keyframe[];
    expect(Number(from?.opacity)).toBeLessThan(1);
    expect(row.hidden).toBe(false);

    await waitFor(() => rowOf("Reversed") === undefined);
    watched.stop();
    expect(watched.phases).not.toContain("visible");
    expect(mounted.dismissed).toHaveLength(1);
  });

  it("is never hidden while an animation is running", async () => {
    const mounted = mount({ timeout: 10_000 });
    mounted.api.show({ title: "Painted" });
    await waitFor(() => rowOf("Painted") !== undefined);
    const row = rowOf("Painted") as HTMLElement;

    // the enter: every frame of it is painted, and `hidden` belongs to the state past the animation
    await waitFor(() => {
      if (row.isConnected && row.getAnimations().length > 0) {
        expect(row.hidden).toBe(false);
        expect(row.getAttribute("data-state")).toBe("entering");
      }
      return row.getAttribute("data-state") === "visible";
    });

    closeOf("Painted")?.click();
    await tick(0);
    expect(row.getAttribute("data-state")).toBe("leaving");
    await waitFor(() => {
      if (row.isConnected) {
        // painted for as long as the row is in the document, whatever its animation is doing
        expect(row.hidden).toBe(false);
        expect(row.getAttribute("data-state")).toBe("leaving");
      }
      return !row.isConnected;
    });
    expect(mounted.dismissed).toHaveLength(1);
  });

  it("does not restart a leave that is already running", async () => {
    const mounted = mount({ timeout: 10_000 });
    mounted.api.show({ title: "Once" });
    await waitFor(() => rowOf("Once")?.getAttribute("data-state") === "visible");
    const row = rowOf("Once") as HTMLElement;

    closeOf("Once")?.click();
    await waitFor(() => row.getAnimations().length === 1);
    const leaving = row.getAnimations()[0];
    // the timeout's expiry, or a second click, is a dismiss the machine does not react to while leaving
    closeOf("Once")?.click();
    await tick();
    expect(row.getAnimations()).toEqual([leaving]);
    expect(row.getAttribute("data-state")).toBe("leaving");

    await waitFor(() => rowOf("Once") === undefined);
    expect(mounted.dismissed).toHaveLength(1);
  });

  it("removes a row with no animation when the preference asks for no motion", async () => {
    const mounted = mount({ timeout: 10_000 }, undefined, { reducedMotion: true });
    const id = mounted.api.show({ title: "Quiet" });
    await waitFor(() => rowOf("Quiet") !== undefined);
    const row = rowOf("Quiet") as HTMLElement;
    // the machine was built at `visible`: no enter ran
    expect(row.getAttribute("data-state")).toBe("visible");
    expect(row.getAnimations()).toHaveLength(0);

    const watched = watchPhases(row);
    closeOf("Quiet")?.click();
    await tick();
    watched.stop();
    expect(watched.phases).not.toContain("leaving");
    expect(rowOf("Quiet")).toBeUndefined();
    expect(mounted.dismissed).toEqual([id]);
  });

  it("pauses the countdown on hover and resumes from where it stopped", async () => {
    // Hovered at ~800 of 1200: after the release about 400 ms are left, so a dismissal well before another 1200 ms is what
    // tells a resume from a restart.
    const mounted = mount({ timeout: 1200 });
    const id = mounted.api.show({ title: "Hover me" });
    await tick(800);
    const toast = rowOf("Hover me");
    expect(toast).not.toBeUndefined();

    toast?.dispatchEvent(new MouseEvent("mouseenter"));
    // held well past the deadline it was armed with
    await tick(1200);
    expect(rowOf("Hover me")).not.toBeUndefined();

    toast?.dispatchEvent(new MouseEvent("mouseleave"));
    const released = Date.now();
    await waitFor(() => rowOf("Hover me") === undefined);
    expect(Date.now() - released).toBeLessThan(1200);
    expect(mounted.dismissed).toEqual([id]);
  });

  it("keeps the fixed stack in the viewport's corner inside a transformed ancestor", async () => {
    // the ancestor a layer in the page flow would be trapped by: its `transform` is a containing block for `fixed`, and
    // its `overflow` clips a child that stays inside it
    const wrapper = document.createElement("div");
    wrapper.style.transform = "translateX(40px)";
    wrapper.style.overflow = "hidden";
    const mounted = mount({ timeout: 10_000 }, wrapper);
    mounted.api.show({ title: "Still in the corner" });
    await waitFor(() => rows().length === 1);

    const region = stack();
    expect(region).not.toBeNull();
    // the portal took the stack out of the wrapper
    expect(wrapper.contains(region)).toBe(false);
    expect(region?.parentElement).toBe(document.body);
    expect(getComputedStyle(region as HTMLElement).position).toBe("fixed");

    const rect = (region as HTMLElement).getBoundingClientRect();
    expect(window.innerWidth - rect.right).toBeLessThan(48);
    expect(window.innerHeight - rect.bottom).toBeLessThan(48);
    expect(rect.right).toBeGreaterThan(window.innerWidth / 2);
    expect(rect.bottom).toBeGreaterThan(window.innerHeight / 2);
  });
});

// --- the row's store, with the bridge's own counters (as packages/machine/test/store.mjs) -------------------------------------
// Each row has its own machine and its own store; a reader of one row's phase or `hidden` must not run when another row
// moves, and a reader of a field must not run when a different field of the same row changes.

describe("Toast x the row store", () => {
  it("a row's phase and hidden readers ignore the other rows", () => {
    const one = harness(toastRowMachine(false));
    const other = harness(toastRowMachine(false));
    let phases = 0;
    let hidden = 0;
    let others = 0;
    let readPhase!: () => ToastPhase;
    let readHidden!: () => boolean;
    let readOther!: () => ToastPhase;

    const dispose = createRoot((disposeRoot) => {
      const store = createMachineStore(one.machine);
      const view = store.projection(
        (draft, from) => {
          draft.hidden = from.phase === "gone";
        },
        { hidden: false },
      );
      const otherStore = createMachineStore(other.machine);
      readPhase = createMemo(() => {
        phases += 1;
        return store.state.phase;
      });
      readHidden = createMemo(() => {
        hidden += 1;
        return view.hidden;
      });
      readOther = createMemo(() => {
        others += 1;
        return otherStore.state.phase;
      });
      return disposeRoot;
    });

    const read = (): void => {
      readPhase();
      readHidden();
      readOther();
    };
    // the first reads are the memos' initial runs
    read();
    expect(readPhase()).toBe("entering");
    expect(readHidden()).toBe(false);
    expect(readOther()).toBe("entering");
    phases = 0;
    hidden = 0;
    others = 0;

    // entering → leaving: the phase reader re-runs, `hidden` does not change, the other row is untouched
    one.send({ type: "dismiss" });
    flush();
    read();
    expect(readPhase()).toBe("leaving");
    expect(phases).toBe(1);
    expect(hidden).toBe(0);
    expect(others).toBe(0);

    // leaving → gone: both of the row's readers see a change, the other row still does not
    one.send({ type: "finish", id: only(one).id });
    flush();
    read();
    expect(readPhase()).toBe("gone");
    expect(readHidden()).toBe(true);
    expect(hidden).toBe(1);
    expect(others).toBe(0);

    dispose();
  });
});
