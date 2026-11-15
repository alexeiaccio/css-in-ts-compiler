import {
  createSwitch,
  type Switch as SwitchController,
  type SwitchOptions,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { merge, untrack } from "solid-js";

export interface RockerProps extends Omit<
  SwitchOptions,
  "value" | "defaultValue" | "onValueChange" | "enterToggles"
> {
  /** The rocker's accessible name (`aria-label`); the two printed legends are its visible ends. */
  readonly label: string;
  /** The printed legend of the down end (default `"Off"`). */
  readonly offLabel?: string | undefined;
  /** The printed legend of the up end (default `"On"`). */
  readonly onLabel?: string | undefined;
  /** Controlled: the host owns the state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Off at mount; ignored while `value` is set. */
  readonly defaultValue?: boolean | undefined;
  /** A request to change the state, called when the intent differs from the current one. */
  readonly onValueChange?: ((checked: boolean) => void) | undefined;
  /** The primitive, once: a page that reads the state as well as shows it. */
  readonly onReady?: ((rocker: SwitchController) => void) | undefined;
}

/**
 * A two-position rocker: one rigid cap that tips, one end down and the other up. `createSwitch` owns the contract — Space and
 * Enter, the pointer, `aria-checked`, the read-only and disabled cases — and the sheet owns which end is down.
 *
 * The reported state is the whole of what the cap shows: `aria-checked` moves two wall heights, the cap rises by their
 * average and tips about its middle, and the legend of the chosen end is the one carrying the key's cap tone. Both ends print
 * a legend, so the choice is legible without colour.
 */
export const Rocker = (props: RockerProps): JSX.Element => {
  const rocker = createSwitch({
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
  untrack(() => props.onReady)?.(rocker);

  const base = merge(rocker.switchProps, {
    "data-part": "rocker",
    get "aria-label"() {
      return props.label;
    },
  });

  return (
    <div {...base}>
      <span data-part="rocker-cap">
        <span data-part="rocker-legend" data-side="off">
          {props.offLabel ?? "Off"}
        </span>
        <span data-part="rocker-legend" data-side="on">
          {props.onLabel ?? "On"}
        </span>
      </span>
    </div>
  );
};
