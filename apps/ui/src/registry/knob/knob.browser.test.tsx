import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { type MountedKnob, mountKnob } from "./knob.fixture";

// @cssints/headless checks `createKnob` on a real dial in test/knob.browser.test.tsx: no APG pattern and no ARIA dial role
// exist, so that file is the primitive's oracle. This file is the skin's: it mounts the starter in a real Chromium and reads
// the same announced state, then drives the keys and the pointer the way a reader does. The pan dial's step of 5 is not a
// detent the skin adds: the primitive has none, and the host's step is what makes 0 easy to reach again.

/** Solid applies setters on the next flush; a frame lets the paint settle before a computed style is read. */
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

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

const live: MountedKnob[] = [];

const mounted = (): MountedKnob => {
  const instance = mountKnob();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const dials = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="knob-dial"]'),
];

const dial = (root: ParentNode, index = 0): HTMLElement => {
  const element = dials(root)[index];
  if (element === undefined) {
    throw new Error(`knob: no dial ${index}`);
  }
  return element;
};

const readout = (root: ParentNode, index = 0): HTMLElement => {
  const element = root.querySelectorAll<HTMLElement>('[data-part="knob-readout"]')[index];
  if (element === undefined) {
    throw new Error(`knob: no readout ${index}`);
  }
  return element;
};

const arc = (root: ParentNode, part: string, index = 0): SVGElement => {
  const element = root.querySelectorAll<SVGElement>(`[data-part="${part}"]`)[index];
  if (element === undefined) {
    throw new Error(`knob: no ${part} ${index}`);
  }
  return element;
};

const value = (element: HTMLElement): number => Number(element.getAttribute("aria-valuenow"));

const press = async (target: HTMLElement, key: string): Promise<void> => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await frame();
};

/** The pointer of a drag, as the primitive's handlers receive it. */
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

describe("Knob", () => {
  it("is a named role=slider with its value in the middle and a polite live value", async () => {
    const { root } = mounted();
    await frame();

    const volume = dial(root);
    expect(volume.getAttribute("role")).toBe("slider");
    expect(volume.getAttribute("aria-label")).toBe("Volume");
    expect(volume.tabIndex).toBe(0);
    expect(volume.getAttribute("aria-valuemin")).toBe("0");
    expect(volume.getAttribute("aria-valuemax")).toBe("100");
    expect(volume.getAttribute("aria-valuenow")).toBe("65");
    expect(volume.getAttribute("aria-valuetext")).toBe("65%");
    expect(readout(root).textContent).toBe("65%");

    // the live region is rendered and visually hidden, never `hidden`
    const status = root.querySelector('[data-part="knob-value"]');
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("hidden")).toBeNull();
    expect(getComputedStyle(status as HTMLElement).clipPath).toBe("inset(50%)");

    // the second dial has its own range, its own word for the centre, and no % formatter
    const pan = dials(root)[1];
    if (pan === undefined) {
      throw new Error("knob: no pan dial");
    }
    expect(pan.getAttribute("aria-label")).toBe("Pan");
    expect(pan.getAttribute("aria-valuemin")).toBe("-50");
    expect(pan.getAttribute("aria-valuemax")).toBe("50");
    expect(pan.getAttribute("aria-valuenow")).toBe("0");
    expect(pan.getAttribute("aria-valuetext")).toBe("Centre");
  });

  it("paints the track and the value arc from the value, with the pointer at the same angle", async () => {
    const { root } = mounted();
    await frame();

    // a 270° sweep over pathLength=100: the track is 75 long, the value arc 75 × 65%
    expect(arc(root, "knob-track").getAttribute("stroke-dasharray")).toBe("75 100");
    expect(arc(root, "knob-arc").getAttribute("stroke-dasharray")).toBe("48.75 100");
    expect(arc(root, "knob-pointer").getAttribute("transform")).toBe("rotate(40.5 50 50)");

    // the two tones are different tokens, so the value arc reads against its track
    const track = getComputedStyle(arc(root, "knob-track")).stroke;
    const grew = getComputedStyle(arc(root, "knob-arc")).stroke;
    expect(grew).not.toBe(track);

    await press(dial(root), "ArrowUp");
    expect(arc(root, "knob-arc").getAttribute("stroke-dasharray")).toBe("49.5 100");
    expect(arc(root, "knob-pointer").getAttribute("transform")).toBe("rotate(43.2 50 50)");
  });

  it("steps with the arrows, jumps with PageUp/PageDown and Home/End, and clamps", async () => {
    const { root } = mounted();
    await frame();
    const volume = dial(root);

    await press(volume, "ArrowUp");
    expect(value(volume)).toBe(66);
    expect(volume.getAttribute("aria-valuetext")).toBe("66%");
    expect(readout(root).textContent).toBe("66%");

    await press(volume, "ArrowRight");
    await press(volume, "ArrowDown");
    await press(volume, "ArrowLeft");
    expect(value(volume)).toBe(65);
    // the primitive has no coarse step of its own: PageUp/PageDown are the ten-step jump, and Shift stays a plain step
    await press(volume, "ArrowUp");
    expect(value(volume)).toBe(66);

    await press(volume, "PageUp");
    expect(value(volume)).toBe(76);
    await press(volume, "PageDown");
    expect(value(volume)).toBe(66);
    await press(volume, "End");
    expect(value(volume)).toBe(100);
    await press(volume, "ArrowUp");
    expect(value(volume)).toBe(100);
    await press(volume, "Home");
    expect(value(volume)).toBe(0);
    await press(volume, "ArrowDown");
    expect(value(volume)).toBe(0);
  });

  it("turns by a drag and stops when the pointer is up", async () => {
    const { root } = mounted();
    await frame();
    const volume = dial(root);
    const box = volume.getBoundingClientRect();
    const start = centre(volume);

    // a straight 40 px slide down the dial's middle: the right half turns clockwise, so +20 of 100
    pointer(volume, "pointerdown", { x: start.x, y: box.top + 10 }, 1);
    pointer(volume, "pointermove", { x: start.x, y: box.top + 50 }, 1);
    await frame();
    expect(value(volume)).toBe(85);
    expect(volume.getAttribute("data-dragging")).toBe("true");
    // the arc snaps to the hand instead of easing after it
    await waitFor(() => getComputedStyle(arc(root, "knob-arc")).transitionDuration === "0s");

    pointer(volume, "pointerup", { x: start.x, y: box.top + 50 }, 0);
    await frame();
    expect(volume.getAttribute("data-dragging")).toBe("false");
    await waitFor(() => getComputedStyle(arc(root, "knob-arc")).transitionDuration !== "0s");

    // the pointer keeps moving, but the drag is over: nothing changes
    pointer(volume, "pointermove", { x: start.x, y: box.top + 90 }, 0);
    await frame();
    expect(value(volume)).toBe(85);

    // and the end of the range is the end: a long slide clamps there
    pointer(volume, "pointerdown", { x: start.x, y: box.top + 10 }, 1);
    pointer(volume, "pointermove", { x: start.x, y: box.top + 400 }, 1);
    pointer(volume, "pointerup", { x: start.x, y: box.top + 400 }, 0);
    await frame();
    expect(value(volume)).toBe(100);
  });

  it("reaches the range with the pan dial's own step and word for the centre", async () => {
    const { root } = mounted();
    await frame();
    const pan = dial(root, 1);

    await press(pan, "ArrowUp");
    expect(value(pan)).toBe(5);
    expect(pan.getAttribute("aria-valuetext")).toBe("5 R");
    await press(pan, "ArrowUp");
    await press(pan, "ArrowDown");
    expect(value(pan)).toBe(5);
    await press(pan, "PageUp");
    expect(value(pan)).toBe(50);
    expect(pan.getAttribute("aria-valuetext")).toBe("50 R");
    await press(pan, "Home");
    expect(value(pan)).toBe(-50);
    expect(pan.getAttribute("aria-valuetext")).toBe("50 L");
  });

  it("draws the focus ring when Tab reaches the dial", async () => {
    const { root } = mounted();
    await frame();
    const volume = dial(root);

    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.keyboard("{Tab}");
    await frame();
    expect(document.activeElement).toBe(volume);
    const style = getComputedStyle(volume);
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(root.contains(document.activeElement)).toBe(true);
  });
});
