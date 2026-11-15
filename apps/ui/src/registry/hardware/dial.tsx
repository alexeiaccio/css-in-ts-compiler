import { createKnob, type Knob as KnobController, type KnobOptions } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { merge, untrack } from "solid-js";

export interface DialProps extends Omit<KnobOptions, "id" | "labels"> {
  /** The dial's name: it is the primitive's `labels.knob`, so it is both the accessible and the printed name. */
  readonly label: string;
  /** The dial's diameter in CSS. @default "5.5rem" */
  readonly size?: string | undefined;
  /** The primitive, once: a page that reads the value as well as shows it. */
  readonly onReady?: ((knob: KnobController) => void) | undefined;
}

const DEFAULT_SIZE = "5.5rem";
/** The pointer sweeps three quarters of a turn, from the bottom-left to the bottom-right of the dial. */
const SWEEP = 0.75;
const START_DEGREES = -135;

/**
 * A dial: a knurled crown with a printed arc around it and a pointer at the value. `createKnob` owns the value, the bounds,
 * the step, the three gestures (spin, or a slide either way), the wheel, the arrows, Page Up and Page Down, Home and End, and
 * every `aria-*` the dial announces; the sheet owns the crown, the printed ticks (a repeating conic gradient masked to a 6px
 * band) and the pointer.
 *
 * The pointer turns by `--turn`, an inline angle the primitive's own `percentOf` gives, and the readout is its
 * `aria-valuetext` — `format` is the one place the value is worded, for the eye and for the ear. The value itself is also in
 * the page as the primitive's live region, visually hidden and never `hidden`.
 */
export const Dial = (props: DialProps): JSX.Element => {
  const knob = createKnob({
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    get step() {
      return props.step;
    },
    get value() {
      return props.value;
    },
    get defaultValue() {
      return props.defaultValue;
    },
    get wrap() {
      return props.wrap;
    },
    get gesture() {
      return props.gesture;
    },
    get format() {
      return props.format;
    },
    labels: { knob: props.label },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  untrack(() => props.onReady)?.(knob);

  const turn = (): number =>
    Number((START_DEGREES + 360 * SWEEP * knob.percentOf(knob.value())).toFixed(3));

  const crown = merge(knob.knobProps, {
    "data-part": "dial-knob",
    get style() {
      const size = props.size ?? DEFAULT_SIZE;
      return {
        "--turn": String(turn()),
        width: size,
        height: size,
        "font-size": `calc(${size} / 6)`,
      };
    },
  });

  return (
    <div data-part="dial">
      <span data-part="dial-label">{props.label}</span>
      <div {...crown}>
        <span data-part="dial-scale" aria-hidden="true" />
        <span data-part="dial-pointer" aria-hidden="true" />
        <span data-part="dial-readout" aria-hidden="true">
          {knob.knobProps["aria-valuetext"]}
        </span>
      </div>
      <span {...knob.valueProps} data-part="dial-value">
        {knob.value()}
      </span>
    </div>
  );
};
