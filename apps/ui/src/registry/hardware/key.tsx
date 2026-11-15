import {
  type Button as ButtonController,
  type ButtonOptions,
  createButton,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { merge, untrack } from "solid-js";

export interface KeyProps extends Omit<ButtonOptions, "value" | "defaultValue" | "onValueChange"> {
  /**
   * The key's accessible name (`aria-label`). It is separate from `legend` because the panel prints abbreviations: a key
   * whose legend reads "MUTE" may be named "Mute the output".
   */
  readonly label: string;
  /** The printed legend on the cap (default: the label). */
  readonly legend?: string | undefined;
  /** Controlled: the host owns the latched state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Unlatched at mount; ignored while `value` is set. */
  readonly defaultValue?: boolean | undefined;
  /** A request to latch or release, called when the intent differs from the current state. */
  readonly onValueChange?: ((pressed: boolean) => void) | undefined;
  /** The primitive, once: a page that reads the latched state as well as shows it. */
  readonly onReady?: ((button: ButtonController) => void) | undefined;
}

/**
 * A key: a cap standing in its hole. `createButton` owns the activation — Enter, Space, pointer focus — and, with `isToggle`,
 * the latched state and its `aria-pressed`.
 *
 * The hole is the `<button>` itself and the cap is the child that moves: both carry a `data-part`, because the CA sheet draws
 * the recess on one and the travel, the wall and the shadow on the other. A command key returns to the raised position; a
 * latch (`isToggle`) stays down, and `aria-pressed` is the one bit of state the sheet reads for both.
 */
export const Key = (props: KeyProps): JSX.Element => {
  const button = createButton({
    get isToggle() {
      return props.isToggle;
    },
    get value() {
      return props.value;
    },
    get defaultValue() {
      return props.defaultValue;
    },
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
  untrack(() => props.onReady)?.(button);

  const hole = merge(button.buttonProps, {
    "data-part": "key",
    get "aria-label"() {
      return props.label;
    },
  });

  return (
    <button {...hole}>
      <span data-part="key-face">
        <span data-part="key-legend">{props.legend ?? props.label}</span>
      </span>
    </button>
  );
};
