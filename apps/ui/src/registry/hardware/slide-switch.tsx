import {
  createSwitch,
  type Switch as SwitchController,
  type SwitchOptions,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { merge, untrack } from "solid-js";

export interface SlideSwitchProps extends Omit<
  SwitchOptions,
  "value" | "defaultValue" | "onValueChange" | "enterToggles"
> {
  /** The switch's accessible name (`aria-label`); the two printed legends are its visible ends. */
  readonly label: string;
  /** The printed legend of the off end (default `"Off"`). */
  readonly offLabel?: string | undefined;
  /** The printed legend of the on end (default `"On"`). */
  readonly onLabel?: string | undefined;
  /** Controlled: the host owns the state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Off at mount; ignored while `value` is set. */
  readonly defaultValue?: boolean | undefined;
  /** A request to change the state, called when the intent differs from the current one. */
  readonly onValueChange?: ((checked: boolean) => void) | undefined;
  /** The primitive, once: a page that reads the state as well as shows it. */
  readonly onReady?: ((slide: SwitchController) => void) | undefined;
}

/**
 * A small slide switch: a lever in a recessed slot with a printed detent tick and a legend at each end. `createSwitch` owns
 * the contract (Space and Enter, the pointer press, `aria-checked`, the read-only and disabled cases); the sheet draws the
 * two positions and the snap between them.
 *
 * One thing this part cannot do: `createSwitch` reports a state, not a position. There is no pointer drag and no halfway
 * value to read, so the lever is at one end or the other — the finger does not carry it, and no detent is reported while it
 * moves. A dragged lever would need the primitive to expose the drag; the skin does not fake it with a CSS transition.
 */
export const SlideSwitch = (props: SlideSwitchProps): JSX.Element => {
  const slide = createSwitch({
    get value() {
      return props.value;
    },
    get defaultValue() {
      return props.defaultValue;
    },
    get disabled() {
      return props.disabled;
    },
    get readOnly() {
      return props.readOnly;
    },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  untrack(() => props.onReady)?.(slide);

  const base = merge(slide.switchProps, {
    "data-part": "slide-switch",
    get "aria-label"() {
      return props.label;
    },
  });

  return (
    <div {...base}>
      <span data-part="slide-switch-slot">
        <span data-part="slide-switch-lever" aria-hidden="true" />
      </span>
      <span data-part="slide-switch-legend" data-side="off">
        {props.offLabel ?? "Off"}
      </span>
      <span data-part="slide-switch-legend" data-side="on">
        {props.onLabel ?? "On"}
      </span>
    </div>
  );
};
