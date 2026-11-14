import { type Accessor, createSignal } from "solid-js";

export interface ScrollProgressOptions {
  /**
   * The scroll container; the document by default. Read when `attach` runs, so a
   * host that swaps containers attaches again.
   */
  readonly root?: (() => HTMLElement | undefined) | undefined;
  /** The axis the scroll runs on. @default "block" */
  readonly axis?: "block" | "inline" | undefined;
  /** The progress changed, 0 to 1. */
  readonly onChange?: ((progress: number) => void) | undefined;
}

export interface ScrollProgressBarProps {
  readonly role: "progressbar";
  readonly "aria-valuemin": 0;
  readonly "aria-valuemax": 100;
  /** The rounded percentage; 100 when there is nothing to scroll (the whole page is read). */
  readonly "aria-valuenow": number;
}

export interface ScrollProgress {
  /** 0 at the top, 1 at the end; 1 when the container cannot scroll. */
  readonly progress: Accessor<number>;
  /** The distance scrolled, in px. */
  readonly scrolled: Accessor<number>;
  /** How far the container can scroll, in px; 0 when it cannot. */
  readonly distance: Accessor<number>;
  /**
   * The bar: `role="progressbar"` with the rounded percentage. A decorative
   * bar drops the role after the spread; the value stays exact either way.
   */
  readonly barProps: ScrollProgressBarProps;
  /**
   * DOM wiring: one passive `scroll` listener on the root, one
   * `ResizeObserver` for the content's length, and one sync (a page opened
   * mid-scroll starts correct). Call it once mounted; it returns the teardown.
   */
  readonly attach: () => () => void;
}

/**
 * The scroll position of a container as a fraction, for a reading-progress bar
 * or a value a canvas renders by hand. Plain signals and one listener, no
 * animation: this is what drives a bar where `animation-timeline: scroll()` is
 * missing (`@cssints/reveal`'s `progress()` draws it natively where it exists),
 * and what gives the bar its `progressbar` role.
 *
 * **No APG pattern exists for a progress bar driven by scrolling**, so there is
 * no Quint spec and no ported scenarios: the contract is WAI-ARIA
 * (`role="progressbar"`, `aria-valuemin`/`max`/`now`) and HTML, and
 * `test/scrollprogress.browser.test.tsx` is the oracle.
 *
 * **A listener, not `ScrollTimeline`.** The native timeline reports a progress
 * only inside a CSS animation; reading it in script would take an `Animation`
 * whose `currentTime` is the same arithmetic this does, with a promise to wait
 * for. The listener is passive and the reads are layout-free (`scrollTop`,
 * `scrollHeight`), so a dozen pages of reads cost less than the bar's paint.
 *
 * **A short page is complete.** Nothing to scroll means everything is on
 * screen, so the value is 1 and not an indeterminate bar: a reading bar that
 * says "unknown" on a page with no reading left would be a lie.
 */
export const createScrollProgress = (options: ScrollProgressOptions = {}): ScrollProgress => {
  const [progress, setProgress] = createSignal(1);
  const [scrolled, setScrolled] = createSignal(0);
  const [distance, setDistance] = createSignal(0);

  const measure = (): { readonly at: number; readonly of: number } => {
    const element = options.root?.();
    if (element === undefined) {
      const page = document.scrollingElement ?? document.documentElement;
      const of =
        options.axis === "inline"
          ? page.scrollWidth - page.clientWidth
          : page.scrollHeight - page.clientHeight;
      const at = options.axis === "inline" ? window.scrollX : window.scrollY;
      return { at, of };
    }
    return options.axis === "inline"
      ? { at: element.scrollLeft, of: element.scrollWidth - element.clientWidth }
      : { at: element.scrollTop, of: element.scrollHeight - element.clientHeight };
  };

  const commit = (): void => {
    const { at, of } = measure();
    const reach = Math.max(0, of);
    const value = reach === 0 ? 1 : Math.min(1, Math.max(0, at / reach));
    if (value === progress() && reach === distance()) {
      return;
    }
    setScrolled(at);
    setDistance(reach);
    setProgress(value);
    options.onChange?.(value);
  };

  return {
    progress,
    scrolled,
    distance,
    barProps: {
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      get "aria-valuenow"() {
        return Math.round(progress() * 100);
      },
    },
    attach: () => {
      const element = options.root?.();
      const target: EventTarget = element ?? document;
      const listener = (): void => commit();
      target.addEventListener("scroll", listener, { passive: true });
      // a window listener misses a nested pane whose content grows without a
      // viewport change, so the observer watches what is actually scrolled
      const observed = element ?? document.documentElement;
      const observer = new ResizeObserver(() => commit());
      observer.observe(observed);
      commit();
      return () => {
        target.removeEventListener("scroll", listener);
        observer.disconnect();
      };
    },
  };
};
