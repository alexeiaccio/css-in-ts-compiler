import { type Accessor, createSignal, createUniqueId } from "solid-js";

import type { SliderDirection, SliderOrientation, SliderTrackProps } from "./slider";
import { createControllable } from "./controllable";
import { type RailDrag, beginRailDrag, endRailDrag, railPositionAt } from "./rail-pointer";

export type SliderMultiThumbIndex = 0 | 1;

export interface SliderMultiThumbOptions {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** The jump distance of PageUp / PageDown. */
  readonly largeStep?: number;
  /** Controlled: the host owns the pair and this is the only thing that changes it. */
  readonly value?: readonly [number, number] | undefined;
  /** Uncontrolled starting `[lo, hi]` values; ignored while `value` is set. */
  readonly defaultValue?: readonly [number, number];
  readonly orientation?: SliderOrientation;
  readonly direction?: SliderDirection;
  /**
   * aria-disabled: both thumbs stay tab stops (the APG pattern's focus
   * contract) but a key, a rail press and a drag change nothing.
   */
  readonly disabled?: boolean;
  /** Base for the generated thumb ids. */
  readonly id?: string;
  /**
   * A request to change the pair, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore
   * it.
   */
  readonly onValueChange?: (values: readonly [number, number]) => void;
}

export interface SliderMultiThumbProps {
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
  /** Marks the press so the rail does not jump (that thumb is already at its value). */
  readonly onPointerDown: (event: PointerEvent) => void;
}

export interface SliderMultiThumb {
  readonly values: Accessor<readonly [number, number]>;
  readonly focused: Accessor<SliderMultiThumbIndex | null>;
  readonly setValues: (values: readonly [number, number]) => void;
  /**
   * A press or a drag move on the named thumb at `position` (a 0..1 fraction of
   * the rail's value axis, direction already applied).
   */
  readonly pointerDown: (index: SliderMultiThumbIndex, position: number) => void;
  readonly focusThumb: (index: SliderMultiThumbIndex) => void;
  readonly blur: () => void;
  /** Returns whether the key moved a value (the caller preventDefaults it). */
  readonly keyDown: (key: string) => boolean;
  readonly thumbProps: (index: SliderMultiThumbIndex) => SliderMultiThumbProps;
  /** Spread onto the rail, which must contain the thumbs: the rail owns the press and the drag. */
  readonly trackProps: SliderTrackProps;
}

const valueTextFor = (value: number): string =>
  value <= 3 ? "low" : value <= 7 ? "medium" : "high";

const keyOf = (pair: readonly [number, number]): string => `${pair[0]},${pair[1]}`;
const pairOf = (key: string): readonly [number, number] => {
  const [lo, hi] = key.split(",");
  return [Number(lo), Number(hi)];
};

/**
 * APG Slider (Multi-Thumb) (https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/):
 * two `role=slider` thumbs sharing one rail, each bounded by its neighbour so
 * they cannot cross. Verified against `specs/apg/slider-multithumb.qnt` by the
 * differential walk in `test/slider-multithumb.browser.test.tsx`.
 *
 * Native / polyfill / hybrid / library: **library** — the Open UI
 * `<rangegroup>` is an explainer only, so the library owns the behaviour
 * (neighbour-bounded thumbs, constant tab order). The spec generalises the bound
 * rule to N thumbs; Quint has no list state, so this primitive fixes two, like
 * the spec.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the pair. The pair is packed into a
 * string so it rides the scalar `createControllable`.
 *
 * `disabled` is a widget-level extension of the pattern (the spec lists it under
 * its deliberate omissions): both thumbs keep their tab stops and announce
 * `aria-disabled`, and every key, rail press and drag is dropped before it
 * becomes a request.
 *
 * The spec fixes a press that names its thumb and has no pointer position, so
 * `trackProps` is a deliberate extension too: a press beside the thumbs names
 * the nearer one (a tie goes to the lower) and starts a drag that follows the
 * pointer until `pointerup`, `pointercancel` or a lost capture, in the four
 * orientation/direction combinations the arrows use. The rail owns the drag
 * whichever element took the press, with pointer capture, so a host cleans up
 * nothing. `test/slider-multithumb.browser.test.tsx` is the extension's oracle.
 */
export const createSliderMultiThumb = (options: SliderMultiThumbOptions = {}): SliderMultiThumb => {
  const min = options.min ?? 0;
  const max = options.max ?? 10;
  const step = options.step ?? 1;
  const largeStep = options.largeStep ?? 3;
  const base = options.id ?? createUniqueId();

  const clampTo = (value: number): number => Math.max(min, Math.min(max, value));
  const snap = (value: number): number => min + Math.round((value - min) / step) * step;
  const normalize = (pair: readonly [number, number]): readonly [number, number] => {
    const lo = clampTo(pair[0]);
    return [lo, Math.max(lo, clampTo(pair[1]))];
  };

  const [packedValues, requestPacked] = createControllable<string>({
    value: () => (options.value === undefined ? undefined : keyOf(options.value)),
    initial: keyOf(normalize(options.defaultValue ?? [3, 7])),
    onChange: () => (next: string) => options.onValueChange?.(pairOf(next)),
  });

  const values = (): readonly [number, number] => pairOf(packedValues());

  // Solid 2 applies a setter on the next flush, so a signal read in the same tick
  // as the press would still see the old thumb; the local is always fresh, the
  // version only notifies. A host can therefore focus the thumb the press named.
  let focusedLocal: SliderMultiThumbIndex | null = null;
  const [focusedVersion, setFocusedVersion] = createSignal(0);
  const focused = (): SliderMultiThumbIndex | null => {
    focusedVersion();
    return focusedLocal;
  };
  const setFocused = (index: SliderMultiThumbIndex | null): void => {
    focusedLocal = index;
    setFocusedVersion((count) => count + 1);
  };

  const orientation = (): SliderOrientation => options.orientation ?? "horizontal";
  const direction = (): SliderDirection => options.direction ?? "ltr";
  const disabled = (): boolean => options.disabled === true;
  const flipped = (): boolean => orientation() === "horizontal" && direction() === "rtl";

  const commit = (index: SliderMultiThumbIndex, next: number): void => {
    const [currentLo, currentHi] = values();
    const boundLo = index === 0 ? min : currentLo;
    const boundHi = index === 0 ? currentHi : max;
    const value = Math.max(boundLo, Math.min(boundHi, snap(next)));
    const nextPair: readonly [number, number] =
      index === 0 ? [value, currentHi] : [currentLo, value];
    if (keyOf(nextPair) === keyOf([currentLo, currentHi])) {
      return;
    }
    requestPacked(keyOf(nextPair));
  };

  const boundsOf = (index: SliderMultiThumbIndex): number =>
    index === 0 ? values()[0] : values()[1];
  const minOf = (index: SliderMultiThumbIndex): number => (index === 0 ? min : values()[0]);
  const maxOf = (index: SliderMultiThumbIndex): number => (index === 0 ? values()[1] : max);

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
    const index = focused();
    if (index === null || disabled()) {
      return false;
    }
    if (key === "Home") {
      commit(index, minOf(index));
      return true;
    }
    if (key === "End") {
      commit(index, maxOf(index));
      return true;
    }
    const change = delta(key);
    if (change === 0) {
      return false;
    }
    commit(index, boundsOf(index) + change);
    return true;
  };

  const pointerDown = (index: SliderMultiThumbIndex, position: number): void => {
    if (disabled()) {
      return;
    }
    const steps = Math.round((position * (max - min)) / step);
    commit(index, min + steps * step);
    setFocused(index);
  };

  /**
   * The thumb a rail press at `position` names: the one nearest the value under
   * the pointer, in value space (the measured fraction is the rail's, so a
   * vertical or rtl rail is already the value's own axis). A tie goes to the
   * lower thumb: it is the pair's floor and the first tab stop, and a press that
   * cannot say which thumb it means should not move the ceiling, which would
   * shrink the interval instead of shifting its start.
   */
  const nearestTo = (position: number): SliderMultiThumbIndex => {
    const [lo, hi] = values();
    const target = min + position * (max - min);
    return Math.abs(target - lo) <= Math.abs(target - hi) ? 0 : 1;
  };

  let drag: RailDrag | undefined;
  let dragIndex: SliderMultiThumbIndex | undefined;
  /** The thumb that took the last press (the rail's handler runs next in the same dispatch). */
  let pressed: { readonly thumb: Element; readonly index: SliderMultiThumbIndex } | undefined;

  // a press that landed on a thumb names it (the APG's rule): that one drags
  // from where it is, and the press does not jump
  const onThumb = (event: PointerEvent): boolean =>
    pressed !== undefined && event.target instanceof Node && pressed.thumb.contains(event.target);

  const endDrag = (event: PointerEvent): void => {
    if (drag === undefined || drag.pointerId !== event.pointerId) {
      return;
    }
    drag = endRailDrag(drag, event);
    dragIndex = undefined;
  };

  return {
    values,
    focused,
    setValues: (next) => {
      const pair = normalize(next);
      if (keyOf(pair) === packedValues()) {
        return;
      }
      requestPacked(keyOf(pair));
    },
    pointerDown,
    focusThumb: (index) => setFocused(index),
    blur: () => setFocused(null),
    keyDown,
    thumbProps: (index) => ({
      id: `${base}-thumb-${index}`,
      role: "slider",
      get "aria-valuenow"() {
        return String(index === 0 ? values()[0] : values()[1]);
      },
      get "aria-valuemin"() {
        return String(minOf(index));
      },
      get "aria-valuemax"() {
        return String(maxOf(index));
      },
      get "aria-valuetext"() {
        return valueTextFor(index === 0 ? values()[0] : values()[1]);
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
      onFocus: () => setFocused(index),
      onBlur: () => setFocused(null),
      onKeyDown: (event) => {
        if (keyDown(event.key)) {
          event.preventDefault();
        }
      },
      // the rail's handler runs next in the same dispatch (the thumb sits in it)
      // and reads this to tell which thumb took the press
      onPointerDown: (event) => {
        pressed = { thumb: event.currentTarget as Element, index };
      },
    }),
    trackProps: {
      onPointerDown: (event) => {
        if (disabled()) {
          return;
        }
        const next = beginRailDrag(event);
        if (next === undefined) {
          return;
        }
        drag = next;
        if (onThumb(event) && pressed !== undefined) {
          dragIndex = pressed.index;
          setFocused(pressed.index);
          return;
        }
        const position = railPositionAt(event, next.element, orientation(), direction());
        if (position === undefined) {
          return;
        }
        const index = nearestTo(position);
        dragIndex = index;
        pointerDown(index, position);
      },
      onPointerMove: (event) => {
        if (drag === undefined || drag.pointerId !== event.pointerId || dragIndex === undefined) {
          return;
        }
        const position = railPositionAt(event, drag.element, orientation(), direction());
        if (position !== undefined) {
          pointerDown(dragIndex, position);
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
