import { type Accessor, createSignal, createUniqueId } from "solid-js";

import type { SliderDirection, SliderOrientation } from "./slider";
import { createControllable } from "./controllable";

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
  readonly tabindex: number;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface SliderMultiThumb {
  readonly values: Accessor<readonly [number, number]>;
  readonly focused: Accessor<SliderMultiThumbIndex | null>;
  readonly setValues: (values: readonly [number, number]) => void;
  /** Programmatic press on one thumb at `position` (a 0..1 track fraction). */
  readonly pointerDown: (index: SliderMultiThumbIndex, position: number) => void;
  readonly focusThumb: (index: SliderMultiThumbIndex) => void;
  readonly blur: () => void;
  /** Returns whether the key moved a value (the caller preventDefaults it). */
  readonly keyDown: (key: string) => boolean;
  readonly thumbProps: (index: SliderMultiThumbIndex) => SliderMultiThumbProps;
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
 * ponytail: dragging and nearest-thumb rail presses are not modelled — the spec
 * omits them (the event names the thumb).
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

  const [focused, setFocused] = createSignal<SliderMultiThumbIndex | null>(null);

  const orientation = (): SliderOrientation => options.orientation ?? "horizontal";
  const direction = (): SliderDirection => options.direction ?? "ltr";
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
    if (index === null) {
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
    pointerDown: (index, position) => {
      const steps = Math.round((position * (max - min)) / step);
      commit(index, min + steps * step);
      setFocused(index);
    },
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
    }),
  };
};
