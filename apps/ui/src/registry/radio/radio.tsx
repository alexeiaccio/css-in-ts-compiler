import {
  type RadioGroup as RadioGroupController,
  type RadioGroupOptions,
  createRadioGroup,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";

import "./radio.css";

/**
 * APG radio group, styled: `role=radiogroup` with `role=radio` children, arrows move and check.
 *
 * The primitive owns the focus *state* (`focused()`); moving real DOM focus is the host's half, so
 * this component moves it after a key: a roving-tabindex group focuses the radio, an
 * `aria-activedescendant` group focuses the group.
 *
 * `value` makes it controlled; without it the group owns the checked value. `onValueChange` is a
 * request — a controlled host may ignore it.
 */
export interface RadioGroupProps<T> extends Omit<RadioGroupOptions<T>, "id"> {
  /** One label per value; the index is the radio's. */
  readonly children: (value: T, index: number) => JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (group: RadioGroupController<T>) => void;
}

export const RadioGroup = <T,>(props: RadioGroupProps<T>): JSX.Element => {
  const group = createRadioGroup<T>({
    values: props.values,
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    flavor: props.flavor,
    disabled: props.disabled,
    orientation: props.orientation,
    dir: props.dir,
    describedby: props.describedby,
    get onValueChange() {
      return props.onValueChange;
    },
    get onFocus() {
      return props.onFocus;
    },
    get onBlur() {
      return props.onBlur;
    },
  });
  props.onReady?.(group);

  const radios = new Map<number, HTMLElement>();
  let root: HTMLElement | undefined;
  const syncFocus = (): void => {
    const index = group.focused();
    if (index === null) {
      return;
    }
    if (group.flavor() === "activedescendant") {
      root?.focus();
    } else {
      radios.get(index)?.focus();
    }
  };

  return (
    <div
      {...group.radiogroupProps}
      ref={(element) => {
        root = element;
      }}
      data-part="radiogroup"
      class="ui-radiogroup"
      onKeyDown={(event) => {
        group.radiogroupProps.onKeyDown(event);
        queueMicrotask(syncFocus);
      }}
    >
      {props.values.map((value, index) => {
        const radio = group.radioProps(index);
        return (
          <div
            {...radio}
            ref={(element) => {
              radios.set(index, element);
            }}
            data-part="radio"
            class="ui-radio"
            onClick={(event) => {
              radio.onClick();
              syncFocus();
              event.currentTarget.focus();
            }}
          >
            <span aria-hidden="true" class="ui-radio__circle" />
            <span class="ui-radio__label">{props.children(value, index)}</span>
          </div>
        );
      })}
    </div>
  );
};
