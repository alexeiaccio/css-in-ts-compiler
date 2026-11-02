import { createCarousel, type CarouselRole } from "@cssints/headless";
import {
  type Clock,
  createMachine,
  defineMachine,
  type Machine,
  systemClock,
} from "@cssints/machine";
import { type MachineStore, createMachineStore } from "@cssints/machine/solid";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, For, merge, onCleanup, untrack } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export interface CarouselProps {
  /**
   * The slides, in order. Their number is read once, when the primitive is created: a page that adds a slide makes a new
   * carousel (the slide ids and the "1 of 5" labels are made from it).
   */
  readonly slides: ReadonlyArray<JSX.Element>;
  /** The accessible name of the carousel; ignored while `labelledBy` names it. @default "Carousel" */
  readonly label?: string | undefined;
  /** The id of the heading that names the carousel, when the page has one in sight. */
  readonly labelledBy?: string | undefined;
  /** The landmark wrapper: a named `region` is one a reader can jump to. @default "region" */
  readonly role?: CarouselRole;
  /** Shown slide at mount (uncontrolled). @default 0 */
  readonly defaultIndex?: number | undefined;
  /** Controlled: the host owns the shown slide and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** A request to show a slide: uncontrolled it is accepted, controlled the host may ignore it. */
  readonly onValueChange?: ((index: number) => void) | undefined;
  /**
   * Auto-rotation, on by default as in the primitive: the clock advances the slide every `interval`, and the rotation
   * control stops and starts it. `false` removes the control and leaves a paused carousel.
   */
  readonly autoRotate?: boolean | undefined;
  /** One rotation interval in ms, read once when the carousel is created. @default 6000 */
  readonly interval?: number | undefined;
  /** The motion preference; left out, `prefers-reduced-motion: reduce` is read once, when the carousel is created. */
  readonly reducedMotion?: boolean | undefined;
  /** The clock's clock: the system one by default, a fake one in a test. */
  readonly clock?: Clock | undefined;
  /** The clock, once: a test reads its phase and its tick count; a page rarely does. */
  readonly onReady?: (controller: CarouselClockController) => void;
  /** The line under the carousel; left out, the keys and the swipe in one sentence. */
  readonly hint?: string | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_HINT =
  "Use the previous and next buttons, or the arrow keys when a slide has focus; on a touch screen, swipe.";

// The frame is the surface: the track and the control row sit on it, and the radius and the border are the kit's.
const frameClass = css.cn(
  css.display("grid"),
  css.gap(t.space._2),
  css.padding(t.space._2),
  css.boxSizing("border-box"),
  css.color(t.color.text),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
);

// The primitive hides every slide but the current one (`hidden`), so the track is a stack, not a scroll-snap strip: all
// slides share one grid cell and only the current one is displayed. The skin must not translate the track or turn the
// slides into a row, or a hidden slide would be reachable and the slide labels would stop matching what is on screen.
const trackClass = css.cn(
  css.display("grid"),
  css.overflow("hidden"),
  css.borderRadius(t.radius.lg),
  css.bg(t.color.page),
  // the swipe is the skin's horizontal gesture, so the browser keeps the vertical pan
  css.touchAction("pan-y"),
);

const slideClass = css.cn(css.gridArea("1 / 1"), css.minWidth("0"));

// The enter is the skin's, and only for a reader who allows motion: the active slide is displayed again on every change, so
// the animation restarts with it. There is no transition on the track itself.
const enter = css.keyframes({
  from: css.cn(css.opacity(0), css.transform("translateX(12px)")),
  to: css.cn(css.opacity(1), css.transform("none")),
});

const slideMotion = css.media("(prefers-reduced-motion: no-preference)")(
  css.animation(enter, "220ms", "ease-out"),
);

const barClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
  css.padding("0", t.space._1, t.space._1),
);

const controlClass = css.cn(
  css.appearance("none"),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.width(t.space._7),
  css.height(t.space._7),
  css.margin("0"),
  css.padding("0"),
  css.border("1px solid", t.color.border),
  css.borderRadius("999px"),
  css.bg(t.color.buttonBackground),
  css.color(t.color.text),
  css.fontSize(t.font.sizeLg),
  css.lineHeight(1),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackgroundPressed), css.borderColor(t.color.borderHover)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

// The rotation control and the previous button sit together at the bar's start; the indicator keeps the middle, the next
// button the end.
const startClass = css.cn(css.display("flex"), css.alignItems("center"), css.gap(t.space._1));

const indicatorClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.gap(t.space._1),
);

// A dot is the visible 8 px mark inside a 24 px button: the pointer target is the WCAG 2.2 minimum, the mark is the
// indicator. The active dot reads `aria-current`, the state the button announces.
const dotClass = css.cn(
  css.appearance("none"),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.width(t.space._6),
  css.height(t.space._6),
  css.padding("0"),
  css.border("none"),
  css.borderRadius("999px"),
  css.bg("transparent"),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const dotMarkClass = css.cn(
  css.width(t.space._2),
  css.height(t.space._2),
  css.borderRadius("999px"),
  css.border("1px solid", t.color.border),
  css.bg(t.color.surface),
);

const dotMarkActiveClass = css.cn(css.bg(t.color.highlight), css.borderColor(t.color.highlight));

const countClass = css.cn(
  css.minWidth(t.space._10),
  css.textAlign("center"),
  css.fontSize(t.font.sizeSm),
  css.fontVariantNumeric("tabular-nums"),
  css.color(t.color.muted),
);

const hintClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._2, t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

/** A swipe past this many px is a slide change; below it the pointer was a tap or an accidental drag. */
const SWIPE_THRESHOLD = 40;

/** One rotation interval: how long a slide stays before the clock advances it. */
export const CAROUSEL_INTERVAL = 6000;

// ponytail: a module constant, not a theme token: a token would let the theme retime the autoplay, and no page has asked;
// the `interval` prop already retimes one carousel. Promote it when the theme should decide.

/** The clock's two states: no interval is pending, or one is. */
export type CarouselClockPhase = "idle" | "waiting";

/** The clock's context: how many intervals have elapsed. */
export interface CarouselClockContext {
  readonly ticks: number;
}

// a type alias, not an interface: `PayloadMap` is an index signature, and only an alias is assignable to one
type CarouselClockPayloads = {
  readonly play: { readonly rotating: boolean };
  readonly elapse: { readonly id: number };
};

/** The clock's events: the primitive's rotation state, and the completion of a wait. */
export type CarouselClockEvent =
  | { readonly type: "play"; readonly rotating: boolean }
  | { readonly type: "elapse"; readonly id: number };

/** The running clock, as the components and their tests name it. */
export type CarouselClockMachine = Machine<
  CarouselClockContext,
  CarouselClockPhase,
  CarouselClockEvent
>;

/**
 * The auto-rotation clock as data: while the primitive is rotating it holds one `wait` effect (`{ type: "wait", ms }`),
 * and its completion calls `tick()` and issues the next wait. It is only the clock: the APG pauses — the pointer, the
 * focus, the sticky focus, the control's intent — are `createCarousel`'s `rotating()`, which this follows exactly as the
 * overlays follow `open()`. A pause leaves `waiting` and cancels the pending wait; a resume enters it again with one new
 * wait. A completion that arrives after its wait was cancelled carries the dead handle's id and is dropped before any
 * transition. There is no debounce: one pending wait is the coalescer, and a second `play` in the same direction is a
 * state with no transition, so it neither restarts nor doubles the timer.
 */
export const carouselClockDefinition = (ms: number) =>
  defineMachine<CarouselClockPayloads>()({
    start: "idle",
    initial: { ticks: 0 },
    states: {
      idle: {
        on: {
          play: {
            guard: (_context, event) => event.type === "play" && event.rotating,
            target: "waiting",
            effect: { type: "wait", ms },
          },
        },
      },
      waiting: {
        on: {
          play: {
            guard: (_context, event) => event.type === "play" && !event.rotating,
            target: "idle",
          },
          elapse: {
            target: "waiting",
            assign: (context) => ({ ticks: context.ticks + 1 }),
            effect: { type: "wait", ms },
          },
        },
      },
    },
  });

/**
 * The host's half of the clock: one timer per `wait`, cleared when its handle is cancelled, and one `tick` for each
 * elapsed wait. It is plain code so the harness can drive the shipped wiring on its fake clock.
 */
export const watchCarouselClock = (
  machine: CarouselClockMachine,
  options: { readonly clock: Clock; readonly tick: () => void },
): void => {
  const timers = new Map<number, unknown>();
  machine.onEffect((handle) => {
    if (handle.type !== "wait") {
      return;
    }
    const timer = options.clock.setTimeout(() => {
      timers.delete(handle.id);
      machine.send({ type: "elapse", id: handle.id });
    }, Number(handle.spec.ms));
    timers.set(handle.id, timer);
  });
  machine.onCancel((handle) => {
    const timer = timers.get(handle.id);
    if (timer === undefined) {
      return;
    }
    timers.delete(handle.id);
    options.clock.clearTimeout(timer);
  });
  // The tick is a completion's consequence, and the machine records the transition before it announces the effects, so
  // the slide moves before the next wait is timed.
  machine.onTransition((record) => {
    if (record.taken && record.event === "elapse") {
      options.tick();
    }
  });
};

/** The clock as the component and its tests read it. */
export interface CarouselClockController {
  readonly machine: CarouselClockMachine;
  readonly store: MachineStore<CarouselClockContext, CarouselClockPhase, CarouselClockEvent>;
  /** `waiting` exactly while the primitive is rotating. */
  readonly phase: () => CarouselClockPhase;
  /** How many intervals have elapsed. */
  readonly ticks: () => number;
}

/** What the clock needs from its host: the primitive's rotation state, what one interval does, the duration and the clock. */
interface CarouselClockOptions {
  readonly rotating: () => boolean;
  readonly tick: () => void;
  readonly interval?: number | undefined;
  readonly clock?: Clock | undefined;
}

/**
 * Run the clock for one carousel. Call it in a component body: the store and its projections belong to the component, and
 * disposing it cancels the last wait.
 */
const createCarouselClock = (options: CarouselClockOptions): CarouselClockController => {
  const clock = untrack(() => options.clock) ?? systemClock;
  const machine: CarouselClockMachine = createMachine(
    carouselClockDefinition(options.interval ?? CAROUSEL_INTERVAL),
    { clock },
  );
  watchCarouselClock(machine, { clock, tick: options.tick });
  const store = createMachineStore(machine);

  // The machine follows the primitive, as the overlays follow `open()`: the direction is the primitive's `rotating()`,
  // never an intent of its own. The delivery is a microtask because an effect (and the component's render) runs in an
  // owned scope, where the store refuses a write; the first run is a change like any other, so a carousel that rotates at
  // mount holds its wait one microtask later. A repeat of the last direction is not delivered at all.
  let announced: boolean | undefined;
  const announce = (rotating: boolean): void => {
    if (rotating === announced) {
      return;
    }
    announced = rotating;
    machine.send({ type: "play", rotating });
  };
  createEffect(
    () => options.rotating(),
    (rotating) => {
      queueMicrotask(() => announce(rotating));
    },
  );

  // destroying is what cancels the last wait: its handle's cancellation clears the timer (the listeners are still
  // attached — the machine drops them itself)
  onCleanup(() => machine.destroy());

  return {
    machine,
    store,
    phase: () => store.state.phase,
    ticks: () => store.state.ticks,
  };
};

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A carousel, styled: `createCarousel` owns the shown slide, the next / previous requests, the slide semantics (`group` or
 * `tabpanel`, `aria-roledescription="slide"`, `aria-label="2 of 5"`), the hover / focus pause and the live `aria-live` the
 * frame announces; the skin owns the frame and the control row, the indicator, the enter animation that honours reduced
 * motion, and the two gestures the primitive leaves to the host: the arrow keys on a focused slide and a touch swipe.
 *
 * The primitive hides every slide but the current one, so the track is a stack and the skin does not translate it; a page
 * that wants a scrolling strip uses its own markup.
 *
 * Auto-rotation is back, on `@cssints/machine` and on by default as in the primitive: the clock holds one `wait` while the
 * primitive is `rotating()`, and its elapse calls `tick()`. Every pause — the pointer, the focus, the sticky focus, the
 * rotation control — stays in `createCarousel`, and the clock only follows it, so the control's label and the clock's
 * phase cannot disagree. A reduced-motion preference is read once and starts the carousel paused.
 */
export const Carousel = (props: CarouselProps): JSX.Element => {
  const carousel = createCarousel({
    items: props.slides.length,
    role: props.role ?? "region",
    labelledBy: props.labelledBy,
    defaultIndex: props.defaultIndex,
    get value() {
      return props.value;
    },
    get onValueChange() {
      return props.onValueChange;
    },
    get autoRotate() {
      return props.autoRotate ?? true;
    },
    reducedMotion: untrack(() => props.reducedMotion) ?? prefersReducedMotion(),
  });
  const clock = createCarouselClock({
    rotating: carousel.rotating,
    tick: carousel.tick,
    interval: untrack(() => props.interval),
    clock: props.clock,
  });
  untrack(() => props.onReady)?.(clock);

  let track: HTMLDivElement | undefined;
  /** An arrow key asked for the focus to follow the slide it showed. */
  let followFocus = false;

  /** Focus the slide that is current now: an arrow key hides the slide it was pressed on. */
  const focusCurrent = (): void => {
    track?.querySelector<HTMLElement>('[data-part="carousel-slide"][tabindex="0"]')?.focus();
  };

  // the current slide changed: once its tab stop is in place, an arrow key's focus follows it
  createEffect(
    () => carousel.current(),
    () => {
      if (followFocus) {
        followFocus = false;
        focusCurrent();
      }
    },
  );

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const target = event.target;
    // the keys belong to the slides, not to a field or a button a slide may hold
    if (!(target instanceof HTMLElement) || !target.closest('[data-part="carousel-slide"]')) {
      return;
    }
    if (target.closest('input, textarea, select, [contenteditable="true"]') !== null) {
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      followFocus = carousel.current() !== (carousel.current() + 1) % carousel.items;
      carousel.next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      followFocus =
        carousel.current() !== (carousel.current() - 1 + carousel.items) % carousel.items;
      carousel.prev();
    }
  };

  // The swipe is touch-only: a mouse drag on a slide stays a selection, and the buttons are the pointer's way.
  let startX: number | undefined;
  const onPointerDown = (event: PointerEvent): void => {
    startX = event.pointerType === "touch" ? event.clientX : undefined;
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (startX === undefined) {
      return;
    }
    const distance = event.clientX - startX;
    startX = undefined;
    if (Math.abs(distance) < SWIPE_THRESHOLD) {
      return;
    }
    if (distance < 0) {
      carousel.next();
    } else {
      carousel.prev();
    }
  };
  const onPointerCancel = (): void => {
    startX = undefined;
  };

  const trackProps = {
    id: carousel.prevProps["aria-controls"],
    "data-part": "carousel-track",
    onKeyDown,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    get class() {
      return trackClass;
    },
  };

  const next = merge(carousel.nextProps, {
    "data-part": "carousel-next",
    "aria-label": "Next slide",
    get class() {
      return controlClass;
    },
  });

  const prev = merge(carousel.prevProps, {
    "data-part": "carousel-prev",
    "aria-label": "Previous slide",
    get class() {
      return controlClass;
    },
  });

  // The primitive's own rotation control: its label is "Stop automatic slide show" exactly while `rotating()`, which is
  // the clock's `waiting`. It is hidden when `autoRotate` is off, as the APG asks (no rotation, no control).
  const rotation = merge(carousel.rotationProps, {
    "data-part": "carousel-rotation",
    get class() {
      return controlClass;
    },
  });

  return (
    <div
      {...carousel.carouselProps}
      data-part="carousel"
      aria-label={props.labelledBy === undefined ? (props.label ?? "Carousel") : undefined}
      class={css.cn(frameClass, props.class)}
    >
      <div
        {...trackProps}
        ref={(element: HTMLDivElement) => {
          track = element;
        }}
      >
        <For each={props.slides}>
          {(slide, index) => (
            <div
              {...carousel.slideProps(index())}
              data-part="carousel-slide"
              class={css.cn(slideClass, slideMotion)}
            >
              {slide}
            </div>
          )}
        </For>
      </div>
      <div data-part="carousel-bar" class={barClass}>
        <div data-part="carousel-start" class={startClass}>
          <button {...rotation}>
            <span aria-hidden="true">{carousel.rotating() ? "❚❚" : "▶"}</span>
          </button>
          <button {...prev}>
            <span aria-hidden="true">‹</span>
          </button>
        </div>
        <div data-part="carousel-indicator" class={indicatorClass}>
          <For each={props.slides}>
            {(_, index) => (
              <button
                type="button"
                data-part="carousel-dot"
                aria-label={`Go to slide ${index() + 1}`}
                aria-current={carousel.current() === index() ? "true" : undefined}
                class={dotClass}
                onClick={() => carousel.selectSlide(index())}
              >
                <span
                  aria-hidden="true"
                  class={css.cn(
                    dotMarkClass,
                    carousel.current() === index() ? dotMarkActiveClass : "",
                  )}
                />
              </button>
            )}
          </For>
          <span data-part="carousel-count" class={countClass}>
            {`${carousel.current() + 1} of ${carousel.items}`}
          </span>
        </div>
        <button {...next}>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <p data-part="carousel-hint" class={hintClass}>
        {props.hint ?? DEFAULT_HINT}
      </p>
    </div>
  );
};
