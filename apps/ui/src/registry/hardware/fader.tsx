import {
  createSlider,
  type Slider as SliderController,
  type SliderOptions,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { merge, untrack } from "solid-js";

export interface FaderProps extends Omit<SliderOptions, "id" | "orientation"> {
  /** The fader's name and its printed legend: the thumb is the `role="slider"`, and it needs a name. */
  readonly label: string;
  /** The primitive, once: a page that reads the value as well as shows it. */
  readonly onReady?: ((slider: SliderController) => void) | undefined;
}

/**
 * A fader: a groove with a printed scale under it and a ribbed cap on the value. `createSlider` owns the value, the bounds,
 * the step, the arrows, Home and End, the press on the groove and the drag; the sheet owns the groove, the printed ticks,
 * the fill and the cap.
 *
 * The cap is the announced `role="slider"` and the groove is the pointer surface that contains it, so a press anywhere on
 * the groove jumps and drags. The cap's position and the fill are the one thing a class cannot read off `aria-valuenow` (an
 * arithmetic turn of an attribute inside `calc()`), so both are an inline `--at` percentage of the same two numbers the thumb
 * announces, and they cannot disagree with the value a reader hears.
 */
export const Fader = (props: FaderProps): JSX.Element => {
  const slider = createSlider({
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    get step() {
      return props.step;
    },
    get largeStep() {
      return props.largeStep;
    },
    get value() {
      return props.value;
    },
    get defaultValue() {
      return props.defaultValue;
    },
    get direction() {
      return props.direction;
    },
    get disabled() {
      return props.disabled;
    },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  untrack(() => props.onReady)?.(slider);

  const at = (): number => {
    const min = Number(slider.thumbProps["aria-valuemin"]);
    const max = Number(slider.thumbProps["aria-valuemax"]);
    const now = Number(slider.thumbProps["aria-valuenow"]);
    // clamped: a host that hands the primitive a value outside its own bounds must not paint the cap off the groove
    const share = max > min ? ((now - min) / (max - min)) * 100 : 0;
    return Math.min(100, Math.max(0, share));
  };

  const groove = merge(slider.trackProps, {
    "data-part": "fader-track",
    get style() {
      return { "--at": String(at()) };
    },
  });
  const cap = merge(slider.thumbProps, {
    "data-part": "fader-cap",
    get "aria-label"() {
      return props.label;
    },
  });

  return (
    <div data-part="fader">
      <span data-part="fader-label">{props.label}</span>
      <div {...groove}>
        <span data-part="fader-fill" aria-hidden="true" />
        <span data-part="fader-scale" aria-hidden="true" />
        <div {...cap} />
      </div>
    </div>
  );
};
