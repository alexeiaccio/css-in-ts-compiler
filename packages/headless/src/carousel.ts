import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export type CarouselRole = "region" | "group";

/**
 * Options are read lazily (getters); pass a component's `props`.
 */
export interface CarouselOptions {
  /** Number of slides. */
  readonly items?: number;
  /** Controlled: the host owns the shown slide and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** Shown slide at mount (uncontrolled). */
  readonly defaultIndex?: number;
  /** Auto-rotation feature; false removes the rotation control. */
  readonly autoRotate?: boolean;
  /** Start rotating (ignored when `reducedMotion`). */
  readonly playing?: boolean;
  /** `prefers-reduced-motion` (or pause-on-load): start paused. */
  readonly reducedMotion?: boolean;
  /** Tabbed slide picker (tablist/tab/tabpanel) instead of plain groups. */
  readonly tabbed?: boolean;
  /** Pattern text: focus inside stops rotation until the control restarts it. */
  readonly stickyFocusPause?: boolean;
  /** Pointer starts over the carousel. */
  readonly hovering?: boolean;
  readonly role?: CarouselRole;
  readonly labelledBy?: string | undefined;
  /** Base for the generated ids. */
  readonly id?: string;
  /**
   * A request to show a slide, called when the intent differs from the current
   * index. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (index: number) => void;
  readonly onRotatingChange?: (rotating: boolean) => void;
}

/** Spread onto the rotation (play/pause) control. */
export interface CarouselRotationProps {
  readonly type: "button";
  readonly id: string;
  readonly "aria-label": string;
  readonly "aria-controls": string;
  readonly hidden: boolean;
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

/** Spread onto the previous / next controls. */
export interface CarouselButtonProps {
  readonly type: "button";
  readonly id: string;
  readonly "aria-controls": string;
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface CarouselProps {
  readonly role: CarouselRole;
  readonly "aria-roledescription": "carousel";
  readonly "aria-live": "off" | "polite";
  readonly "aria-labelledby": string | undefined;
  readonly onMouseMove: () => void;
  readonly onMouseLeave: () => void;
}

export interface CarouselSlideProps {
  readonly id: string;
  readonly role: "group" | "tabpanel";
  readonly "aria-roledescription": "slide";
  readonly "aria-label": string;
  readonly tabindex: 0 | -1;
  readonly hidden: boolean;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface CarouselTablistProps {
  readonly role: "tablist";
}

export interface CarouselTabProps {
  readonly id: string;
  readonly role: "tab";
  readonly "aria-label": string;
  readonly "aria-selected": "true" | "false";
  readonly "aria-controls": string;
  readonly tabindex: -1 | undefined;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface Carousel {
  readonly items: number;
  readonly current: Accessor<number>;
  readonly rotating: Accessor<boolean>;
  /** The part holding focus (`rotation`, `prev`, `tab:1`, `slide:0`), or null. */
  readonly focused: Accessor<string | null>;
  readonly next: () => void;
  readonly prev: () => void;
  readonly selectSlide: (index: number) => void;
  readonly toggleRotation: () => void;
  /** One auto-rotation interval. */
  readonly tick: () => void;
  readonly carouselProps: CarouselProps;
  readonly rotationProps: CarouselRotationProps;
  readonly prevProps: CarouselButtonProps;
  readonly nextProps: CarouselButtonProps;
  readonly slideProps: (index: number) => CarouselSlideProps;
  readonly tablistProps: CarouselTablistProps;
  readonly tabProps: (index: number) => CarouselTabProps;
}

/**
 * APG Carousel (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): state plus
 * prop objects for the rotation/prev/next controls, slides and the optional
 * tabbed picker. Auto-rotation pauses while focus or hover is inside (unless the
 * user explicitly started it); slides are `group` or `tabpanel`. No styling, no
 * elements. Checked against `specs/apg/carousel.qnt` by the scenario bridge.
 *
 * Platform: **hybrid** — CSS scroll-snap (widely) scrolls slides; the library
 * owns rotation control, pause-on-focus/hover, live region and slide semantics.
 *
 * The rotation/prev/next controls suppress the focus a mouse press would give
 * them (APG: activating a control does not move focus); tabs and slides still
 * take focus so the tab sequence can be walked.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default
 * (`defaultIndex`); pass `value` + `onValueChange` to own the shown slide.
 * `next`, `prev`, `selectSlide` and `tick` are requests too.
 *
 * ponytail: rotation advances only through the exposed `tick`; wire a real timer
 * (and `prefers-reduced-motion`) in the consumer.
 */
export const createCarousel = (options: CarouselOptions = {}): Carousel => {
  const items = Math.max(1, options.items ?? 6);
  const base = options.id ?? createUniqueId();
  const slidesId = `${base}-slides`;
  const autoRotate = (): boolean => options.autoRotate ?? true;
  const sticky = (): boolean => options.stickyFocusPause ?? true;

  const clampIndex = (index: number): number => Math.max(0, Math.min(index, items - 1));
  const [current, requestCurrent] = createControllable({
    value: () => (options.value === undefined ? undefined : clampIndex(options.value)),
    initial: clampIndex(options.defaultIndex ?? 0),
    onChange: () => options.onValueChange,
  });
  const [rotate, setRotate] = createSignal(
    autoRotate() && (options.playing ?? true) && !(options.reducedMotion ?? false),
  );
  const [forced, setForced] = createSignal(false);
  const [hover, setHover] = createSignal(options.hovering ?? false);
  const [inside, setInside] = createSignal(false);
  const [focused, setFocused] = createSignal<string | null>(null);
  // A mouse press gives focus to a control; that focus must not stop rotation
  // (APG: activating a control does not move focus).
  const [pointer, setPointer] = createSignal(false);

  const rotating = (): boolean => autoRotate() && rotate() && (forced() || (!inside() && !hover()));

  const focusIn = (target: string): void => {
    if (!pointer()) {
      if (!inside() && sticky()) {
        setRotate(false);
        setForced(false);
      }
      setInside(true);
    }
    setFocused(target);
  };
  const focusOut = (): void => {
    setInside(false);
    setFocused(null);
  };

  const selectSlide = (index: number): void => {
    if (index < 0 || index >= items) {
      return;
    }
    requestCurrent(index);
  };
  const next = (): void => selectSlide((current() + 1) % items);
  const prev = (): void => selectSlide((current() - 1 + items) % items);

  const toggleRotation = (): void => {
    if (!autoRotate()) {
      return;
    }
    // The user's activation toggles the *wanted* state; hover/focus only pause
    // a rotation that was not explicitly started.
    const went = autoRotate() && rotate();
    setRotate(!went);
    setForced(!went);
    options.onRotatingChange?.(!went);
  };

  const mousePress = (event: MouseEvent): void => {
    event.preventDefault();
    setPointer(true);
  };
  const releasePress = (): void => {
    setPointer(false);
  };

  return {
    items,
    current,
    rotating,
    focused,
    next,
    prev,
    selectSlide,
    toggleRotation,
    tick: () => {
      if (rotating()) {
        next();
      }
    },
    carouselProps: {
      role: options.role ?? "group",
      "aria-roledescription": "carousel",
      get "aria-live"() {
        return rotating() ? "off" : "polite";
      },
      "aria-labelledby": options.labelledBy,
      // A real pointer *move* rather than `mouseenter`: an element that appears
      // under a stationary pointer must not look hovered.
      onMouseMove: () => setHover(true),
      onMouseLeave: () => setHover(false),
    },
    rotationProps: {
      type: "button",
      id: `${base}-rotation`,
      get "aria-label"() {
        return rotating() ? "Stop automatic slide show" : "Start automatic slide show";
      },
      "aria-controls": slidesId,
      get hidden() {
        return !autoRotate();
      },
      onMouseDown: mousePress,
      onClick: () => {
        toggleRotation();
        releasePress();
      },
      onFocus: () => focusIn("rotation"),
      onBlur: focusOut,
    },
    prevProps: {
      type: "button",
      id: `${base}-prev`,
      "aria-controls": slidesId,
      onMouseDown: mousePress,
      onClick: () => {
        prev();
        releasePress();
      },
      onFocus: () => focusIn("prev"),
      onBlur: focusOut,
    },
    nextProps: {
      type: "button",
      id: `${base}-next`,
      "aria-controls": slidesId,
      onMouseDown: mousePress,
      onClick: () => {
        next();
        releasePress();
      },
      onFocus: () => focusIn("next"),
      onBlur: focusOut,
    },
    slideProps: (index) => ({
      id: `${base}-slide-${index}`,
      get role() {
        return options.tabbed === true ? "tabpanel" : "group";
      },
      "aria-roledescription": "slide",
      "aria-label": `${index + 1} of ${items}`,
      get tabindex() {
        return current() === index ? 0 : -1;
      },
      get hidden() {
        return current() !== index;
      },
      onFocus: () => focusIn(`slide:${index}`),
      onBlur: focusOut,
    }),
    tablistProps: { role: "tablist" },
    tabProps: (index) => ({
      id: `${base}-tab-${index}`,
      role: "tab",
      "aria-label": `Slide ${index + 1}`,
      get "aria-selected"() {
        return current() === index ? "true" : "false";
      },
      "aria-controls": `${base}-slide-${index}`,
      get tabindex() {
        return current() === index ? undefined : -1;
      },
      onClick: () => selectSlide(index),
      onFocus: () => focusIn(`tab:${index}`),
      onBlur: focusOut,
      onKeyDown: (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          const target = (current() + 1) % items;
          setFocused(`tab:${target}`);
          selectSlide(target);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          const target = (current() - 1 + items) % items;
          setFocused(`tab:${target}`);
          selectSlide(target);
        } else if (event.key === "Home") {
          setFocused("tab:0");
          selectSlide(0);
        } else if (event.key === "End") {
          setFocused(`tab:${items - 1}`);
          selectSlide(items - 1);
        }
      },
    }),
  };
};
