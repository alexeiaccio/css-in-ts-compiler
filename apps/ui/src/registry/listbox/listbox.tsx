import {
  createListbox,
  type Listbox as ListboxController,
  type ListboxItemInput,
  type ListboxSelectionMode,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, For, untrack } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** An option: a string that is both its label and its value, or an object with a label and its own details. */
export type ListboxItem = ListboxItemInput;

export interface ListboxProps {
  /** The options, in order. A getter (`() => items()`) lets the list arrive later or change. */
  readonly items: ReadonlyArray<ListboxItem> | (() => ReadonlyArray<ListboxItem>);
  /** `single` (the default) is one chosen row; `multiple` adds the check marks; `none` moves a cursor only. */
  readonly selectionMode?: ListboxSelectionMode | undefined;
  /** Controlled selection: the host owns it and `value` is the only thing that changes it. */
  readonly value?: ReadonlyArray<number> | undefined;
  /** Uncontrolled starting selection. */
  readonly defaultValue?: ReadonlyArray<number> | undefined;
  /** A request to change the selection; controlled, the host may ignore it. */
  readonly onValueChange?: ((value: ReadonlyArray<number>) => void) | undefined;
  /** Controlled active option (the type-ahead focus move's value). */
  readonly activeValue?: number | undefined;
  /** A request to move the active option. */
  readonly onActiveChange?: ((index: number) => void) | undefined;
  /** Single-select only: moving the active option moves the selection with it. */
  readonly followsFocus?: boolean | undefined;
  /** Whether a pointer over a row makes it active. */
  readonly focusOnHover?: boolean | undefined;
  /** Option indices that cannot be selected or reached by navigation. */
  readonly disabled?: ReadonlyArray<number> | undefined;
  /** The list's accessible name. */
  readonly label?: string | undefined;
  /** Base for the generated option ids. */
  readonly id?: string | undefined;
  readonly class?: string | undefined;
  /** The primitive, once: a page that drives the list from elsewhere. */
  readonly onReady?: ((listbox: ListboxController) => void) | undefined;
}

// The list is its own frame: the surface, the border and the radius are the kit's, and the dark mode moves the tokens
// underneath. It is the option set, so each row announces its place and size (`aria-posinset` / `aria-setsize`) inside it.
const listClass = css.cn(
  css.display("grid"),
  css.margin("0"),
  css.padding(t.space._1),
  css.listStyle("none"),
  css.maxHeight("20rem"),
  css.overflowY("auto"),
  css.boxSizing("border-box"),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.fontSize(t.font.size),
  css.userSelect("none"),
);

// A row paints the two states the primitive announces and nothing else: the active row is the primitive's
// `aria-activedescendant` (the skin mirrors it as `data-highlighted`), the chosen one is `aria-selected`, and a disabled
// one is `aria-disabled`. The row is the group the check mark reads, so the skin keeps no copy of the selection either.
const rowClass = css.cn(
  css.group(),
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.minHeight(t.space._8),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.outline("none"),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.attr("data-highlighted", "true")(css.bg(t.color.buttonBackground)),
  css.attr("aria-selected", "true")(
    css.bg(t.color.buttonBackgroundPressed),
    css.fontWeight("500"),
    css.hover(css.bg(t.color.buttonBackgroundPressed)),
  ),
  css.attr("aria-disabled", "true")(
    css.color(t.color.textDisabled),
    css.cursor("not-allowed"),
    css.hover(css.bg("transparent")),
  ),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("background-color 120ms ease-out"),
  ),
);

const checkClass = css.cn(
  css.width("1em"),
  css.flexShrink("0"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.visibility("hidden"),
  css.within(css.attr("aria-selected", "true"))(css.visibility("visible")),
);

const labelClass = css.cn(
  css.overflow("hidden"),
  css.whiteSpace("nowrap"),
  css.textOverflow("ellipsis"),
);

/**
 * A plain listbox, styled: `createListbox` owns the options, the active option, the selection, the roving tab stop, the ARIA
 * and the keys. The skin is the frame, the highlight painted from `data-highlighted` (the row `aria-activedescendant` names),
 * the selected fill, the check mark in a multiple list, the disabled grey, the focus ring and the DOM focus that follows the
 * primitive's roving tabindex.
 *
 * DOM focus lives on the rows: exactly one carries `tabindex="0"`, and the arrows move both the primitive's active option
 * and that tab stop through the skin's effect.
 */
export const Listbox = (props: ListboxProps): JSX.Element => {
  const listbox = createListbox({
    get items() {
      return props.items;
    },
    selectionMode: props.selectionMode,
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get onValueChange() {
      return props.onValueChange;
    },
    get activeValue() {
      return props.activeValue;
    },
    get onActiveChange() {
      return props.onActiveChange;
    },
    followsFocus: props.followsFocus,
    focusOnHover: props.focusOnHover,
    disabled: props.disabled,
    get label() {
      return props.label;
    },
    id: props.id,
  });
  // a structural prop, read once: it is the primitive for a fixture, not a signal
  untrack(() => props.onReady)?.(listbox);

  const multiple = (): boolean => listbox.selectionMode === "multiple";
  const highlighted = (index: number): boolean => listbox.focused() && listbox.active() === index;

  let list: HTMLUListElement | undefined;
  // The primitive keeps the roving tabindex; real DOM focus is the host's to move to that stop while focus is inside.
  createEffect(
    () => `${listbox.focused()}|${listbox.active()}`,
    () => {
      if (!listbox.focused()) {
        return;
      }
      const roving = list?.querySelector<HTMLElement>('[tabindex="0"]');
      if (roving !== undefined && roving !== null && roving !== document.activeElement) {
        roving.focus();
      }
    },
  );

  return (
    <ul
      {...listbox.listboxProps}
      data-part="listbox"
      class={css.cn(listClass, props.class)}
      ref={(node: HTMLUListElement) => {
        list = node;
      }}
    >
      <For each={listbox.items}>
        {(item, index) => (
          <li
            {...listbox.optionProps(index())}
            data-part="listbox-option"
            data-highlighted={highlighted(index()) ? "true" : "false"}
            class={rowClass}
          >
            {multiple() ? (
              <span data-part="listbox-check" aria-hidden="true" class={checkClass}>
                ✓
              </span>
            ) : null}
            <span data-part="listbox-label" class={labelClass}>
              {item.label}
            </span>
          </li>
        )}
      </For>
    </ul>
  );
};
