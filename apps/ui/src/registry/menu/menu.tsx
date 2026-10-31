import {
  type Menu as MenuController,
  type MenuItemInput,
  type MenuVariant,
  createMenu,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, createEffect, merge, omit, onSettled, useContext } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/**
 * The checkable state, readable: checkbox items that are checked, and the chosen radio, by index. The primitive takes
 * the same pair (`checked` / `choice`), so the kit passes it straight through and a caller never writes an encoding; any
 * checkbox item can be controlled, not just item 0.
 */
export interface MenuChecked {
  /** The checked checkbox items, by index. */
  readonly checked: ReadonlyArray<number>;
  /** The chosen radio item, by index; `-1` or absent means none. */
  readonly radio?: number;
}

export interface MenuProps {
  /** The items, declared once: the primitive needs the labels for typeahead, and the ids come from here. */
  readonly items: ReadonlyArray<string | MenuItemInput>;
  /**
   * The primitive's variant: `plain` by default; `checkbox-items`, `radio-items` or `mixed` gives each item its role by
   * index (the primitive's rule, not a `kind` on the item).
   */
  readonly variant?: MenuVariant;
  /** Controlled checked items; leave it out and the menu owns them. */
  readonly value?: MenuChecked | undefined;
  /** Uncontrolled checked items at mount; ignored while `value` is set. */
  readonly defaultValue?: MenuChecked;
  /** A request to change the checked items. A plain item is `onItemClick`, not this. */
  readonly onValueChange?: (value: MenuChecked) => void;
  /** Controlled: the host owns the open state and this is the only thing that opens or closes it. */
  readonly open?: boolean;
  /** Open at mount; ignored while `open` is set. */
  readonly defaultOpen?: boolean;
  /** A request to change the open state: uncontrolled it is accepted, controlled the host may ignore it. */
  readonly onOpenChange?: (open: boolean) => void;
  /** An item was activated: its index in `items`. */
  readonly onItemClick?: (index: number) => void;
  /** Item indices that stay focusable and never activate. */
  readonly disabled?: ReadonlyArray<number>;
  readonly id?: string;
  readonly children?: JSX.Element;
}

export type MenuTriggerPartProps = PartProps;

export interface MenuTriggerProps extends Renderable<MenuTriggerPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface MenuContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  /** Rows of your own; without children the declared items are the rows, in order. */
  readonly children?: JSX.Element;
}

/** What a row's `render` sees: where the highlight is, whether the item activates, and whether it is checked. */
export interface MenuItemState {
  readonly highlighted: () => boolean;
  readonly disabled: () => boolean;
  /** The primitive's `aria-checked` is `true`; always `false` on a plain item. */
  readonly checked: () => boolean;
}

export type MenuItemPartProps = PartProps;

export interface MenuItemProps extends Renderable<MenuItemPartProps, MenuItemState> {
  /** The index in the menu's `items` this row is: the primitive owns the id, the role and the roving tab stop. */
  readonly index: number;
  readonly class?: string;
  /** The row's content; the declared label by default. */
  readonly children?: JSX.Element;
}

const MenuContext = createContext<{
  readonly menu: MenuController;
  readonly anchor: () => HTMLElement | undefined;
  /** A checkable variant: every row reserves the mark's column, so a mixed menu's plain rows line up. */
  readonly checkable: boolean;
}>();

// The anchor is the decision this component makes about floating: one box around the trigger and the menu, `position:
// relative`, and the content is `position: absolute` in it. No measurement, no listener on scroll or resize, and the
// content moves with the trigger for free. The cost is the wrapper (a box the caller's layout did not have) and any
// `overflow: hidden` ancestor clips the menu; a real floating layer is the wayfinder entry's "left".
const anchorClass = css.cn(css.position("relative"), css.display("inline-flex"));

const contentClass = css.cn(
  css.position("absolute"),
  css.insetBlockStart("100%"),
  css.insetInlineStart("0"),
  css.marginBlockStart(t.space._1),
  // `z-index` takes an `<integer>`, which a `number` token is not: like Dialog, the class reads the token by hand
  css.zIndex("var(--z-popover)"),
  css.minWidth("max-content"),
  // no `display`: the primitive hides the menu with the `hidden` attribute, and a display declaration in this class would
  // override the UA's `[hidden] { display: none }` (the rows are block-level flex boxes, so they stack anyway)
  css.padding(t.space._1),
  css.bg(t.color.overlayBackground),
  css.color(t.color.text),
  css.border("1px solid", t.color.overlayBorder),
  css.borderRadius(t.radius.lg),
  css.boxShadow(t.shadow.popover),
);

// The highlight is the roving tab stop the primitive announces (`tabindex="0"` on one row), not a second copy of the
// state: a pointer hover and an arrow key both move it.
const itemClass = css.cn(
  // the marker `within()` reads: the row's own `aria-checked` is what the mark follows
  css.group(),
  css.display("flex"),
  css.alignItems("center"),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.attr("tabindex", "0")(css.bg(t.color.buttonBackground)),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

// The check is the primitive's `aria-checked` and nothing else: hidden by default, shown only inside a row that says it is
// checked, so the kit keeps no copy of the state. Its width is reserved in a checkable menu, so labels do not shift when a
// box is ticked.
const markClass = css.cn(
  css.width("1em"),
  css.flexShrink(0),
  css.marginInlineEnd(t.space._1),
  css.fontSize("0.75rem"),
  css.color(t.color.muted),
  css.visibility("hidden"),
  css.within(css.attr("aria-checked", "true"))(css.visibility("visible")),
);

const triggerOf = (root: HTMLElement | undefined): HTMLElement | undefined =>
  root?.querySelector<HTMLElement>('[aria-haspopup="menu"]') ?? undefined;

const rowsOf = (root: HTMLElement | undefined): HTMLElement[] =>
  root === undefined ? [] : [...root.querySelectorAll<HTMLElement>('[data-part="menu-item"]')];

/**
 * APG menu button, styled: `Menu.Trigger` (a `Button`) opens `Menu.Content`, a list of `Menu.Item`s with one roving tab
 * stop. `createMenu` owns the open state, the ARIA, the arrow keys, Escape and the typeahead buffer; the kit adds the
 * anchor the content floats from, the surface, the highlight and the DOM focus, and closes the menu on a click outside.
 *
 * `open` makes it controlled: then every intent (the trigger, a key, Escape, an item, a click outside) is a request the
 * host may ignore, and `open` is the only thing that moves. Without it the primitive owns the state from `defaultOpen`.
 *
 * The items are declared on `Menu`, once: the primitive needs their labels, so a row names its item by `index` instead of
 * repeating the label. One level only — no submenus, no separators (the primitive has none). `variant` turns the rows into
 * checkbox and radio items; Space toggles one without closing, Enter toggles and closes, and a radio clears its group.
 */
export const Menu = (props: MenuProps): JSX.Element => {
  const menu: MenuController = createMenu({
    items: props.items,
    variant: props.variant,
    get checked() {
      return props.value?.checked;
    },
    get choice() {
      return props.value === undefined ? undefined : (props.value.radio ?? -1);
    },
    get defaultChecked() {
      return props.defaultValue?.checked;
    },
    get defaultChoice() {
      return props.defaultValue?.radio;
    },
    get onCheckedValuesChange() {
      const change = props.onValueChange;
      return change === undefined
        ? undefined
        : (checked: ReadonlyArray<number>, choice: number) => {
            change({ checked, radio: choice });
          };
    },
    get open() {
      return props.open;
    },
    defaultOpen: props.defaultOpen,
    disabled: props.disabled,
    id: props.id,
    get onOpenChange() {
      return props.onOpenChange;
    },
    get onItemClick() {
      return props.onItemClick;
    },
  });
  let anchor: HTMLDivElement | undefined;
  // A pointerdown outside the anchor is the dismiss the primitive does not own: it has no document listener, and the
  // trigger's own click is inside the anchor, so the toggle still works. It is a close *request*, so a host that holds
  // `open` keeps the menu.
  onSettled(() => {
    const dismiss = (event: PointerEvent): void => {
      if (anchor !== undefined && event.target instanceof Node && !anchor.contains(event.target)) {
        menu.leave();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  });
  return (
    <MenuContext
      value={{
        menu,
        anchor: () => anchor,
        checkable: props.variant !== undefined && props.variant !== "plain",
      }}
    >
      <div
        data-part="menu-anchor"
        class={anchorClass}
        ref={(element: HTMLDivElement) => {
          anchor = element;
        }}
      >
        {props.children}
      </div>
    </MenuContext>
  );
};

/** The button that opens the menu: `Button` unless `render` says otherwise. It is the element with `aria-haspopup`. */
export const MenuTrigger = (props: MenuTriggerProps): JSX.Element => {
  const { menu } = useContext(MenuContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button`, which owns the attribute, as `Dialog.Trigger` does
  const merged = merge(rest, menu.triggerProps, () => ({
    get class() {
      return css.cn(props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children}</Button>
  ));
};

/**
 * The list, floating under the trigger. Nothing is measured: it is absolute in the anchor. The primitive reports which
 * row holds the tab stop, and this moves the DOM focus there, so an arrow key lands somewhere — the same split as Tabs.
 */
export const MenuContent = (props: MenuContentProps): JSX.Element => {
  const { menu, anchor } = useContext(MenuContext);
  createEffect(
    () => [menu.focusLevel(), menu.focusIndex()] as const,
    ([level, index]) => {
      const element =
        level === 1 ? triggerOf(anchor()) : level === 2 ? rowsOf(anchor())[index] : undefined;
      if (element !== undefined && document.activeElement !== element) {
        element.focus();
      }
    },
  );
  const merged = merge(menu.menuProps, () => ({
    "data-part": "menu",
    get class() {
      return css.cn(contentClass, props.class);
    },
    onKeyDown: (event: KeyboardEvent) => {
      menu.menuProps.onKeyDown(event);
      // typeahead is the primitive's own buffer; its key handler does not feed it, so a letter is handed over here
      if (event.key.length === 1 && event.key !== " ") {
        menu.type(event.key);
      }
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>
      {props.children ?? menu.items.map((_, index) => <MenuItem index={index} />)}
    </div>
  ));
};

/**
 * One row: its role (`menuitem`, `menuitemcheckbox` or `menuitemradio`), id and tab stop from the primitive, the declared
 * label unless `children` says. A checkable row paints the check from its announced `aria-checked`, not from a kit copy.
 */
export const MenuItem = (props: MenuItemProps): JSX.Element | null => {
  const { menu, checkable } = useContext(MenuContext);
  const declared = menu.items[props.index];
  if (declared === undefined) {
    return null;
  }
  const merged = merge(menu.itemProps(props.index), () => ({
    "data-part": "menu-item",
    get class() {
      return css.cn(itemClass, props.class);
    },
  }));
  const state: MenuItemState = {
    highlighted: () => menu.focusLevel() === 2 && menu.focusIndex() === props.index,
    disabled: () => declared.disabled,
    checked: () => menu.itemProps(props.index)["aria-checked"] === "true",
  };
  return renderPart(props, merged, state, (part) => (
    <div {...part}>
      {checkable ? (
        <span aria-hidden="true" class={markClass}>
          ✓
        </span>
      ) : undefined}
      {props.children ?? declared.label}
    </div>
  ));
};
