import { type Accessor, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/** How a drag turns the knob: the angle around the centre, a straight slide, or whichever the drag starts as. */
export type KnobGesture = "spin" | "slide" | "both";

export interface KnobLabels {
  /** The knob's accessible name (`aria-label`); "Knob" by default. */
  readonly knob?: string | undefined;
}

export interface KnobOptions {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  /** Controlled: the host owns the value and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** Starting value when uncontrolled (the middle of the range by default). */
  readonly defaultValue?: number | undefined;
  /**
   * `false` (default): clamp at `min` / `max`. `true`: a continuous dial — the
   * value wraps around (past `max` comes back at `min`), so a full turn of the
   * skin is a full cycle.
   */
  readonly wrap?: boolean | undefined;
  /** Which drag turns the knob; "both" (default) locks per drag from the first movement. */
  readonly gesture?: KnobGesture | undefined;
  readonly labels?: KnobLabels | undefined;
  /** The spoken value (`aria-valuetext`); `String` by default. */
  readonly format?: ((value: number) => string) | undefined;
  /** Base for the generated value region id. */
  readonly id?: string | undefined;
  /**
   * A request to change the value, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: ((value: number) => void) | undefined;
}

/** Spread onto the knob element, the focusable control. */
export interface KnobProps {
  readonly role: "slider";
  readonly tabindex: number;
  readonly "aria-valuemin": string;
  readonly "aria-valuemax": string;
  readonly "aria-valuenow": string;
  readonly "aria-valuetext": string;
  readonly "aria-label": string;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
  readonly onPointerCancel: (event: PointerEvent) => void;
  readonly onWheel: (event: WheelEvent) => void;
}

/** Spread onto the live value; render it once, always (hide it visually, never with `hidden`). */
export interface KnobValueProps {
  readonly id: string;
  readonly role: "status";
  readonly "aria-live": "polite";
}

export interface Knob {
  readonly value: Accessor<number>;
  /** A request, like a key or a drag; `setValue` never bypasses a controlled `value`. */
  readonly setValue: (value: number) => void;
  /**
   * The fraction of a full turn the skin rotates by for `value`, 0..1 (multiply
   * by 360 for degrees). Clamped to 0..1, or the wrapped fraction when `wrap`.
   */
  readonly percentOf: (value: number) => number;
  /** A request to move by `delta` value units (a key, a wheel, a host button). */
  readonly stepBy: (delta: number) => void;
  readonly knobProps: KnobProps;
  readonly valueProps: KnobValueProps;
}

/** The pointer must travel this far before the drag picks a mode. */
const LOCK_PX = 6;
/** A slide is only locked while the other axis stays this small a share of the movement. */
const SLIDE_VARIANCE = 0.35;
/** The radius (px) at which a full turn sweeps the whole range; farther out is finer. */
const REFERENCE_RADIUS = 100;
/** The radius floor of the spin sensitivity, so a grab at the centre is not wildly coarse. */
const MIN_SPIN_RADIUS = 25;
/** Pixels of slide that move the value by the whole range. */
const SLIDE_PX_PER_RANGE = 200;

type KnobMode = "spin" | "vertical" | "horizontal";

interface Drag {
  readonly pointerId: number;
  readonly centreX: number;
  readonly centreY: number;
  /** Which side of the knob the drag started on: the reference's "which side you turn". */
  readonly side: 1 | -1;
  readonly fromX: number;
  readonly fromY: number;
  readonly startAngle: number;
  /** The unquantised value the drag accumulates; the value itself snaps to `step`. */
  raw: number;
  mode: KnobMode | undefined;
  lastAngle: number;
  lastX: number;
  lastY: number;
}

const angleOf = (x: number, y: number): number => (Math.atan2(y, x) * 180) / Math.PI;

const angleDelta = (from: number, to: number): number => {
  const diff = (to - from) % 360;
  return diff > 180 ? diff - 360 : diff < -180 ? diff + 360 : diff;
};

/**
 * A virtual knob after GarageBand's (https://jherrm.github.io/knobs/): one
 * control turned three ways — spun around its centre, or slid vertically or
 * horizontally, one gesture locked per drag. Plain Solid signals, no elements,
 * no styling. **No ARIA role exists for a dial**, so the knob is a `role=slider`
 * with `aria-valuenow` / `aria-valuetext`; the value the host renders in
 * `valueProps` is the live announcement (`role=status`), and a numeric field
 * must sit next to the dial, because a dial is never the only control.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the value. A key, a wheel, a drag and
 * `setValue`/`stepBy` are requests the host may ignore.
 *
 * Gestures (`gesture`, default "both"), decided once on the first meaningful
 * movement so a drag never switches modes:
 * - a movement that stays on one axis (the other axis under `SLIDE_VARIANCE` of
 *   it) locks a slide — the reference's "slide in a straight line";
 * - any other movement is a turn around the centre: the angle the pointer
 *   covers is the value, and the farther from the centre the finer it is;
 * - `gesture: "spin"` / `"slide"` disable the other.
 *
 * A vertical slide turns the knob the way the grabbed side would turn a real
 * one: down on the right half is clockwise (up in value), down on the left half
 * counter-clockwise. A horizontal slide uses the same left/right side (the
 * reference picks top/bottom for this one; one rule for both is simpler to
 * learn). `wrap` makes the dial continuous instead of clamped.
 *
 * ponytail: no momentum/inertia and no `disabled` — the reference has a
 * deceleration tail, and no host here has asked for one; add inertia in the
 * host's rAF loop if a look needs it.
 */
export const createKnob = (options: KnobOptions = {}): Knob => {
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  const step = options.step ?? 1;
  const span = max - min;
  const base = options.id ?? createUniqueId();

  const wrap = (): boolean => options.wrap === true;

  const bound = (next: number): number => {
    if (span <= 0) {
      return min;
    }
    if (wrap()) {
      return min + ((((next - min) % span) + span) % span);
    }
    return Math.max(min, Math.min(max, next));
  };

  const quantize = (next: number): number => {
    const stepped = step > 0 ? min + Math.round((next - min) / step) * step : next;
    // a step like 0.1 must not leak 55.00000000000001 into the DOM
    return bound(Number(stepped.toPrecision(12)));
  };

  const [value, request] = createControllable({
    value: () => options.value,
    initial: quantize(options.defaultValue ?? min + span / 2),
    onChange: () => options.onValueChange,
  });

  const commit = (next: number): void => request(quantize(next));

  const percentOf = (at: number): number => {
    if (span <= 0) {
      return 0;
    }
    const fraction = (at - min) / span;
    return wrap() ? fraction - Math.floor(fraction) : Math.max(0, Math.min(1, fraction));
  };

  const stepBy = (delta: number): void => commit(value() + delta);

  const onKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight":
        stepBy(step);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        stepBy(-step);
        break;
      case "PageUp":
        stepBy(step * 10);
        break;
      case "PageDown":
        stepBy(-step * 10);
        break;
      case "Home":
        commit(min);
        break;
      case "End":
        commit(max);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  let drag: Drag | undefined;

  const modeFor = (current: Drag, event: PointerEvent): KnobMode => {
    if (options.gesture === "spin") {
      return "spin";
    }
    const dx = event.clientX - current.fromX;
    const dy = event.clientY - current.fromY;
    const vertical = Math.abs(dy);
    const horizontal = Math.abs(dx);
    const major = Math.max(vertical, horizontal);
    const straight = Math.min(vertical, horizontal) <= major * SLIDE_VARIANCE;
    if (options.gesture !== "slide" && !straight) {
      return "spin";
    }
    return vertical >= horizontal ? "vertical" : "horizontal";
  };

  const pointerDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    const element = event.currentTarget;
    if (!(element instanceof Element)) {
      return;
    }
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // a synthetic pointer (tests, assistive technology) is not active: nothing to capture
    }
    const rect = element.getBoundingClientRect();
    const centreX = rect.left + rect.width / 2;
    const centreY = rect.top + rect.height / 2;
    const startAngle = angleOf(event.clientX - centreX, event.clientY - centreY);
    drag = {
      pointerId: event.pointerId,
      centreX,
      centreY,
      side: event.clientX >= centreX ? 1 : -1,
      fromX: event.clientX,
      fromY: event.clientY,
      startAngle,
      raw: value(),
      mode: undefined,
      lastAngle: startAngle,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  };

  const pointerMove = (event: PointerEvent): void => {
    const current = drag;
    if (current === undefined || current.pointerId !== event.pointerId) {
      return;
    }
    if (current.mode === undefined) {
      const travelled = Math.hypot(event.clientX - current.fromX, event.clientY - current.fromY);
      if (travelled < LOCK_PX) {
        return;
      }
      current.mode = modeFor(current, event);
      if (current.mode === "spin") {
        current.lastAngle = current.startAngle;
      } else {
        current.lastX = current.fromX;
        current.lastY = current.fromY;
      }
    }
    if (current.mode === "spin") {
      const angle = angleOf(event.clientX - current.centreX, event.clientY - current.centreY);
      const delta = angleDelta(current.lastAngle, angle);
      current.lastAngle = angle;
      const radius = Math.hypot(event.clientX - current.centreX, event.clientY - current.centreY);
      // farther from the centre: the same turn is a longer arc, so it is finer
      const perDegree = (span / 360) * (REFERENCE_RADIUS / Math.max(radius, MIN_SPIN_RADIUS));
      current.raw = bound(current.raw + delta * perDegree);
    } else {
      const pixels =
        current.mode === "vertical" ? event.clientY - current.lastY : event.clientX - current.lastX;
      current.lastX = event.clientX;
      current.lastY = event.clientY;
      current.raw = bound(current.raw + pixels * (span / SLIDE_PX_PER_RANGE) * current.side);
    }
    commit(current.raw);
  };

  const pointerUp = (event: PointerEvent): void => {
    const current = drag;
    if (current === undefined || current.pointerId !== event.pointerId) {
      return;
    }
    drag = undefined;
    const target = event.currentTarget;
    if (target instanceof Element) {
      try {
        target.releasePointerCapture(event.pointerId);
      } catch {
        // capture was never taken (see pointerdown)
      }
    }
  };

  const onWheel = (event: WheelEvent): void => {
    if (event.deltaY === 0) {
      return;
    }
    event.preventDefault();
    stepBy(event.deltaY < 0 ? step : -step);
  };

  return {
    value,
    setValue: commit,
    percentOf,
    stepBy,
    knobProps: {
      role: "slider",
      get tabindex() {
        return 0;
      },
      "aria-valuemin": String(min),
      "aria-valuemax": String(max),
      get "aria-valuenow"() {
        return String(value());
      },
      get "aria-valuetext"() {
        const format = options.format;
        return format === undefined ? String(value()) : format(value());
      },
      get "aria-label"() {
        return options.labels?.knob ?? "Knob";
      },
      onKeyDown,
      onPointerDown: pointerDown,
      onPointerMove: pointerMove,
      onPointerUp: pointerUp,
      onPointerCancel: pointerUp,
      onWheel,
    },
    valueProps: {
      id: `${base}-value`,
      role: "status",
      "aria-live": "polite",
    },
  };
};
