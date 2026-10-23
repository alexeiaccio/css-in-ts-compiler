import { type Accessor, createSignal } from "solid-js";
import { createControllable } from "./controllable";

export interface SwitchOptions {
  /** Controlled: the host owns the state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Uncontrolled starting state; ignored while `value` is set. */
  readonly defaultValue?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  /** The APG's optional Enter key also flips the switch. */
  readonly enterToggles?: boolean;
  readonly id?: string;
  /**
   * A request to change the state, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (checked: boolean) => void;
}

/** Spread onto the focusable element with `role=switch`. */
export interface SwitchProps {
  readonly role: "switch";
  readonly "aria-checked": "true" | "false";
  readonly "aria-disabled": "true" | undefined;
  readonly "aria-readonly": "true" | undefined;
  readonly tabindex: 0;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onKeyUp: (event: KeyboardEvent) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface Switch {
  readonly checked: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly readOnly: Accessor<boolean>;
  readonly enterToggles: Accessor<boolean>;
  readonly focused: Accessor<boolean>;
  /** Programmatic state change; a request the host may ignore. */
  readonly setChecked: (checked: boolean) => void;
  readonly setDisabled: (value: boolean) => void;
  readonly setEnterToggles: (value: boolean) => void;
  readonly toggle: () => void;
  readonly switchProps: SwitchProps;
}

/**
 * APG Switch (https://www.w3.org/WAI/ARIA/apg/patterns/switch/): a binary on/off
 * input. Platform choice (packages/headless/docs/apg-platform-features.md): **native
 * `<input type=checkbox switch>`** as progressive enhancement (Safari only),
 * with checkbox + `role=switch` as the safe baseline; this primitive exposes
 * the `role=switch` + `aria-checked` contract. Space arms on keydown and fires
 * on keyup; Enter flips only when `enterToggles`.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the state.
 */
export const createSwitch = (options: SwitchOptions = {}): Switch => {
  const [checked, requestChecked] = createControllable<boolean>({
    value: () => options.value,
    initial: options.defaultValue ?? false,
    onChange: () => options.onValueChange,
  });
  const [disabled, setDisabledState] = createSignal(options.disabled === true);
  const readOnly = (): boolean => options.readOnly === true;
  const [enterToggles, setEnterTogglesSignal] = createSignal(options.enterToggles === true);
  const [focused, setFocused] = createSignal(false);
  const [spaceArmed, setSpaceArmed] = createSignal(false);

  const blocked = (): boolean => disabled() || readOnly();

  const toggle = (): void => {
    if (blocked()) {
      return;
    }
    requestChecked(!checked());
  };

  return {
    checked,
    disabled,
    readOnly,
    enterToggles,
    focused,
    setChecked: (value) => {
      requestChecked(value);
    },
    setDisabled: (value) => {
      setDisabledState(value);
      if (value) {
        setSpaceArmed(false);
      }
    },
    setEnterToggles: (value) => {
      setEnterTogglesSignal(value);
    },
    toggle,
    switchProps: {
      role: "switch",
      get "aria-checked"() {
        return checked() ? "true" : "false";
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      get "aria-readonly"() {
        return readOnly() ? "true" : undefined;
      },
      tabindex: 0,
      onKeyDown: (event) => {
        if (event.key === " " && !event.repeat && !blocked()) {
          event.preventDefault();
          setSpaceArmed(true);
          return;
        }
        if (event.key === "Enter" && enterToggles() && !blocked()) {
          event.preventDefault();
          requestChecked(!checked());
        }
      },
      onKeyUp: (event) => {
        if (event.key !== " ") {
          return;
        }
        const armed = spaceArmed();
        setSpaceArmed(false);
        if (armed && !blocked()) {
          requestChecked(!checked());
        }
      },
      onClick: () => {
        if (blocked()) {
          return;
        }
        setFocused(true);
        requestChecked(!checked());
      },
      onFocus: () => {
        setFocused(true);
      },
      onBlur: () => {
        setFocused(false);
        setSpaceArmed(false);
      },
    },
  };
};
