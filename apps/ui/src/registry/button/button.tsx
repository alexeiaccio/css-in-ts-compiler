import {
  type Button as ButtonController,
  type ButtonOptions,
  createButton,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";

import "./button.css";

/**
 * APG button, styled: a command button, and a toggle button with `isToggle`.
 *
 * A native `<button>` carries the platform (Enter, Space, focus, pointer); the primitive adds the
 * APG contract — `aria-pressed` on a toggle, and `aria-disabled` rather than the native attribute,
 * so a disabled button stays focusable and reads out.
 *
 * `value` makes a toggle controlled; without it the button owns the state. `onValueChange` is a
 * request — a controlled host may ignore it.
 */
export interface ButtonProps extends Omit<ButtonOptions, "id"> {
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (button: ButtonController) => void;
}

export const Button = (props: ButtonProps): JSX.Element => {
  const button = createButton({
    get isToggle() {
      return props.isToggle;
    },
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get disabled() {
      return props.disabled;
    },
    get onClick() {
      return props.onClick;
    },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  props.onReady?.(button);
  return (
    <button {...button.buttonProps} data-part="button" class="ui-button">
      {props.children}
    </button>
  );
};
