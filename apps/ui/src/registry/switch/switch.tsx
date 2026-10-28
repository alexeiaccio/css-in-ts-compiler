import {
  type Switch as SwitchController,
  createSwitch,
  type SwitchOptions,
} from "@cssints/headless";
import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import "./switch.css";

/**
 * APG switch, styled: a track and a thumb, the behaviour from `@cssints/headless`.
 *
 * The styles are a plain sheet over the theme's custom properties, not cssints macros:
 * a copied component has to run in a test runner as well as in a build, and the plugin
 * helpers only exist at build time.
 *
 * `value` makes it controlled; without it the switch owns the state. `onValueChange` is
 * a request — a controlled host may ignore it.
 */
export interface SwitchProps extends Omit<SwitchOptions, "id"> {
  /** The label; without one, pass `aria-label` through the host's own element. */
  readonly children?: JSX.Element;
  /**
   * The primitive, once: the setters that `value` does not cover (`setDisabled`,
   * `setEnterToggles`) and the state. A scenario fixture needs it; a page rarely does.
   */
  readonly onReady?: (sw: SwitchController) => void;
}

export const Switch = (props: SwitchProps): JSX.Element => {
  const sw = createSwitch({
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    disabled: props.disabled,
    readOnly: props.readOnly,
    enterToggles: props.enterToggles,
    onValueChange: props.onValueChange,
  });
  props.onReady?.(sw);
  // A div with `role=switch` rather than a button: the primitive already turns Space and
  // Enter into its own activation, and a button would fire a native click on top of that
  // (two toggles per key press, which the differential walk catches).
  return (
    <div {...sw.switchProps} data-part="switch" class="ui-switch">
      <span aria-hidden="true" class="ui-switch__thumb" />
      <Show when={props.children}>
        <span class="ui-switch__label">{props.children}</span>
      </Show>
    </div>
  );
};
