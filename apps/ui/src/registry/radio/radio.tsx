import {
  type RadioGroup as RadioGroupController,
  type RadioGroupOptions,
  createRadioGroup,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";

import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };
const labelClass = css.fontSize(t.font.size);

const groupClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));

const itemClass = css.cn(
  css.display("inline-flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);

const circleClass = css.cn(
  css.display("inline-block"),
  css.width("1rem"),
  css.height("1rem"),
  css.border("1px solid", t.color.border),
  css.borderRadius("999px"),
  css.bg(t.color.surface),
  css.boxShadow("inset 0 0 0 3px " + t.color.surface),
  css.attr("aria-checked", "true")(
    css.bg(t.color.highlight),
    css.border("1px solid", t.color.highlight),
    css.boxShadow("inset 0 0 0 3px " + t.color.surface),
  ),
);

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
      class={groupClass}
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
            class={itemClass}
            onClick={(event) => {
              radio.onClick();
              syncFocus();
              event.currentTarget.focus();
            }}
          >
            <span aria-hidden="true" class={circleClass} />
            <span class={labelClass}>{props.children(value, index)}</span>
          </div>
        );
      })}
    </div>
  );
};
