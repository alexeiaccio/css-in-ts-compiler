import { createFakeClock, harness, systemClock } from "@cssints/machine";
import { createMemo, createRoot, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { carouselClockDefinition, watchCarouselClock } from "./carousel.tsx";
import { type MountedCarousel, mountCarousel } from "./carousel.fixture";

// @cssints/headless checks `createCarousel` against specs/apg/carousel.qnt and the ported APG scenarios. This file is the
// skin's oracle: it mounts the starter in a real Chromium and drives the same controls a reader does. The skin's own parts
// (the named frame, the control row, the indicator, the arrow keys and the touch swipe) are only observable through the DOM,
// and its clock is only observable as the slide it moves.

/** Solid applies setters on the next flush, and the enter animation starts with it: two frames settle both. */
const settle = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const live: MountedCarousel[] = [];

const mounted = (options: Parameters<typeof mountCarousel>[0] = {}): MountedCarousel => {
  const instance = mountCarousel(options);
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
const rotation = (root: ParentNode): HTMLButtonElement =>
  part<HTMLButtonElement>(root, "carousel-rotation");

const label = (root: ParentNode): string | null => rotation(root).getAttribute("aria-label");

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

/** The pointer enters the frame: the primitive's `onMouseMove` is a real move, not a `mouseenter`. */
const hover = async (root: ParentNode): Promise<void> => {
  frame(root).dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  await settle();
};

/** The pointer leaves: `mouseleave` does not bubble, so it is dispatched on the frame itself. */
const leave = async (root: ParentNode): Promise<void> => {
  frame(root).dispatchEvent(new MouseEvent("mouseleave"));
  await settle();
};

// --- the clock without a browser ---------------------------------------------------------------------------------------

/**
 * The clock with the component's own host wiring on the harness's fake clock: `watchCarouselClock` is the shipped code, so
 * a race below is the component's, not a re-description of it.
 */
const wired = (interval = 1000) => {
  const h = harness(carouselClockDefinition(interval));
  let ticks = 0;
  watchCarouselClock(h.machine, {
    clock: h.clock,
    tick: () => {
      ticks += 1;
    },
  });
  return {
    h,
    ticks: () => ticks,
    play: (rotating: boolean) => h.send({ type: "play", rotating }),
    phase: () => h.machine.getState().state,
    wait: () => h.machine.effects()[0],
  };
};

describe("Carousel clock (harness)", () => {
  it("holds one wait while rotating and ticks once per interval", () => {
    const clock = wired();
    clock.play(true);

    expect(clock.phase()).toBe("waiting");
    expect(clock.h.machine.effects()).toHaveLength(1);
    expect(clock.h.clock.pending()).toBe(1);

    clock.h.advance(999);
    expect(clock.ticks()).toBe(0);
    clock.h.advance(1);
    expect(clock.ticks()).toBe(1);
    // the elapse issued the next wait in the same delivery: one timer, never two
    expect(clock.h.machine.effects()).toHaveLength(1);
    expect(clock.h.clock.pending()).toBe(1);

    clock.h.advance(1000);
    expect(clock.ticks()).toBe(2);
    expect(clock.h.machine.getState().context.ticks).toBe(2);
  });

  it("cancels the wait on a pause, so no elapse ever ticks", () => {
    const clock = wired();
    clock.play(true);
    clock.h.advance(500);

    clock.play(false);
    expect(clock.phase()).toBe("idle");
    expect(clock.h.machine.effects()).toHaveLength(0);
    expect(clock.h.clock.pending()).toBe(0);

    // the paused carousel's timer is gone, not merely ignored
    clock.h.advance(5000);
    expect(clock.ticks()).toBe(0);
    expect(clock.phase()).toBe("idle");
  });

  it("drops a stale elapse that arrives after the pause", () => {
    const clock = wired();
    clock.play(true);
    const abandoned = clock.wait();
    clock.play(false);
    expect(clock.h.cancelled()).toContain(abandoned?.id);

    // the race: the timer had already fired when the pause landed, so its completion is delivered late
    clock.h.send({ type: "elapse", id: abandoned?.id as number });
    expect(clock.phase()).toBe("idle");
    expect(clock.ticks()).toBe(0);
    expect(clock.h.machine.effects()).toHaveLength(0);

    const dropped = clock.h.log.at(-1);
    expect(dropped?.cancelled).toBe(true);
    expect(dropped?.to).toBeUndefined();
  });

  it("issues exactly one new wait on resume, and one tick per elapse", () => {
    const clock = wired();
    clock.play(true);
    clock.h.advance(400);
    clock.play(false);
    clock.play(true);

    expect(clock.phase()).toBe("waiting");
    expect(clock.h.machine.effects()).toHaveLength(1);
    expect(clock.h.clock.pending()).toBe(1);

    clock.h.advance(1000);
    expect(clock.ticks()).toBe(1);
    expect(clock.h.clock.pending()).toBe(1);
    clock.h.advance(1000);
    expect(clock.ticks()).toBe(2);
    expect(clock.h.clock.pending()).toBe(1);
  });

  it("does not restart or double a wait on a repeated play in the same direction", () => {
    const clock = wired();
    clock.play(true);
    const first = clock.wait();
    clock.h.advance(500);

    clock.play(true);
    expect(clock.wait()?.id).toBe(first?.id);
    expect(clock.h.clock.pending()).toBe(1);

    clock.h.advance(500);
    expect(clock.ticks()).toBe(1);
  });

  it("never issues an effect under reduced motion: the primitive reports rotating() false", () => {
    const clock = wired();
    // `createCarousel({ reducedMotion: true })` starts paused, so the host announces `rotating() === false` at mount
    clock.play(false);

    expect(clock.phase()).toBe("idle");
    expect(clock.h.machine.effects()).toHaveLength(0);
    expect(clock.h.clock.pending()).toBe(0);
    clock.h.advance(10_000);
    expect(clock.ticks()).toBe(0);
  });

  it("cancels the last wait when the carousel unmounts", () => {
    const clock = wired();
    clock.play(true);
    const last = clock.wait();

    clock.h.machine.destroy();
    expect(clock.h.cancelled()).toContain(last?.id);
    expect(clock.h.machine.effects()).toHaveLength(0);
    expect(clock.h.clock.pending()).toBe(0);
    expect(clock.ticks()).toBe(0);
  });

  it("needs no debounce: one pending wait is the coalescer", () => {
    expect(carouselClockDefinition(1000).debounce).toEqual({});
  });
});

describe("Carousel", () => {
  it("is a named carousel whose slides carry the primitive's semantics", () => {
    const { root } = mounted();

    expect(frame(root).getAttribute("role")).toBe("region");
    expect(frame(root).getAttribute("aria-label")).toBe("A gallery of five slides");
    expect(frame(root).getAttribute("aria-roledescription")).toBe("carousel");
    // it rotates at mount, so the primitive's live region is the quiet one
    expect(frame(root).getAttribute("aria-live")).toBe("off");

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

  // --- auto-rotation, on the clock the fixture injects -----------------------------------------------------------------

  it("advances one slide per interval on the clock", async () => {
    const clock = createFakeClock();
    const { root, controller } = mounted({ clock, interval: 1000 });
    await settle();

    expect(controller.phase()).toBe("waiting");
    expect(shownIndex(root)).toBe(0);

    clock.advance(1000);
    await settle();
    expect(shownIndex(root)).toBe(1);
    expect(controller.ticks()).toBe(1);

    clock.advance(2500);
    await settle();
    expect(controller.ticks()).toBe(3);
    expect(shownIndex(root)).toBe(3);
  });

  it("pauses while the pointer is over it, and the leave resumes the clock", async () => {
    const clock = createFakeClock();
    const { root, controller } = mounted({ clock, interval: 1000 });
    await settle();

    await hover(root);
    expect(controller.phase()).toBe("idle");
    expect(label(root)).toBe("Start automatic slide show");
    expect(clock.pending()).toBe(0);

    clock.advance(5000);
    await settle();
    expect(shownIndex(root)).toBe(0);
    expect(controller.ticks()).toBe(0);

    await leave(root);
    expect(controller.phase()).toBe("waiting");
    expect(label(root)).toBe("Stop automatic slide show");
    expect(clock.pending()).toBe(1);

    clock.advance(1000);
    await settle();
    expect(shownIndex(root)).toBe(1);
    expect(controller.ticks()).toBe(1);
  });

  it("keeps the control's label and the clock's phase in agreement", async () => {
    const clock = createFakeClock();
    const { root, controller } = mounted({ clock, interval: 1000 });
    await settle();
    const control = rotation(root);

    expect(label(root)).toBe("Stop automatic slide show");
    expect(controller.phase()).toBe("waiting");
    expect(frame(root).getAttribute("aria-live")).toBe("off");

    await click(control);
    expect(label(root)).toBe("Start automatic slide show");
    expect(controller.phase()).toBe("idle");
    expect(frame(root).getAttribute("aria-live")).toBe("polite");
    expect(clock.pending()).toBe(0);

    clock.advance(5000);
    await settle();
    expect(shownIndex(root)).toBe(0);

    await click(control);
    expect(label(root)).toBe("Stop automatic slide show");
    expect(controller.phase()).toBe("waiting");
    expect(clock.pending()).toBe(1);

    clock.advance(1000);
    await settle();
    expect(shownIndex(root)).toBe(1);
  });

  it("never advances under reduced motion: no timer, no phase", async () => {
    const clock = createFakeClock();
    const { root, controller } = mounted({ clock, interval: 1000, reducedMotion: true });
    await settle();

    expect(controller.phase()).toBe("idle");
    expect(clock.pending()).toBe(0);
    expect(label(root)).toBe("Start automatic slide show");
    expect(frame(root).getAttribute("aria-live")).toBe("polite");

    clock.advance(10_000);
    await settle();
    expect(shownIndex(root)).toBe(0);
    expect(controller.ticks()).toBe(0);
    expect(clock.pending()).toBe(0);
  });

  it("does not stop or restart the clock on a manual next", async () => {
    const clock = createFakeClock();
    const { root, controller } = mounted({ clock, interval: 1000 });
    await settle();
    const wait = controller.machine.effects()[0];

    clock.advance(600);
    await click(part<HTMLButtonElement>(root, "carousel-next"));
    expect(shownIndex(root)).toBe(1);
    // the same wait is live: the rotation was neither stopped nor re-timed by the manual move
    expect(controller.machine.effects()[0]?.id).toBe(wait?.id);

    // the original interval ends at 1000, not 1600: a restarted timer would not have fired yet
    clock.advance(400);
    await settle();
    expect(controller.ticks()).toBe(1);
    expect(shownIndex(root)).toBe(2);

    // and a previous is the same: the wait the tick issued is the one still live
    const nextWait = controller.machine.effects()[0];
    await click(part<HTMLButtonElement>(root, "carousel-prev"));
    expect(shownIndex(root)).toBe(1);
    expect(controller.machine.effects()[0]?.id).toBe(nextWait?.id);

    clock.advance(1000);
    await settle();
    expect(controller.ticks()).toBe(2);
    expect(shownIndex(root)).toBe(2);
  });

  it("hides the rotation control and holds no wait when auto-rotation is off", async () => {
    const clock = createFakeClock();
    const { root, controller } = mounted({ clock, autoRotate: false });
    await settle();

    expect(rotation(root).hasAttribute("hidden")).toBe(true);
    // the attribute has to mean hidden: no display in the control's class may override the UA's `[hidden] { display: none }`
    expect(getComputedStyle(rotation(root)).display).toBe("none");
    expect(controller.phase()).toBe("idle");
    expect(clock.pending()).toBe(0);
    clock.advance(5000);
    await settle();
    expect(shownIndex(root)).toBe(0);
  });

  it("re-runs a phase reader only for the phase, never for an unrelated tick", async () => {
    const clock = createFakeClock();
    const { controller } = mounted({ clock, interval: 1000 });
    await settle();

    let phaseRuns = 0;
    let tickRuns = 0;
    let phase = (): string => "";
    let ticks = (): number => 0;
    const dispose = createRoot((disposeRoot) => {
      phase = createMemo(() => {
        phaseRuns += 1;
        return controller.store.state.phase;
      });
      ticks = createMemo(() => {
        tickRuns += 1;
        return controller.store.state.ticks;
      });
      return disposeRoot;
    });

    expect(phase()).toBe("waiting");
    expect(ticks()).toBe(0);
    phaseRuns = 0;
    tickRuns = 0;

    clock.advance(1000);
    flush();
    await settle();
    // the reader of the field that changed re-ran; the phase's did not, because the elapse did not write it
    expect(ticks()).toBe(1);
    expect(tickRuns).toBe(1);
    expect(phase()).toBe("waiting");
    expect(phaseRuns).toBe(0);

    dispose();
  });

  it("cancels the pending wait when it unmounts", async () => {
    const clock = createFakeClock();
    const instance = mountCarousel({ clock, interval: 1000 });
    await settle();

    expect(clock.pending()).toBe(1);
    instance.dispose();
    expect(instance.controller.machine.effects()).toHaveLength(0);
    expect(clock.pending()).toBe(0);

    clock.advance(5000);
    expect(instance.controller.ticks()).toBe(0);
  });

  it("advances on the system clock when no clock is passed", async () => {
    // The real-timer path, and the only test that waits: 40 ms per interval against a 200 ms wait. It asserts that time
    // passed, never how much, so a loaded machine that runs the timers late still passes; a machine that is blocked for
    // the whole 200 ms has the same starvation of its own timer.
    const { root, controller } = mounted({ interval: 40, clock: systemClock });
    await settle();

    await new Promise((resolve) => setTimeout(resolve, 200));
    await settle();
    expect(controller.ticks()).toBeGreaterThan(0);
    expect(controller.phase()).toBe("waiting");
    // how many intervals elapsed is the machine's count; where the slides are follows it, wraps and all
    expect(shownIndex(root)).toBe(controller.ticks() % 5);
  });
});
