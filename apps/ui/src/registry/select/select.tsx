import { createListbox, type Listbox, type ListboxItemInput } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import {
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  merge,
  omit,
  onSettled,
  useContext,
} from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface SelectProps {
  /** The options, declared once: the primitive needs their labels for typeahead, and the trigger shows the chosen one. */
  readonly items: ReadonlyArray<string | ListboxItemInput>;
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
  /** Item indices that cannot be chosen. */
  readonly disabled?: ReadonlyArray<number>;
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
  readonly disabled: () => boolean;
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
  readonly listbox: Listbox;
  readonly listboxId: string;
  readonly anchor: () => HTMLElement | undefined;
  readonly open: () => boolean;
  readonly show: () => void;
  readonly close: (focusTrigger: boolean) => void;
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

// The highlight is the roving tab stop the primitive announces (`tabindex="0"` on one row), not a second copy of the active
// index: a pointer hover and an arrow key both move it. The chosen option is painted from `aria-selected`.
const optionClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.attr("tabindex", "0")(css.bg(t.color.buttonBackground)),
  css.attr("aria-selected", "true")(css.fontWeight("500")),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

const triggerOf = (root: HTMLElement | undefined): HTMLElement | undefined =>
  root?.querySelector<HTMLElement>('[aria-haspopup="listbox"]') ?? undefined;

const rowsOf = (root: HTMLElement | undefined): HTMLElement[] =>
  root === undefined ? [] : [...root.querySelectorAll<HTMLElement>('[data-part="select-option"]')];

/**
 * APG listbox as a select, styled: `Select.Trigger` (a `Button`) shows the chosen label, `Select.Content` is the floating
 * list of `Select.Option`s. `createListbox` owns the selection, the single roving tab stop, the arrow keys, Home and End,
 * Enter and typeahead; a listbox is not a combobox, so the kit owns the open state, Escape, Tab and the click outside, and
 * hands the focus back to the trigger when it closes from the keyboard.
 *
 * The options are declared on `Select`, once, as on `Menu`: the primitive needs their labels for typeahead, and the
 * trigger needs them to show the chosen one.
 */
export const Select = (props: SelectProps): JSX.Element => {
  const base = props.id ?? createUniqueId();
  const listboxId = `${base}-listbox`;
  const listbox = createListbox({
    id: base,
    items: props.items,
    get value() {
      return props.value === undefined ? undefined : [props.value];
    },
    defaultValue: props.defaultValue === undefined ? [] : [props.defaultValue],
    get disabled() {
      return props.disabled;
    },
    get label() {
      return props.label;
    },
    get onValueChange() {
      const change = props.onValueChange;
      return change === undefined
        ? undefined
        : (selected: ReadonlyArray<number>) => change(selected[0] ?? 0);
    },
  });
  const [open, setOpen] = createSignal(false);
  let anchor: HTMLDivElement | undefined;

  const show = (): void => {
    if (open()) {
      return;
    }
    setOpen(true);
    // the focused flag and the entry option (the chosen one, else the first); the DOM focus follows in the content's effect
    listbox.focus();
  };

  const close = (focusTrigger: boolean): void => {
    if (!open()) {
      return;
    }
    setOpen(false);
    listbox.blur();
    if (focusTrigger) {
      triggerOf(anchor)?.focus();
    }
  };

  // a pointerdown outside the anchor is the dismiss the primitive does not own (as in Menu)
  onSettled(() => {
    const dismiss = (event: PointerEvent): void => {
      if (anchor !== undefined && event.target instanceof Node && !anchor.contains(event.target)) {
        close(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  });

  const chosen = (): string | undefined => {
    const index = listbox.selected()[0];
    return index === undefined ? undefined : listbox.items[index]?.label;
  };

  return (
    <SelectContext
      value={{
        listbox,
        listboxId,
        anchor: () => anchor,
        open,
        show,
        close,
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

/** The button that opens the list and shows the chosen label: `Button` unless `render` says otherwise. */
export const SelectTrigger = (props: SelectTriggerProps): JSX.Element => {
  const { listbox, listboxId, open, show, close, chosen, placeholder } = useContext(SelectContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button`, which owns the attribute
  const merged = merge(rest, () => ({
    type: "button" as const,
    "aria-haspopup": "listbox" as const,
    get "aria-expanded"(): "true" | "false" {
      return open() ? "true" : "false";
    },
    "aria-controls": listboxId,
    "aria-label": listbox.listboxProps["aria-label"],
    get class() {
      return css.cn(props.class);
    },
    onClick: () => {
      if (open()) {
        close(false);
      } else {
        show();
      }
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        show();
      }
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children ?? chosen() ?? placeholder() ?? ""}</Button>
  ));
};

/**
 * The list, floating under the trigger with the same anchor as the menu. The primitive's handler owns the arrows, Home,
 * End, Enter and typeahead; the kit closes on Escape (returning the focus), on Tab and after a choice. The DOM focus is
 * moved to whatever row holds the roving tab stop, as the menu does.
 */
export const SelectContent = (props: SelectContentProps): JSX.Element => {
  const { listbox, listboxId, anchor, open, close } = useContext(SelectContext);
  createEffect(
    () => [open(), listbox.active()] as const,
    ([isOpen, index]) => {
      if (!isOpen) {
        return;
      }
      const element = rowsOf(anchor())[index];
      if (element !== undefined && document.activeElement !== element) {
        element.focus();
      }
    },
  );
  const merged = merge(listbox.listboxProps, () => ({
    id: listboxId,
    "data-part": "select-listbox",
    get hidden() {
      return !open();
    },
    get class() {
      return css.cn(contentClass, props.class);
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      listbox.listboxProps.onKeyDown(event);
      if (event.key === "Tab") {
        close(false);
        return;
      }
      if (event.key === "Enter" || event.key === " " || event.key === "Space") {
        close(true);
      }
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>
      {props.children ?? listbox.items.map((_, index) => <SelectOption index={index} />)}
    </div>
  ));
};

/** One row: `role="option"`, its id and its tab stop from the primitive, the declared label unless `children` says. */
export const SelectOption = (props: SelectOptionProps): JSX.Element | null => {
  const { listbox, close } = useContext(SelectContext);
  const declared = listbox.items[props.index];
  if (declared === undefined) {
    return null;
  }
  const option = listbox.optionProps(props.index);
  const merged = merge(option, () => ({
    "data-part": "select-option",
    get class() {
      return css.cn(optionClass, props.class);
    },
    onClick: () => {
      option.onClick();
      close(true);
    },
  }));
  const state: SelectOptionState = {
    highlighted: () => listbox.active() === props.index,
    selected: () => listbox.selected().includes(props.index),
    disabled: () => declared.disabled,
  };
  return renderPart(props, merged, state, (part) => (
    <div {...part}>{props.children ?? declared.label}</div>
  ));
};
