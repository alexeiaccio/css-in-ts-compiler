import { type Tabs as TabsController, type TabsOptions, createTabs } from "@cssints/headless";
import { For, createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";

import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

const rootClass = css.display("flex") + " " + css.flexDirection("column");
const listClass = css.cn(
  css.display("flex"),
  css.gap(t.space._1),
  css.borderBottom("1px solid", t.color.border),
);
const tabClass = css.cn(
  css.padding(t.space._2, t.space._3),
  css.bg("transparent"),
  css.border("none"),
  css.borderBottom("2px solid", "transparent"),
  css.color(t.color.muted),
  css.fontSize(t.font.size),
  css.cursor("pointer"),
  css.hover(css.color(t.color.text)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-selected", "true")(
    css.color(t.color.text),
    css.borderBottom("2px solid", t.color.highlight),
  ),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);
const panelClass = css.cn(css.padding(t.space._3, 0));

/**
 * APG tabs, styled: a tablist, its tabs and the panels they show.
 *
 * The primitive owns the selection, the roving tab stop and the activation mode (automatic or
 * manual); the host owns the DOM, so this component moves focus to whichever tab the primitive
 * reports as focused — that is what makes a keyboard user's arrow key land somewhere.
 *
 * `value` makes it controlled; without it the tabs own the selection. `onValueChange` is a
 * request — a controlled host may ignore it.
 */
export interface TabsProps extends Omit<TabsOptions, "id"> {
  /** How many tabs; `tab` and `panel` are called per index. */
  readonly items: number;
  readonly tab: (index: number) => JSX.Element;
  readonly panel?: (index: number) => JSX.Element;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (tabs: TabsController) => void;
}

export const Tabs = (props: TabsProps): JSX.Element => {
  const tabs = createTabs({
    items: props.items,
    get value() {
      return props.value;
    },
    defaultSelected: props.defaultSelected,
    orientation: props.orientation,
    activation: props.activation,
    disabled: props.disabled,
    focusablePanels: props.focusablePanels,
    get onValueChange() {
      return props.onValueChange;
    },
  });
  props.onReady?.(tabs);

  let list: HTMLElement | undefined;
  const tabElements = (): HTMLElement[] => [
    ...(list?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []),
  ];
  createEffect(
    () => tabs.focused(),
    (index) => {
      const element = tabElements()[index];
      if (index >= 0 && element !== undefined && document.activeElement !== element) {
        element.focus();
      }
    },
  );

  return (
    <div class={rootClass}>
      <div
        {...tabs.tablistProps}
        ref={(element) => {
          list = element;
        }}
        data-part="tablist"
        class={listClass}
      >
        <For each={Array.from({ length: props.items }, (_, index) => index)}>
          {(index) => (
            <button {...tabs.tabProps(index)} data-part="tab" class={tabClass}>
              {props.tab(index)}
            </button>
          )}
        </For>
      </div>
      <For each={Array.from({ length: props.items }, (_, index) => index)}>
        {(index) => (
          <div {...tabs.tabpanelProps(index)} data-part="tabpanel" class={panelClass}>
            {props.panel?.(index)}
          </div>
        )}
      </For>
    </div>
  );
};
