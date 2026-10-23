import { type Accessor } from "solid-js";
import { createControllable } from "./controllable";

export interface ButtonOptions {
  /** A toggle button carries `aria-pressed`; a command button does not. */
  readonly isToggle?: boolean;
  /** Controlled: the host owns the pressed state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Uncontrolled starting state for a toggle. */
  readonly defaultValue?: boolean;
  /** aria-disabled: the button stays focusable but never activates. */
  readonly disabled?: boolean;
  /** The activation happened (Enter, Space or pointer). */
  readonly onClick?: () => void;
  /**
   * A request to change the pressed state, called when a toggle activation
   * differs from the current value. Uncontrolled it is accepted; controlled the
   * host may ignore it.
   */
  readonly onValueChange?: (pressed: boolean) => void;
}

/** Spread onto a native `<button>`. */
export interface ButtonProps {
  readonly type: "button";
  readonly role: "button";
  readonly tabindex: number;
  readonly "aria-pressed": "true" | "false" | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly onClick: () => void;
}

export interface Button {
  readonly pressed: Accessor<boolean>;
  /** Activate: a request the disabled guard may drop. */
  readonly press: () => void;
  /** Programmatic pressed change; a request the host may ignore. */
  readonly setPressed: (pressed: boolean) => void;
  /** Getter-backed, so spreading it keeps every attribute reactive. */
  readonly buttonProps: ButtonProps;
}

/**
 * APG Button (https://www.w3.org/WAI/ARIA/apg/patterns/button/): a command
 * button and (with `isToggle`) a toggle button exposing `aria-pressed`.
 * Platform: native (`<button>` handles Enter/Space, focus and pointer); the
 * primitive only derives the ARIA contract and the toggle state.
 *
 * Request/commit (map ticket `rt1p`): a toggle activation is a request the host
 * may ignore; `value` + `onValueChange` own the state, `defaultValue` is
 * uncontrolled. A command button's activation never carries a value.
 */
export const createButton = (options: ButtonOptions = {}): Button => {
  const [pressed, requestPressed] = createControllable<boolean>({
    value: () => options.value,
    initial: options.defaultValue ?? false,
    onChange: () => options.onValueChange,
  });
  const isToggle = (): boolean => options.isToggle === true;
  const disabled = (): boolean => options.disabled === true;

  const press = (): void => {
    if (disabled()) {
      return;
    }
    options.onClick?.();
    if (isToggle()) {
      requestPressed(!pressed());
    }
  };

  return {
    pressed,
    press,
    setPressed: (value) => {
      requestPressed(value);
    },
    buttonProps: {
      type: "button",
      role: "button",
      tabindex: 0,
      get "aria-pressed"() {
        return isToggle() ? (pressed() ? "true" : "false") : undefined;
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      onClick: press,
    },
  };
};
