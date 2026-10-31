import { createCarousel, type CarouselRole } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, For, merge } from "solid-js";

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

/**
 * A carousel, styled: `createCarousel` owns the shown slide, the next / previous requests, the slide semantics (`group` or
 * `tabpanel`, `aria-roledescription="slide"`, `aria-label="2 of 5"`), the hover / focus pause and the live `aria-live` the
 * frame announces; the skin owns the frame and the control row, the indicator, the enter animation that honours reduced
 * motion, and the two gestures the primitive leaves to the host: the arrow keys on a focused slide and a touch swipe.
 *
 * The primitive hides every slide but the current one, so the track is a stack and the skin does not translate it; a page
 * that wants a scrolling strip uses its own markup. Auto-rotation is off: the primitive advances only through `tick`, which
 * needs a timer the page owns.
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
    // no timer: a control that starts a rotation nothing advances would lie, and a paused carousel is the honest default
    autoRotate: false,
  });

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
        <button {...prev}>
          <span aria-hidden="true">‹</span>
        </button>
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
