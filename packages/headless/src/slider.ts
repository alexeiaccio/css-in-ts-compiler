import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export type SliderOrientation = "horizontal" | "vertical";
export type SliderDirection = "ltr" | "rtl";

export interface SliderOptions {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** The jump distance of PageUp / PageDown. */
  readonly largeStep?: number;
  /** Controlled: the host owns the value and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** Starting value when uncontrolled; ignored while `value` is set. */
  readonly defaultValue?: number;
  readonly orientation?: SliderOrientation;
  readonly direction?: SliderDirection;
  /**
   * aria-disabled: the thumb stays the tab stop (the APG pattern's focus
   * contract) but a key or a rail press changes nothing.
   */
  readonly disabled?: boolean;
  /** Base for the generated thumb id. */
  readonly id?: string;
  /**
   * A request to change the value, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (value: number) => void;
}

export interface SliderThumbProps {
  readonly id: string;
  readonly role: "slider";
  readonly "aria-valuenow": string;
  readonly "aria-valuemin": string;
  readonly "aria-valuemax": string;
  readonly "aria-valuetext": string;
  readonly "aria-orientation": SliderOrientation;
  readonly "aria-disabled": "true" | undefined;
  readonly tabindex: number;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  /** Marks the press so the rail does not jump (the thumb is already at the value). */
  readonly onPointerDown: (event: PointerEvent) => void;
}

/**
 * Spread onto the rail, which must contain the thumb: the rail owns the drag
 * whichever element took the press, so the moves and the release are here.
 */
export interface SliderTrackProps {
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
  readonly onPointerCancel: (event: PointerEvent) => void;
  readonly onLostPointerCapture: (event: PointerEvent) => void;
}

export interface Slider {
  readonly value: Accessor<number>;
  readonly focused: Accessor<boolean>;
  /** Requests; `setValue` and a rail press are requests too. */
  readonly setValue: (value: number) => void;
  readonly focus: () => void;
  readonly blur: () => void;
  /** Returns whether the key moved the value (the caller preventDefaults it). */
  readonly keyDown: (key: string) => boolean;
  /** A rail press or a drag move at `position` (a 0..1 fraction of the rail). */
  readonly pointerDown: (position: number) => void;
  readonly thumbProps: SliderThumbProps;
  readonly trackProps: SliderTrackProps;
}

const valueTextFor = (value: number): string =>
  value <= 3 ? "low" : value <= 7 ? "medium" : "high";

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
 * APG Slider (https://www.w3.org/WAI/ARIA/apg/patterns/slider/): a single
 * `role=slider` thumb on a rail. Plain Solid signals, no elements, no styling;
 * verified against `specs/apg/slider.qnt` by the differential walk in
 * `test/slider.browser.test.tsx`.
 *
 * Native / polyfill / hybrid / library: **native** — the platform
 * `<input type=range>` already owns this pattern; this primitive is the
 * `role=slider` markup and keyboard contract for hosts that need the ARIA
 * element (styling the native thumb is not shipped).
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the value. A key, a rail press and a
 * drag are requests the host may ignore.
 *
 * A press on the rail jumps to the pointer and starts a drag: while the pointer
 * is held the value follows its position on the rail, and `pointerup`,
 * `pointercancel` or a lost capture ends it. The rail owns the drag whichever
 * element took the press (the thumb's press bubbles to it), with pointer
 * capture, so a drag keeps working off the rail and a host cleans up nothing.
 *
 * `disabled` is a widget-level extension of the pattern (the spec lists it
 * under its deliberate omissions): the thumb keeps its tab stop and announces
 * `aria-disabled`, and every key, rail press and drag is dropped before it
 * becomes a request.
 *
 * The spec fixes a discrete rail press and has no pointer position, so the drag
 * is a deliberate extension too: `test/slider.browser.test.tsx` is its oracle.
 */
export const createSlider = (options: SliderOptions = {}): Slider => {
  const min = options.min ?? 0;
  const max = options.max ?? 10;
  const step = options.step ?? 1;
  const largeStep = options.largeStep ?? 3;
  const base = options.id ?? createUniqueId();

  const clamp = (value: number): number => Math.max(min, Math.min(max, value));
  const [value, request] = createControllable({
    value: () => options.value,
    initial: clamp(options.defaultValue ?? 5),
    onChange: () => options.onValueChange,
  });
  const [focused, setFocused] = createSignal(false);

  const orientation = (): SliderOrientation => options.orientation ?? "horizontal";
  const direction = (): SliderDirection => options.direction ?? "ltr";
  const disabled = (): boolean => options.disabled === true;
  const flipped = (): boolean => orientation() === "horizontal" && direction() === "rtl";

  const commit = (next: number): void => request(clamp(next));

  const delta = (key: string): number => {
    switch (key) {
      case "ArrowUp":
        return step;
      case "ArrowDown":
        return -step;
      case "ArrowRight":
        return flipped() ? -step : step;
      case "ArrowLeft":
        return flipped() ? step : -step;
      case "PageUp":
        return largeStep;
      case "PageDown":
        return -largeStep;
      default:
        return 0;
    }
  };

  const keyDown = (key: string): boolean => {
    if (!focused() || disabled()) {
      return false;
    }
    if (key === "Home") {
      commit(min);
      return true;
    }
    if (key === "End") {
      commit(max);
      return true;
    }
    const change = delta(key);
    if (change === 0) {
      return false;
    }
    commit(value() + change);
    return true;
  };

  const pointerDown = (position: number): void => {
    if (disabled()) {
      return;
    }
    const steps = Math.round((position * (max - min)) / step);
    commit(min + steps * step);
    setFocused(true);
  };

  /**
   * The fraction of the rail a pointer is at, 0..1, for both orientations and
   * both directions. The rail press and every drag move go through this one
   * function, so a drag cannot land where a press would not; `flipped()` is the
   * key rule (horizontal under rtl) and the value axis mirrors with it.
   */
  const positionOf = (event: PointerEvent, rect: DOMRect): number => {
    const along =
      orientation() === "vertical"
        ? 1 - (event.clientY - rect.top) / rect.height // up is more
        : (event.clientX - rect.left) / rect.width; // right is more in ltr
    return flipped() ? 1 - along : along;
  };

  /** `position` of `event` on `element`'s box, or `undefined` when it has no length yet. */
  const positionAt = (event: PointerEvent, element: Element): number | undefined => {
    const rect = element.getBoundingClientRect();
    const length = orientation() === "vertical" ? rect.height : rect.width;
    return length > 0 ? positionOf(event, rect) : undefined;
  };

  let drag: { readonly element: Element; readonly pointerId: number } | undefined;
  let thumb: Element | undefined;

  // a press that landed on the thumb is not a jump: it is already at the value
  const onThumb = (event: PointerEvent): boolean =>
    thumb !== undefined && event.target instanceof Node && thumb.contains(event.target);

  const endDrag = (event: PointerEvent): void => {
    if (drag === undefined || drag.pointerId !== event.pointerId) {
      return;
    }
    const element = drag.element;
    drag = undefined;
    release(element, event.pointerId);
  };

  return {
    value,
    focused,
    setValue: commit,
    focus: () => setFocused(true),
    blur: () => setFocused(false),
    keyDown,
    pointerDown,
    thumbProps: {
      id: `${base}-thumb`,
      role: "slider",
      get "aria-valuenow"() {
        return String(value());
      },
      "aria-valuemin": String(min),
      "aria-valuemax": String(max),
      get "aria-valuetext"() {
        return valueTextFor(value());
      },
      get "aria-orientation"() {
        return orientation();
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      get tabindex() {
        return 0;
      },
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      onKeyDown: (event) => {
        if (keyDown(event.key)) {
          event.preventDefault();
        }
      },
      // the rail's handler runs next in the same dispatch (the thumb sits in it)
      // and reads this to tell a press on the thumb from one beside it
      onPointerDown: (event) => {
        thumb = event.currentTarget as Element;
      },
    },
    trackProps: {
      onPointerDown: (event) => {
        if (disabled()) {
          return;
        }
        // a secondary click (a context menu, a middle click) is not a press
        if (event.button !== 0) {
          return;
        }
        const element = event.currentTarget;
        if (!(element instanceof Element)) {
          return;
        }
        // the newest press owns the drag; the browser releases the old capture
        drag = { element, pointerId: event.pointerId };
        capture(element, event.pointerId);
        if (!onThumb(event)) {
          const position = positionAt(event, element);
          if (position !== undefined) {
            pointerDown(position);
          }
          return;
        }
        // a thumb press starts the drag where the value already is
        setFocused(true);
      },
      onPointerMove: (event) => {
        if (drag === undefined || drag.pointerId !== event.pointerId) {
          return;
        }
        const position = positionAt(event, drag.element);
        if (position !== undefined) {
          pointerDown(position);
        }
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      // a capture taken away (the rail removed, another element capturing) ends
      // the drag: no move arrives for this pointer any more
      onLostPointerCapture: endDrag,
    },
  };
};
