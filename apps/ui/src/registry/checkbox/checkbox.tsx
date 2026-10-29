import {
  type Checkbox as CheckboxController,
  type CheckboxOptions,
  createCheckbox,
} from "@cssints/headless";
import { untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

/** APG checkbox, styled: a box, a check and the label beside it. */
export interface CheckboxProps extends Omit<CheckboxOptions, "id"> {
  readonly children?: JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (checkbox: CheckboxController) => void;
}

const root = css.cn(
  css.group(),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);

const box = css.cn(
  css.display("inline-grid"),
  css.placeItems("center"),
  css.width("1.125rem"),
  css.height("1.125rem"),
  css.border("1px solid", t.color.border),
  css.borderRadius("4px"),
  css.bg(t.color.surface),
  css.transition("background-color 120ms, border-color 120ms"),
  css.attr("aria-checked", "true")(
    css.bg(t.color.highlight),
    css.border("1px solid", t.color.highlight),
    css.color(t.color.onHighlight),
  ),
  css.attr("aria-checked", "mixed")(
    css.bg(t.color.highlight),
    css.border("1px solid", t.color.highlight),
  ),
);

const mark = css.cn(
  css.fontSize("0.75rem"),
  css.within(css.attr("aria-checked", "false"))(css.display("none")),
);

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
  untrack(() => props.onReady)?.(checkbox);
  return (
    <div
      {...checkbox.checkboxProps}
      data-part="checkbox"
      class={root}
      onClick={(event) => {
        checkbox.checkboxProps.onClick();
        // a div is not focused by a click the way a native control is
        event.currentTarget.focus();
      }}
    >
      <span aria-hidden="true" class={box}>
        <span class={mark}>✓</span>
      </span>
      {props.children}
    </div>
  );
};
