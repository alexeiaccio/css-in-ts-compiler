import {
  type Checkbox as CheckboxController,
  type CheckboxOptions,
  createCheckbox,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";

import "./checkbox.css";

/**
 * APG checkbox, styled: a box, a check, and the label beside it.
 *
 * The primitive exposes `role=checkbox` + `aria-checked` (so the same state can drive a native
 * input or this box); Space arms on keydown and commits on keyup, Enter is a no-op.
 *
 * `value` makes it controlled; without it the checkbox owns the state. `allowMixed` adds the
 * tri-state. `onValueChange` is a request — a controlled host may ignore it.
 */
export interface CheckboxProps extends Omit<CheckboxOptions, "id"> {
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (checkbox: CheckboxController) => void;
}

export const Checkbox = (props: CheckboxProps): JSX.Element => {
  const checkbox = createCheckbox({
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get allowMixed() {
      return props.allowMixed;
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
  props.onReady?.(checkbox);
  return (
    <div
      {...checkbox.checkboxProps}
      data-part="checkbox"
      class="ui-checkbox"
      onClick={(event) => {
        checkbox.checkboxProps.onClick();
        // a div is not focused by a click the way a native control is
        event.currentTarget.focus();
      }}
    >
      <span aria-hidden="true" class="ui-checkbox__box" />
      {props.children}
    </div>
  );
};
