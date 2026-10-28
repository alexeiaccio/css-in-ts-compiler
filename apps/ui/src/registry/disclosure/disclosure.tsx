import {
  type Disclosure as DisclosureController,
  type DisclosureOptions,
  createDisclosure,
} from "@cssints/headless";
import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import "./disclosure.css";

/**
 * APG disclosure, styled: a button and the panel it shows.
 *
 * The styles are a plain sheet over the theme's custom properties, not cssints macros: a
 * copied component has to run in a test runner as well as in a build.
 *
 * `value` makes it controlled; without it the disclosure owns the state. `onValueChange`
 * is a request — a controlled host may ignore it.
 */
export interface DisclosureProps extends Omit<DisclosureOptions, "id"> {
  /** The trigger's label. */
  readonly summary: JSX.Element;
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs its setters; a page rarely does. */
  readonly onReady?: (disclosure: DisclosureController) => void;
}

export const Disclosure = (props: DisclosureProps): JSX.Element => {
  const disclosure = createDisclosure({
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get disabled() {
      return props.disabled;
    },
    onValueChange: props.onValueChange,
  });
  props.onReady?.(disclosure);
  return (
    <div class="ui-disclosure">
      <button {...disclosure.triggerProps} data-part="trigger" class="ui-disclosure__trigger">
        <span aria-hidden="true" class="ui-disclosure__chevron" />
        <span class="ui-disclosure__summary">{props.summary}</span>
      </button>
      <div {...disclosure.panelProps} data-part="panel" class="ui-disclosure__panel">
        <Show when={props.children}>{props.children}</Show>
      </div>
    </div>
  );
};
