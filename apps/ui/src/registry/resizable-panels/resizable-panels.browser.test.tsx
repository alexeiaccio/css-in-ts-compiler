import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { type MountedResizablePanels, mountResizablePanels } from "./resizable-panels.fixture";

// @cssints/headless checks `createResizablePanels` against specs/patterns/resizable-panels.qnt, the APG scenarios and the
// differential walk. This file is the skin's oracle: it mounts the starter in a real Chromium and drives the separator a
// reader does, reading the states the primitive announces and the grid the skin paints from them.

/** Solid applies setters on the next flush; two frames let the measured layout settle. */
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** A layout change eases over 160 ms for a reader who allows motion: wait it out before measuring a pane. */
const settleMotion = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 200));

/** Polls until `done` holds, so a transition is waited for rather than assumed. */
const waitFor = async (done: () => boolean, limit = 2000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await frame();
  }
};

const live: MountedResizablePanels[] = [];

const mounted = (): MountedResizablePanels => {
  const instance = mountResizablePanels();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`resizable-panels: no ${selector}`);
  }
  return element;
};

const group = (root: ParentNode): HTMLElement => required(root, '[data-part="resizable-panels"]');

const panes = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="resizable-panels-pane"]'),
];

const separators = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="resizable-panels-separator"]'),
];

const grip = (separator: Element): HTMLElement =>
  required(separator, '[data-part="resizable-panels-grip"]');

const value = (separator: HTMLElement): number => Number(separator.getAttribute("aria-valuenow"));

const template = (root: ParentNode): string => group(root).style.gridTemplateColumns;

const press = async (target: HTMLElement, key: string): Promise<void> => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await frame();
};

/** The pointer of a drag, as the primitive's handlers receive it: a real `PointerEvent` with the mouse's coordinates. */
const pointer = (
  element: HTMLElement,
  type: string,
  position: { readonly x: number; readonly y: number },
  buttons: number,
): void => {
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons,
      clientX: position.x,
      clientY: position.y,
    }),
  );
};

const centre = (element: HTMLElement): { readonly x: number; readonly y: number } => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

describe("ResizablePanels", () => {
  it("is a named group of three panes with a focusable separator between each pair", async () => {
    const { root } = mounted();
    await frame();

    expect(group(root).getAttribute("role")).toBe("group");
    expect(group(root).getAttribute("aria-label")).toBe("Workspace layout");
    expect(panes(root)).toHaveLength(3);
    expect(separators(root)).toHaveLength(2);

    const [first, second] = separators(root);
    if (first === undefined || second === undefined) {
      throw new Error("resizable-panels: missing separator");
    }

    for (const [index, separator] of [first, second].entries()) {
      expect(separator.getAttribute("role")).toBe("separator");
      expect(separator.getAttribute("aria-orientation")).toBe("vertical");
      expect(separator.tabIndex).toBe(0);
      expect(separator.getAttribute("aria-controls")).toBe(panes(root)[index]?.id);
      expect(separator.getAttribute("aria-valuemin")).toBe(index === 0 ? "15" : "25");
      expect(separator.getAttribute("aria-valuemax")).toBe("80");
      expect(grip(separator).getAttribute("aria-hidden")).toBe("true");
    }

    expect(value(first)).toBe(22);
    expect(value(second)).toBe(50);
    // the skin paints the primitive's sizes as the grid's fractions, with the bars as their own tracks
    expect(template(root)).toBe("22fr auto 50fr auto 28fr");
    // the panes are surfaces with a border, the bars are the focused widgets
    expect(getComputedStyle(panes(root)[0] as HTMLElement).borderTopStyle).toBe("solid");
  });

  it("reaches both separators with Tab, and the handle shows on focus", async () => {
    const { root } = mounted();
    await frame();

    const files = [
      ...root.querySelectorAll<HTMLButtonElement>('[data-part="resizable-panels-file"]'),
    ];
    const last = files.at(-1);
    if (last === undefined) {
      throw new Error("resizable-panels: no file");
    }
    last.focus();
    await userEvent.keyboard("{Tab}");
    await frame();

    const [first] = separators(root);
    if (first === undefined) {
      throw new Error("resizable-panels: missing separator");
    }
    expect(document.activeElement).toBe(first);
    expect(getComputedStyle(first).outlineStyle).toBe("solid");
    // the grip is the visible handle: it is drawn while the bar has keyboard focus
    await waitFor(() => getComputedStyle(grip(first)).opacity === "1");
  });

  it("moves the boundary by the step with the arrow keys and stops at the minimum", async () => {
    const { root } = mounted();
    await frame();
    const [first] = separators(root);
    if (first === undefined) {
      throw new Error("resizable-panels: missing separator");
    }
    first.focus();
    const startWidth = panes(root)[0]?.getBoundingClientRect().width ?? 0;

    await press(first, "ArrowRight");
    expect(value(first)).toBe(32);
    expect(template(root)).toBe("32fr auto 40fr auto 28fr");

    await settleMotion();
    const wider = panes(root)[0]?.getBoundingClientRect().width ?? 0;
    expect(wider).toBeGreaterThan(startWidth);

    await press(first, "ArrowLeft");
    expect(value(first)).toBe(22);

    // the pane never shrinks under its 15% minimum, and its neighbour keeps its own 25%
    for (let step = 0; step < 4; step += 1) {
      await press(first, "ArrowLeft");
    }
    expect(value(first)).toBe(15);
    expect(template(root)).toBe("15fr auto 57fr auto 28fr");
  });

  it("jumps the pair to its bounds with Home and End", async () => {
    const { root } = mounted();
    await frame();
    const [first] = separators(root);
    if (first === undefined) {
      throw new Error("resizable-panels: missing separator");
    }
    first.focus();

    await press(first, "Home");
    expect(value(first)).toBe(15);
    expect(template(root)).toBe("15fr auto 57fr auto 28fr");

    await press(first, "End");
    expect(value(first)).toBe(47);
    // End stops where the right pane of the pair reaches its 25% minimum, not at the left pane's 80%
    expect(template(root)).toBe("47fr auto 25fr auto 28fr");
  });

  it("collapses the first pane on Enter and restores the size it left", async () => {
    const { root } = mounted();
    await frame();
    const [first] = separators(root);
    if (first === undefined) {
      throw new Error("resizable-panels: missing separator");
    }
    first.focus();

    await press(first, "Enter");
    expect(value(first)).toBe(0);
    expect(template(root)).toBe("0fr auto 72fr auto 28fr");

    await press(first, "Enter");
    expect(value(first)).toBe(22);
    expect(template(root)).toBe("22fr auto 50fr auto 28fr");
  });

  it("drags the boundary by the pointer's distance, and the layout follows the pointer", async () => {
    const { root } = mounted();
    await frame();
    const [first] = separators(root);
    if (first === undefined) {
      throw new Error("resizable-panels: missing separator");
    }
    const width = group(root).getBoundingClientRect().width;
    const start = centre(first);
    const step = (width * 10) / 100;

    pointer(first, "pointerdown", start, 1);
    pointer(first, "pointermove", { x: start.x + step, y: start.y }, 1);
    await frame();

    expect(value(first)).toBe(32);
    expect(template(root)).toBe("32fr auto 40fr auto 28fr");
    expect(group(root).getAttribute("data-resizing")).toBe("true");

    pointer(first, "pointermove", { x: start.x - step, y: start.y }, 1);
    await frame();
    // the pointer went past the pane's 15% minimum: the layout stops there, not at the pointer
    expect(value(first)).toBe(15);
    expect(template(root)).toBe("15fr auto 57fr auto 28fr");

    pointer(first, "pointerup", { x: start.x - step, y: start.y }, 0);
    await frame();
    expect(group(root).getAttribute("data-resizing")).toBe("false");
  });

  it("moves only its own pair from the second separator of three panes", async () => {
    const { root } = mounted();
    await frame();
    const [first, second] = separators(root);
    if (first === undefined || second === undefined) {
      throw new Error("resizable-panels: missing separator");
    }
    second.focus();

    await press(second, "ArrowRight");
    expect(value(second)).toBe(60);
    expect(value(first)).toBe(22);
    expect(template(root)).toBe("22fr auto 60fr auto 18fr");

    // the pane on the right stops at its 15% minimum, not at the group's end
    for (let step = 0; step < 3; step += 1) {
      await press(second, "ArrowRight");
    }
    expect(value(second)).toBe(63);
    expect(template(root)).toBe("22fr auto 63fr auto 15fr");
  });
});
