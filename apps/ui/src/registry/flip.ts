/** A row's box before the DOM changed, keyed by the element. */
export type Rects = ReadonlyMap<HTMLElement, DOMRect>;

/** Measure the rows before a reorder; the move itself changes their `top`. */
export const captureRects = (elements: Iterable<HTMLElement>): Rects => {
  const rects = new Map<HTMLElement, DOMRect>();
  for (const element of elements) {
    rects.set(element, element.getBoundingClientRect());
  }
  return rects;
};

export interface FlipOptions {
  /** Skip the animation entirely (a caller that knows the move should be instant). */
  readonly skip?: boolean;
  readonly duration?: number;
  readonly easing?: string;
}

/**
 * Play the difference between the captured boxes and where the rows are now: each one starts translated to its old place
 * and animates to none. Only `transform` is animated, so the browser keeps the move off the main thread; reduced motion and
 * a row that left the document are skipped.
 */
export const playFlip = (before: Rects, options: FlipOptions = {}): void => {
  if (options.skip === true || typeof window === "undefined") {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const duration = options.duration ?? 180;
  const easing = options.easing ?? "cubic-bezier(0.2, 0, 0, 1)";
  for (const [element, rect] of before) {
    if (!element.isConnected) {
      continue;
    }
    const now = element.getBoundingClientRect();
    const dx = rect.left - now.left;
    const dy = rect.top - now.top;
    if (dx === 0 && dy === 0) {
      continue;
    }
    element.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
      { duration, easing },
    );
  }
};
