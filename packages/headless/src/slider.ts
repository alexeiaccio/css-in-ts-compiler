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
}

export interface SliderTrackProps {
  readonly onPointerDown: (event: PointerEvent) => void;
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
  /** A rail press at `position` (a 0..1 fraction of the track length). */
  readonly pointerDown: (position: number) => void;
  readonly thumbProps: SliderThumbProps;
  readonly trackProps: SliderTrackProps;
}

const valueTextFor = (value: number): string =>
  value <= 3 ? "low" : value <= 7 ? "medium" : "high";

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
 * pass `value` + `onValueChange` to own the value. A key or rail press is a
 * request the host may ignore.
 *
 * `disabled` is a widget-level extension of the pattern (the spec lists it
 * under its deliberate omissions): the thumb keeps its tab stop and announces
 * `aria-disabled`, and every key and rail press is dropped before it becomes a
 * request.
 *
 * ponytail: dragging (pointer capture/move) is not modelled — the spec
 * deliberately only fixes a discrete rail press.
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
    },
    trackProps: {
      onPointerDown: (event) => {
        const element = event.currentTarget as HTMLElement;
        const rect = element.getBoundingClientRect();
        const position =
          orientation() === "vertical"
            ? 1 - (event.clientY - rect.top) / rect.height
            : (event.clientX - rect.left) / rect.width;
        pointerDown(position);
      },
    },
  };
};
