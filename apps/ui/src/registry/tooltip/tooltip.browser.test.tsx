import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { type MountedTooltip, mountTooltip } from "./tooltip.fixture";

// @cssints/headless walks `createTooltipGroup` against the APG tooltip spec in test/tooltip.browser.test.tsx, so that
// file is the primitive's oracle. This file is the skin's: it mounts the starter in a real Chromium and opens it the
// two ways a reader does (hover and focus), then reads the bubble and `aria-describedby` the primitive built. The
// scenarios the primitive's walk drives as `prop` steps (a delay, a controlled host, the timer events) cannot be
// replayed from the skin: `Tooltip` owns its group, renders one trigger, and wires the two gestures only. Those
// remain the primitive's test.

const live: MountedTooltip[] = [];

const mounted = (config?: Parameters<typeof mountTooltip>[0]): MountedTooltip => {
  const instance = mountTooltip(config);
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

/** Solid 2 applies setters and the primitive's effects on later turns. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const waitFor = async (done: () => boolean, limit = 2000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await frame();
  }
};

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`tooltip: no ${selector}`);
  }
  return element;
};

/** The trigger is the kit's `Button`; the bubble is the only `role=tooltip` in the tree. */
const trigger = (root: ParentNode): HTMLElement => required(root, '[data-part="button"]');
const bubble = (root: ParentNode): HTMLElement => required(root, '[role="tooltip"]');
const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const describedBy = (root: ParentNode): string | null =>
  trigger(root).getAttribute("aria-describedby");

describe("Tooltip", () => {
  it("is a bubble that is in the DOM and hidden until the trigger is described by it", async () => {
    const { root } = mounted();
    await settle();

    const tip = bubble(root);
    expect(tip.id).not.toBe("");
    expect(tip.hidden).toBe(true);
    // no display in the bubble's class: the UA's `[hidden] { display: none }` is what hides it
    expect(style(tip).display).toBe("none");
    expect(trigger(root).getAttribute("aria-describedby")).toBeNull();
    expect(tip.textContent).toBe("Deletes the file");

    // it floats in the anchor beside the trigger
    const anchor = required(root, '[data-part="tooltip-anchor"]');
    expect(style(anchor).position).toBe("relative");
    expect(style(tip).position).toBe("absolute");
  });

  it("shows on hover, and the trigger names it while it is up", async () => {
    const { root } = mounted();
    await settle();

    await userEvent.hover(trigger(root));
    flush();
    await settle();

    const tip = bubble(root);
    expect(tip.hidden).toBe(false);
    expect(style(tip).display).not.toBe("none");
    expect(describedBy(root)).toBe(tip.id);
  });

  it("hides after the hide delay when the pointer leaves the trigger", async () => {
    const { root } = mounted();
    await settle();

    await userEvent.hover(trigger(root));
    flush();
    await settle();
    expect(bubble(root).hidden).toBe(false);

    await userEvent.unhover(trigger(root));
    flush();
    // the kit's grace, not the primitive's immediate hide: a pointer crossing the gap must survive it
    await waitFor(() => bubble(root).hidden);
    expect(describedBy(root)).toBeNull();
  });

  it("shows with the focus and hides with the blur, without waiting", async () => {
    const { root } = mounted();
    await settle();

    trigger(root).focus();
    flush();
    await settle();
    expect(bubble(root).hidden).toBe(false);
    expect(describedBy(root)).toBe(bubble(root).id);

    trigger(root).blur();
    flush();
    // focus never waits: the tooltip went with the focus, so it goes with it
    expect(bubble(root).hidden).toBe(true);
    expect(describedBy(root)).toBeNull();
  });

  it("stays open while the pointer is on the bubble itself", async () => {
    const { root } = mounted();
    await settle();

    await userEvent.hover(trigger(root));
    flush();
    await settle();
    const tip = bubble(root);
    expect(tip.hidden).toBe(false);

    // Leaving the trigger arms the hide; entering the bubble cancels it. The two pointer moves are dispatched
    // back to back on the elements, as a pointer crossing the gap does: a Playwright hover has to resolve a
    // locator first, which under load outlasts the 300 ms grace the kit lays on purpose.
    trigger(root).dispatchEvent(new PointerEvent("pointerleave"));
    tip.dispatchEvent(new PointerEvent("pointerenter"));
    flush();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(tip.hidden).toBe(false);

    // leaving the bubble hides it again, after the same grace
    tip.dispatchEvent(new PointerEvent("pointerleave"));
    flush();
    await waitFor(() => tip.hidden);
  });

  it("never opens while disabled, and no trigger is described", async () => {
    const { root } = mounted({ disabled: true });
    await settle();

    expect(describedBy(root)).toBeNull();
    await userEvent.hover(trigger(root));
    trigger(root).focus();
    flush();
    await settle();
    expect(bubble(root).hidden).toBe(true);
    expect(describedBy(root)).toBeNull();
  });
});
