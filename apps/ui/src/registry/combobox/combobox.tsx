import { createCombobox } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, createMemo, createSignal, For, merge, Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** An option: a string that is both its label and its value, or an object with a value and a label. */
export type ComboboxItem = string | { readonly value: string; readonly label: string };

export interface ComboboxProps {
  /** The options, declared once: the primitive filters their labels as the reader types. */
  readonly items: ReadonlyArray<ComboboxItem>;
  /** Controlled: the chosen value. Leave it out and the combobox owns it. */
  readonly value?: string | null;
  /** Uncontrolled starting value. */
  readonly defaultValue?: string | null;
  /** A request to choose a value; the primitive only commits an option. */
  readonly onValueChange?: (value: string | null) => void;
  /** A request to open or close the popup. */
  readonly onOpenChange?: (open: boolean) => void;
  /** Shown in the field while it holds no text. */
  readonly placeholder?: string;
  /** The accessible name: it names the field and the listbox. */
  readonly label?: string;
  /** Shown inside the list while nothing matches the typed text. @default "No matches" */
  readonly emptyMessage?: string;
  /** A disabled combobox keeps its tab stop, never opens and changes nothing (the primitive's `aria-disabled`). */
  readonly disabled?: boolean;
  readonly id?: string;
  readonly class?: string;
}

const DEFAULT_EMPTY = "No matches";

// The field and the list share one anchor, as the menu and the tooltip do: `position: relative` here and the list is
// absolute in it, so no rect is measured and nothing listens to scroll or resize.
const anchorClass = css.cn(css.position("relative"), css.display("grid"), css.minWidth("16rem"));

// The field is the kit's `Input` with the list's own surface under it: one border, one radius and the ring a control wears.
// `placeholder-shown` keeps the hint in the placeholder tone without a `::placeholder` rule of its own.
const fieldClass = css.cn(
  css.boxSizing("border-box"),
  css.display("block"),
  css.width("100%"),
  css.padding(t.space._2, t.space._3),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.fieldText),
  css.fontSize(t.font.size),
  css.placeholderShown(css.color(t.color.placeholder)),
  css.hover(css.border("1px solid", t.color.borderHover)),
  css.focusVisible(
    css.outline("2px solid", t.color.focusRing),
    css.outlineOffset("2px"),
    css.border("1px solid", t.color.focusRing),
  ),
  css.attr("aria-disabled", "true")(
    css.bg(t.color.page),
    css.color(t.color.textDisabled),
    css.border("1px solid", t.color.borderDisabled),
    css.cursor("not-allowed"),
  ),
);

// The popup is the select's list: the overlay surface, the popover shadow and the same radius, so the two read as siblings.
// `max-height` bounds the rows and this is what lets the list scroll under them. No `display`: the primitive's `hidden`
// attribute is what hides it, and a display here would override the UA's rule.
const listClass = css.cn(
  css.position("absolute"),
  css.insetBlockStart("100%"),
  css.insetInlineStart("0"),
  css.marginBlockStart(t.space._1),
  // as in Menu and Dialog: the custom property is the token, because `z-index` takes an `<integer>`
  css.zIndex("var(--z-popover)"),
  css.width("max-content"),
  css.minWidth("100%"),
  css.maxHeight("15rem"),
  css.overflowY("auto"),
  css.padding(t.space._1),
  css.bg(t.color.overlayBackground),
  css.color(t.color.text),
  css.border("1px solid", t.color.overlayBorder),
  css.borderRadius(t.radius.lg),
  css.boxShadow(t.shadow.popover),
);

// The active option is the primitive's announcement: focus stays in the field and `aria-selected` marks the row that Enter
// would commit, so the paint follows that attribute and the skin keeps no copy of the active index.
const optionClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.attr("aria-selected", "true")(css.bg(t.color.buttonBackground)),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("background-color 120ms ease-out"),
  ),
);

const emptyClass = css.cn(
  css.padding(t.space._3, t.space._2),
  css.fontSize(t.font.size),
  css.color(t.color.muted),
  css.textAlign("center"),
);

/**
 * APG combobox (autocomplete variant), styled: a text field with a listbox popup. `createCombobox` owns the open state, the
 * selection, the prefix filter, the active option, `aria-expanded` / `aria-controls` / `aria-activedescendant`, the arrows,
 * Enter, Space, Escape, Tab and the blur that commits, and the option ids; DOM focus never leaves the field. The skin owns
 * the anchor, the field and the list surfaces, the highlight painted from `aria-selected`, the empty state, the label and
 * the field's own display of the chosen label after the primitive clears its filter text.
 */
export const Combobox = (props: ComboboxProps): JSX.Element => {
  // read once: the primitive takes its corpus up front (`options` is not an accessor), and the field needs the labels too
  const labels = new Map(
    props.items.map((item) => (typeof item === "string" ? [item, item] : [item.value, item.label])),
  );
  const combobox = createCombobox({
    options: props.items,
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue ?? null,
    filter: true,
    autoComplete: "list",
    id: props.id,
    get disabled() {
      return props.disabled;
    },
    get onValueChange() {
      return props.onValueChange;
    },
    get onOpenChange() {
      return props.onOpenChange;
    },
    // Tab: the primitive has committed and closed, and says the DOM host may let go of native focus
    onFocusRelease: () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
  });
  const input = combobox.comboboxProps;

  // The primitive's field text is the filter query, which it clears on commit; the display goes back to the chosen label
  // whenever the popup is closed, so the field shows the selection again after Enter, Escape or a blur.
  const [editing, setEditing] = createSignal(false);
  createEffect(
    () => combobox.open(),
    (open) => {
      if (!open) {
        setEditing(false);
      }
    },
  );

  const display = (): string => {
    // a key that starts the filter has changed `query` before any input event arrives, so the query is the field's text
    if (editing() || combobox.query() !== "") {
      return combobox.query();
    }
    const value = combobox.value();
    return value === null ? "" : (labels.get(value) ?? value);
  };

  // One row per match, with the primitive's announcement read in the memo: the list rebuilds when the filter, the active
  // option or the selection changes, and the JSX itself holds no copy of the active index.
  const rows = createMemo(() =>
    combobox.options().map((option) => ({
      id: option.props.id,
      role: option.props.role,
      label: option.label,
      selected: option.props["aria-selected"],
      onClick: option.props.onClick,
      onMouseDown: option.props.onMouseDown,
    })),
  );

  const merged = merge(input, () => ({
    type: "text",
    autocomplete: "off",
    spellcheck: false,
    "data-part": "combobox-input",
    get value() {
      return display();
    },
    get placeholder() {
      return props.placeholder;
    },
    get "aria-label"() {
      return props.label;
    },
    get class() {
      return fieldClass;
    },
    onInput: (event: InputEvent & { readonly currentTarget: HTMLInputElement }) => {
      if (props.disabled === true) {
        // the primitive drops the input; the skin puts the field back where the model is
        event.currentTarget.value = display();
        return;
      }
      input.onInput(event);
      setEditing(true);
    },
    onFocus: (event: FocusEvent & { readonly currentTarget: HTMLInputElement }) => {
      input.onFocus();
      // the chosen label is in the field: selecting it lets the first typed character replace it
      event.currentTarget.select();
    },
  }));

  return (
    <div data-part="combobox" class={css.cn(anchorClass, props.class)}>
      <input {...merged} />
      <div
        {...combobox.listboxProps}
        data-part="combobox-listbox"
        aria-label={props.label}
        class={listClass}
      >
        <For each={rows()}>
          {(row) => (
            <div
              id={row.id}
              role={row.role}
              aria-selected={row.selected}
              onClick={row.onClick}
              onMouseDown={row.onMouseDown}
              data-part="combobox-option"
              class={optionClass}
            >
              {row.label}
            </div>
          )}
        </For>
        <Show when={combobox.open() && combobox.options().length === 0}>
          <div data-part="combobox-empty" class={emptyClass}>
            {props.emptyMessage ?? DEFAULT_EMPTY}
          </div>
        </Show>
      </div>
    </div>
  );
};
