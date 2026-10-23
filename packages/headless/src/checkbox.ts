import { type Accessor, createSignal } from "solid-js";
import { createControllable } from "./controllable";

export type CheckboxState = "true" | "false" | "mixed";

export interface CheckboxOptions {
  /** Controlled: the host owns the value and this is the only thing that changes it. */
  readonly value?: CheckboxState | undefined;
  /** Uncontrolled starting value; ignored while `value` is set. */
  readonly defaultValue?: CheckboxState;
  /** Tri-state: the state may be `mixed`. */
  readonly allowMixed?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly id?: string;
  /**
   * A request to change the value, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (state: CheckboxState) => void;
}

/** Spread onto the focusable element with `role=checkbox`. */
export interface CheckboxProps {
  readonly role: "checkbox";
  readonly "aria-checked": CheckboxState;
  readonly "aria-disabled": "true" | undefined;
  readonly "aria-readonly": "true" | undefined;
  readonly tabindex: 0;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onKeyUp: (event: KeyboardEvent) => void;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface Checkbox {
  /** `aria-checked` value; `mixed` only while `allowMixed`. */
  readonly checked: Accessor<CheckboxState>;
  readonly allowMixed: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly readOnly: Accessor<boolean>;
  readonly focused: Accessor<boolean>;
  /** Programmatic state change; a request the host may ignore. */
  readonly setChecked: (state: CheckboxState) => void;
  readonly setAllowMixed: (value: boolean) => void;
  readonly setDisabled: (value: boolean) => void;
  readonly toggle: () => void;
  readonly checkboxProps: CheckboxProps;
}

/**
 * APG Checkbox (https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/): one
 * dual-state, optionally tri-state, checkbox. Platform choice (packages/headless/docs/
 * apg-platform-features.md): **native** `<input type=checkbox>` (+ the
 * `indeterminate` JS property); this primitive exposes the polyfillable
 * `role=checkbox` + `aria-checked` contract so the same state drives either
 * element. Space arms on keydown and fires on keyup; Enter is a no-op.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultValue`);
 * pass `value` + `onValueChange` to own the state.
 */
export const createCheckbox = (options: CheckboxOptions = {}): Checkbox => {
  // A dual-state control resolving "mixed" is an internal state change, not a
  // user request: it must not fire onValueChange (the spec's `set_allow_mixed`).
  let resolving = false;
  const [state, requestState] = createControllable<CheckboxState>({
    value: () => options.value,
    initial: options.defaultValue ?? "false",
    onChange: () => (resolving ? undefined : options.onValueChange),
  });
  const [allowMixed, setAllowMixedState] = createSignal(options.allowMixed === true);
  const [disabled, setDisabledState] = createSignal(options.disabled === true);
  const readOnly = (): boolean => options.readOnly === true;
  const [focused, setFocused] = createSignal(false);
  const [spaceArmed, setSpaceArmed] = createSignal(false);

  // "mixed" only reaches aria-checked while allowMixed; resolving is immediate,
  // so this gate is belt-and-suspenders for a controlled host that lags.
  const checked = (): CheckboxState => {
    const current = state();
    return current === "mixed" && !allowMixed() ? "false" : current;
  };
  const nextState = (): CheckboxState => (checked() === "true" ? "false" : "true");

  const blocked = (): boolean => disabled() || readOnly();

  const toggle = (): void => {
    if (blocked()) {
      return;
    }
    requestState(nextState());
  };

  return {
    checked,
    allowMixed,
    disabled,
    readOnly,
    focused,
    setChecked: (value) => {
      requestState(value);
    },
    setAllowMixed: (value) => {
      setAllowMixedState(value);
      if (!value && state() === "mixed" && options.value === undefined) {
        resolving = true;
        requestState("false");
        resolving = false;
      }
    },
    setDisabled: (value) => {
      setDisabledState(value);
      if (value) {
        setSpaceArmed(false);
      }
    },
    toggle,
    checkboxProps: {
      role: "checkbox",
      get "aria-checked"() {
        return checked();
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
        }
      },
      onKeyUp: (event) => {
        if (event.key !== " ") {
          return;
        }
        const armed = spaceArmed();
        setSpaceArmed(false);
        if (armed && !blocked()) {
          requestState(nextState());
        }
      },
      onClick: () => {
        if (blocked()) {
          return;
        }
        setFocused(true);
        requestState(nextState());
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
