import {
  type CheckboxGroup as CheckboxGroupController,
  type CheckboxGroupOptions,
  createCheckboxGroup,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, merge, omit, Show, untrack } from "solid-js";

import { Checkbox } from "../checkbox/checkbox.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface CheckboxGroupProps<T>
  extends Omit<CheckboxGroupOptions<T>, "values">, Renderable<PartProps, void> {
  /** The three values the primitive takes: its controller is a tri-state, so the group is exactly three boxes. */
  readonly values: readonly [T, T, T];
  /** The tri-state "all" checkbox above the items, as `parentChecked` derives it. */
  readonly parent?: boolean;
  readonly parentLabel?: string;
  /** One label per value; the index is the box's. */
  readonly children: (value: T, index: number) => JSX.Element;
  readonly class?: string;
  /** The primitive, once: a page that reads the checked set as well as shows it. */
  readonly onReady?: (group: CheckboxGroupController<T>) => void;
}

const groupClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));
const errorClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.invalid));

// The primitive's `childProps` are a role=checkbox of its own, with its own focus model; the kit's `Checkbox` is that
// control already, so its state is the primitive's bit and its activation is the primitive's `click`. The one thing the
// group keeps from `groupProps` is its ARIA (role, id, name, description, invalid state); the primitive's Tab wraps inside
// the group, and a box that owns its own focus keeps the browser's order instead.
const CHILDREN = ["c0", "c1", "c2"] as const;

/**
 * APG checkbox group, styled: `role="group"` with a name, the kit's `Checkbox` per value, and — with `parent` — the
 * tri-state "all" box whose `aria-checked` is derived from the three. `createCheckboxGroup` owns the checked subset (packed
 * into one value), the all/none/mixed derivation, the "remember the last mixed combination" cycle, the toggling, and the
 * name / description / error contract (`label` or `labelledby`, `describedby`, `invalid`, `error`): the group announces
 * what the primitive says, and the error element it names is rendered here.
 *
 * `value` makes it controlled; without it the group owns the subset. `onValueChange` is a request the host may ignore.
 */
export const CheckboxGroup = <T,>(props: CheckboxGroupProps<T>): JSX.Element => {
  const group = createCheckboxGroup<T>({
    values: props.values,
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    parent: props.parent,
    remember: props.remember,
    get id() {
      return props.id;
    },
    get label() {
      return props.label;
    },
    get labelledby() {
      return props.labelledby;
    },
    get describedby() {
      return props.describedby;
    },
    get invalid() {
      return props.invalid;
    },
    get error() {
      return props.error;
    },
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
  untrack(() => props.onReady)?.(group);

  const own = {
    "data-part": "checkbox-group",
    get class() {
      return css.cn(groupClass, props.class);
    },
  } as PartProps;

  return (
    <>
      {renderPart(props, merge(omit(group.groupProps, "onKeyDown"), own), undefined, (part) => (
        <div {...part}>
          <Show when={props.parent}>
            <Checkbox
              allowMixed
              value={group.parentChecked()}
              onValueChange={() => group.click("parent")}
            >
              {props.parentLabel ?? "All"}
            </Checkbox>
          </Show>
          <For each={props.values}>
            {(value, index) => (
              <Checkbox
                value={group.children()[index()] === true ? "true" : "false"}
                onValueChange={() => group.click(CHILDREN[index()] ?? "c0")}
              >
                {props.children(value, index())}
              </Checkbox>
            )}
          </For>
        </div>
      ))}
      {/* the primitive's `aria-describedby` names this element while it has an error: render it always, it is `hidden`
          when there is none, and `role="alert"` while it is shown */}
      <p {...group.errorProps} data-part="checkbox-group-error" class={errorClass}>
        {group.error()}
      </p>
    </>
  );
};
