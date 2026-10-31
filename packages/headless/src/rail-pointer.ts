export type SliderOrientation = "horizontal" | "vertical";
export type SliderDirection = "ltr" | "rtl";

/** The pointer a drag belongs to and the rail it reads its position from. */
export interface RailDrag {
  readonly element: Element;
  readonly pointerId: number;
}

// Capture throws on a synthetic pointer (a test, or a pointer that is not
// active); the drag still works, it just does not survive leaving the rail.
const capture = (element: Element, pointerId: number): void => {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // no active pointer to capture
  }
};

const release = (element: Element, pointerId: number): void => {
  try {
    element.releasePointerCapture(pointerId);
  } catch {
    // the capture is already gone (pointerup / lostpointercapture end a drag too)
  }
};

/**
 * The fraction of the rail a pointer is at, 0..1, for both orientations and
 * both directions. The rail press and every drag move of both sliders go
 * through this one function, so a drag cannot land where a press would not;
 * direction flips only the horizontal axis, as the arrow keys do (up is more on
 * a vertical rail whatever the direction).
 */
export const railPosition = (
  event: PointerEvent,
  rect: DOMRect,
  orientation: SliderOrientation,
  direction: SliderDirection,
): number => {
  const along =
    orientation === "vertical"
      ? 1 - (event.clientY - rect.top) / rect.height // up is more
      : (event.clientX - rect.left) / rect.width; // right is more in ltr
  return orientation === "horizontal" && direction === "rtl" ? 1 - along : along;
};

/** `railPosition` of `event` on `element`'s box, or `undefined` when it has no length yet. */
export const railPositionAt = (
  event: PointerEvent,
  element: Element,
  orientation: SliderOrientation,
  direction: SliderDirection,
): number | undefined => {
  const rect = element.getBoundingClientRect();
  const length = orientation === "vertical" ? rect.height : rect.width;
  return length > 0 ? railPosition(event, rect, orientation, direction) : undefined;
};

/**
 * Starts a drag from a rail press: only the primary button, only a real element,
 * and the capture keeps the moves coming when the pointer leaves the rail.
 * `undefined` means this press is not a drag.
 */
export const beginRailDrag = (event: PointerEvent): RailDrag | undefined => {
  // a secondary click (a context menu, a middle click) is not a press
  if (event.button !== 0) {
    return undefined;
  }
  const element = event.currentTarget;
  if (!(element instanceof Element)) {
    return undefined;
  }
  // the newest press owns the drag; the browser releases the old capture
  capture(element, event.pointerId);
  return { element, pointerId: event.pointerId };
};

/**
 * Ends `drag` when `event` is its pointer's up, cancel or lost capture;
 * returns the drag that is still running, if any.
 */
export const endRailDrag = (
  drag: RailDrag | undefined,
  event: PointerEvent,
): RailDrag | undefined => {
  if (drag === undefined || drag.pointerId !== event.pointerId) {
    return drag;
  }
  release(drag.element, event.pointerId);
  return undefined;
};
