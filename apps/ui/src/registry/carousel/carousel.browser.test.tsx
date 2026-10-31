import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedCarousel, mountCarousel } from "./carousel.fixture";

// @cssints/headless checks `createCarousel` against specs/apg/carousel.qnt and the ported APG scenarios. This file is the
// skin's oracle: it mounts the starter in a real Chromium and drives the same controls a reader does. The skin's own parts
// (the named frame, the control row, the indicator, the arrow keys and the touch swipe) are only observable through the DOM.

/** Solid applies setters on the next flush, and the enter animation starts with it: two frames settle both. */
const settle = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const live: MountedCarousel[] = [];

const mounted = (): MountedCarousel => {
  const instance = mountCarousel();
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
    throw new Error(`carousel: no ${name}`);
  }
  return element;
};

const frame = (root: ParentNode): HTMLElement => part(root, "carousel");
const track = (root: ParentNode): HTMLElement => part(root, "carousel-track");
const count = (root: ParentNode): HTMLElement => part(root, "carousel-count");

const slides = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="carousel-slide"]'),
];

const dots = (root: ParentNode): HTMLButtonElement[] => [
  ...root.querySelectorAll<HTMLButtonElement>('[data-part="carousel-dot"]'),
];

const shown = (root: ParentNode): HTMLElement[] =>
  slides(root).filter((slide) => !slide.hasAttribute("hidden"));

const shownIndex = (root: ParentNode): number =>
  slides(root).indexOf(shown(root)[0] as HTMLElement);

const click = async (element: HTMLElement): Promise<void> => {
  element.click();
  await settle();
};

/** A key on a slide, as a reader's would arrive. */
const press = async (target: HTMLElement, key: string): Promise<void> => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settle();
};

const swipe = async (root: ParentNode, from: number, to: number): Promise<void> => {
  const element = track(root);
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      pointerType: "touch",
      clientX: from,
      bubbles: true,
      cancelable: true,
    }),
  );
  element.dispatchEvent(
    new PointerEvent("pointerup", {
      pointerType: "touch",
      clientX: to,
      bubbles: true,
      cancelable: true,
    }),
  );
  await settle();
};

describe("Carousel", () => {
  it("is a named carousel whose slides carry the primitive's semantics", () => {
    const { root } = mounted();

    expect(frame(root).getAttribute("role")).toBe("region");
    expect(frame(root).getAttribute("aria-label")).toBe("A gallery of five slides");
    expect(frame(root).getAttribute("aria-roledescription")).toBe("carousel");
    // auto-rotation is off, so the primitive's live region is the polite one
    expect(frame(root).getAttribute("aria-live")).toBe("polite");

    expect(slides(root)).toHaveLength(5);
    expect(slides(root).map((slide) => slide.getAttribute("aria-roledescription"))).toEqual(
      Array.from({ length: 5 }, () => "slide"),
    );
    expect(slides(root).map((slide) => slide.getAttribute("aria-label"))).toEqual([
      "1 of 5",
      "2 of 5",
      "3 of 5",
      "4 of 5",
      "5 of 5",
    ]);
    expect(slides(root)[0]?.getAttribute("role")).toBe("group");
    expect(shown(root)).toHaveLength(1);
    expect(shownIndex(root)).toBe(0);
    expect(slides(root)[0]?.tabIndex).toBe(0);
    expect(slides(root)[1]?.tabIndex).toBe(-1);
  });

  it("wires the controls to the track the primitive names", () => {
    const { root } = mounted();
    const next = part<HTMLButtonElement>(root, "carousel-next");
    const prev = part<HTMLButtonElement>(root, "carousel-prev");

    expect(next.getAttribute("aria-label")).toBe("Next slide");
    expect(prev.getAttribute("aria-label")).toBe("Previous slide");
    expect(next.getAttribute("aria-controls")).toBe(track(root).id);
    expect(prev.getAttribute("aria-controls")).toBe(track(root).id);
    expect(track(root).id).not.toBe("");
  });

  it("moves the shown slide with next and previous, and the indicator follows", async () => {
    const { root } = mounted();
    const next = part<HTMLButtonElement>(root, "carousel-next");
    const prev = part<HTMLButtonElement>(root, "carousel-prev");

    expect(count(root).textContent?.trim()).toBe("1 of 5");

    await click(next);
    expect(shownIndex(root)).toBe(1);
    expect(count(root).textContent?.trim()).toBe("2 of 5");
    expect(dots(root)[1]?.getAttribute("aria-current")).toBe("true");
    expect(dots(root)[0]?.hasAttribute("aria-current")).toBe(false);

    await click(next);
    expect(shownIndex(root)).toBe(2);
    expect(count(root).textContent?.trim()).toBe("3 of 5");

    await click(prev);
    expect(shownIndex(root)).toBe(1);
    expect(count(root).textContent?.trim()).toBe("2 of 5");
  });

  it("wraps at both ends, because the primitive never disables a control", async () => {
    const { root } = mounted();
    const next = part<HTMLButtonElement>(root, "carousel-next");
    const prev = part<HTMLButtonElement>(root, "carousel-prev");

    await click(prev);
    expect(shownIndex(root)).toBe(4);
    expect(count(root).textContent?.trim()).toBe("5 of 5");

    await click(next);
    expect(shownIndex(root)).toBe(0);
    expect(count(root).textContent?.trim()).toBe("1 of 5");
  });

  it("shows a slide when its dot is clicked", async () => {
    const { root } = mounted();

    await click(dots(root)[3] as HTMLButtonElement);
    expect(shownIndex(root)).toBe(3);
    expect(count(root).textContent?.trim()).toBe("4 of 5");
    expect(dots(root)[3]?.getAttribute("aria-current")).toBe("true");
    // the dot moved the shown slide, not the focus: a pointer press on the primitive's controls does not take it
    expect(document.activeElement).not.toBe(dots(root)[3]);
  });

  it("moves with the arrow keys while a slide has the focus", async () => {
    const { root } = mounted();
    const first = slides(root)[0] as HTMLElement;
    first.focus();
    expect(document.activeElement).toBe(first);

    await press(first, "ArrowRight");
    expect(shownIndex(root)).toBe(1);
    // the slide the key was pressed on is hidden now, so the focus follows the slide that is shown
    expect(document.activeElement).toBe(slides(root)[1]);

    await press(slides(root)[1] as HTMLElement, "ArrowLeft");
    expect(shownIndex(root)).toBe(0);
    expect(document.activeElement).toBe(slides(root)[0]);

    await press(slides(root)[0] as HTMLElement, "ArrowLeft");
    expect(shownIndex(root)).toBe(4);
    expect(document.activeElement).toBe(slides(root)[4]);
  });

  it("changes slide on a touch swipe, and leaves a mouse drag alone", async () => {
    const { root } = mounted();

    await swipe(root, 320, 200);
    expect(shownIndex(root)).toBe(1);

    await swipe(root, 200, 320);
    expect(shownIndex(root)).toBe(0);

    // a mouse drag is a selection, not a gesture the carousel takes
    track(root).dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerType: "mouse",
        clientX: 320,
        bubbles: true,
        cancelable: true,
      }),
    );
    track(root).dispatchEvent(
      new PointerEvent("pointerup", {
        pointerType: "mouse",
        clientX: 200,
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(shownIndex(root)).toBe(0);
  });
});
