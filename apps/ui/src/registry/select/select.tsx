import { type Combobox, type ComboboxOption, createCombobox } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, merge, omit, useContext } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** An option: a string that is both its label and its identity, or an object with a label. */
export type SelectItem = string | { readonly label: string };

export interface SelectProps {
  /** The options, declared once: the primitive needs their labels for typeahead, and the trigger shows the chosen one. */
  readonly items: ReadonlyArray<SelectItem>;
  /** Controlled: the chosen index. Leave it out and the select owns the value. */
  readonly value?: number | undefined;
  /** Uncontrolled starting index. */
  readonly defaultValue?: number;
  /** A request to choose an option: its index in `items`. */
  readonly onValueChange?: (index: number) => void;
  /** Shown on the trigger while nothing is chosen. */
  readonly placeholder?: string;
  /** The accessible name: the trigger and the listbox both take it. */
  readonly label?: string;
  /** A disabled select keeps its tab stop and never opens (the pattern's `aria-disabled`). */
  readonly disabled?: boolean;
  readonly id?: string;
  readonly children?: JSX.Element;
}

export type SelectTriggerPartProps = PartProps;

export interface SelectTriggerProps extends Renderable<SelectTriggerPartProps, void> {
  readonly class?: string;
  /** The chosen label by default. */
  readonly children?: JSX.Element;
}

export interface SelectContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  /** Rows of your own; without children the declared items are the rows, in order. */
  readonly children?: JSX.Element;
}

/** What a row's `render` sees: the highlight and the choice, both announced by the widget. */
export interface SelectOptionState {
  readonly highlighted: () => boolean;
  readonly selected: () => boolean;
}

export type SelectOptionPartProps = PartProps;

export interface SelectOptionProps extends Renderable<SelectOptionPartProps, SelectOptionState> {
  /** The index in the select's `items` this row is. */
  readonly index: number;
  readonly class?: string;
  /** The row's content; the declared label by default. */
  readonly children?: JSX.Element;
}

interface SelectContextValue {
  readonly combobox: Combobox;
  /** The corpus, once: `items` with the index as the option's value. */
  readonly items: ReadonlyArray<ComboboxOption>;
  readonly anchor: () => HTMLElement | undefined;
  readonly label: () => string | undefined;
  /** The chosen label, while there is a choice. */
  readonly chosen: () => string | undefined;
  readonly placeholder: () => string | undefined;
}

const SelectContext = createContext<SelectContextValue>();

// The same anchor the menu and the tooltip use: one box around the trigger and the list, `position: relative`, and the list
// is absolute in it. No rect is measured and nothing listens to scroll or resize; the cost is the wrapper and an
// `overflow: hidden` ancestor clipping the list.
const anchorClass = css.cn(css.position("relative"), css.display("inline-flex"));

const contentClass = css.cn(
  css.position("absolute"),
  css.insetBlockStart("100%"),
  css.insetInlineStart("0"),
  css.marginBlockStart(t.space._1),
  // as in Menu and Dialog: the custom property is the token, because `z-index` takes an `<integer>`
  css.zIndex("var(--z-popover)"),
  css.width("max-content"),
  css.minWidth("100%"),
  // no `display`: the `hidden` attribute on the list is what hides it, and a display here would override the UA's rule
  css.padding(t.space._1),
  css.bg(t.color.overlayBackground),
  css.color(t.color.text),
  css.border("1px solid", t.color.overlayBorder),
  css.borderRadius(t.radius.lg),
  css.boxShadow(t.shadow.popover),
);

// The APG select-only combobox keeps DOM focus on the trigger and marks the visually focused option with `aria-selected`;
// that announcement is the highlight, so a pointer hover and an arrow key paint the same row and the kit keeps no copy of
// the active index.
const optionClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.attr("aria-selected", "true")(css.bg(t.color.buttonBackground)),
);

/**
 * APG select-only combobox, styled: `Select.Trigger` (a `Button`) shows the chosen label and is the combobox, `Select.Content`
 * is the floating listbox of `Select.Option`s. `createCombobox` owns the open state, the ARIA, the arrows, Home and End,
 * Enter, Space, Tab, Escape, the typeahead, the blur that commits, and a commit from an option click; DOM focus never leaves
 * the trigger, so the kit moves no focus and listens to no document. It keeps the anchor the content floats from, the
 * surface, the highlight and the label on the trigger.
 *
 * The options are declared on `Select`, once, as on `Menu`: the primitive needs their labels for typeahead, and the trigger
 * needs them to show the chosen one. The primitive's value is a string, so the kit's index is the option's value.
 */
export const Select = (props: SelectProps): JSX.Element => {
  // read once: the primitive takes its corpus up front (`options` is not an accessor)
  const items = props.items.map((item, index) => ({
    value: String(index),
    label: typeof item === "string" ? item : item.label,
  }));
  const combobox = createCombobox({
    options: items,
    get value() {
      return props.value === undefined ? undefined : String(props.value);
    },
    defaultValue: props.defaultValue === undefined ? null : String(props.defaultValue),
    autoComplete: "none",
    filter: false,
    id: props.id,
    get disabled() {
      return props.disabled;
    },
    get onValueChange() {
      const change = props.onValueChange;
      return change === undefined
        ? undefined
        : (value: string | null) => {
            // the primitive only commits an option, so a `null` is not a choice to pass on
            if (value !== null) {
              change(Number(value));
            }
          };
    },
    // Tab: the primitive has committed and closed, and says the DOM host may let go of native focus
    onFocusRelease: () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
  });
  let anchor: HTMLDivElement | undefined;

  const chosen = (): string | undefined => {
    const value = combobox.value();
    return value === null ? undefined : items[Number(value)]?.label;
  };

  return (
    <SelectContext
      value={{
        combobox,
        items,
        anchor: () => anchor,
        label: () => props.label,
        chosen,
        placeholder: () => props.placeholder,
      }}
    >
      <div
        data-part="select-anchor"
        class={anchorClass}
        ref={(element: HTMLDivElement) => {
          anchor = element;
        }}
      >
        {props.children}
      </div>
    </SelectContext>
  );
};

/**
 * The button that shows the chosen label and is the combobox: `Button` unless `render` says otherwise.
 *
 * A select-only combobox has no text input, so the button takes the primitive's `comboboxProps` itself: `role="combobox"`,
 * `aria-expanded`, `aria-controls` and `aria-activedescendant` (the popup's active option), and the focus, blur, click and
 * key handlers. `value` and `onInput` are a text input's, and so is `aria-autocomplete` (what typing does in a field), so
 * they are left out; the typeahead still runs off the key handler.
 */
export const SelectTrigger = (props: SelectTriggerProps): JSX.Element => {
  const { combobox, chosen, placeholder, label } = useContext(SelectContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button`, which owns the attribute. `merge` reads these through, so a
  // plain spread here would read the primitive's getters once and freeze `aria-expanded`.
  const merged = merge(rest, () => {
    const input = combobox.comboboxProps;
    return {
      id: input.id,
      role: input.role,
      "aria-haspopup": input["aria-haspopup"],
      get "aria-expanded"() {
        return input["aria-expanded"];
      },
      get "aria-controls"() {
        return input["aria-controls"];
      },
      get "aria-activedescendant"() {
        return input["aria-activedescendant"];
      },
      get "aria-label"() {
        return label();
      },
      // the primitive's decision for a disabled widget: `aria-disabled` on a focusable combobox, not the native attribute
      get "aria-disabled"() {
        return input["aria-disabled"];
      },
      onFocus: input.onFocus,
      onBlur: input.onBlur,
      onClick: input.onClick,
      onKeyDown: input.onKeyDown,
      get class() {
        return css.cn(props.class);
      },
    };
  });
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children ?? chosen() ?? placeholder() ?? ""}</Button>
  ));
};

/**
 * The listbox, floating under the trigger with the same anchor as the menu. The primitive hides it, names its active option
 * and leaves the keys to the trigger, which keeps the DOM focus; nothing here listens for a key or for a pointer.
 */
export const SelectContent = (props: SelectContentProps): JSX.Element => {
  const { combobox, items, label } = useContext(SelectContext);
  const merged = merge(combobox.listboxProps, () => ({
    "data-part": "select-listbox",
    get "aria-label"() {
      return label();
    },
    get class() {
      return css.cn(contentClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>{props.children ?? items.map((_, index) => <SelectOption index={index} />)}</div>
  ));
};

/**
 * One row: `role="option"`, its id and its announced state from the primitive, the declared label unless `children` says.
 * A press keeps the focus on the trigger (the primitive cancels the mouse-down) and commits.
 */
export const SelectOption = (props: SelectOptionProps): JSX.Element | null => {
  const { combobox, items } = useContext(SelectContext);
  const declared = items[props.index];
  const option = combobox.options()[props.index];
  if (declared === undefined || option === undefined) {
    return null;
  }
  const merged = merge(option.props, () => ({
    "data-part": "select-option",
    get class() {
      return css.cn(optionClass, props.class);
    },
  }));
  const state: SelectOptionState = {
    highlighted: () => combobox.open() && combobox.activeIndex() === props.index,
    selected: () => combobox.value() === declared.value,
  };
  return renderPart(props, merged, state, (part) => (
    <div {...part}>{props.children ?? declared.label}</div>
  ));
};
