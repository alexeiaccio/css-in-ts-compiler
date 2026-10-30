import { type Menu as MenuController, type MenuItemInput, createMenu } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, createEffect, merge, omit, onSettled, useContext } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface MenuProps {
  /** The items, declared once: the primitive needs the labels for typeahead, and the ids come from here. */
  readonly items: ReadonlyArray<string | MenuItemInput>;
  /** Open at mount. */
  readonly defaultOpen?: boolean;
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
  /** A row of your own; without children the declared items are the rows, in order. */
  readonly class?: string;
  readonly children?: JSX.Element;
}

/** What a row's `render` sees: where the highlight is, and whether the item activates. */
export interface MenuItemState {
  readonly highlighted: () => boolean;
  readonly disabled: () => boolean;
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

const triggerOf = (root: HTMLElement | undefined): HTMLElement | undefined =>
  root?.querySelector<HTMLElement>('[aria-haspopup="menu"]') ?? undefined;

const rowsOf = (root: HTMLElement | undefined): HTMLElement[] =>
  root === undefined ? [] : [...root.querySelectorAll<HTMLElement>('[data-part="menu-item"]')];

/**
 * APG menu button, styled: `Menu.Trigger` (a `Button`) opens `Menu.Content`, a list of `Menu.Item`s with one roving tab
 * stop. `createMenu` owns the open state, the ARIA, the arrow keys, Escape and the typeahead buffer; the kit adds the
 * anchor the content floats from, the surface, the highlight and the DOM focus, and closes the menu on a click outside.
 *
 * The items are declared on `Menu`, once: the primitive needs their labels, so a row names its item by `index` instead of
 * repeating the label. One level only — no submenus, no checkbox or radio items, no separators (the primitive has none).
 */
export const Menu = (props: MenuProps): JSX.Element => {
  const menu = createMenu({
    items: props.items,
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
  // trigger's own click is inside the anchor, so the toggle still works.
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
    <MenuContext value={{ menu, anchor: () => anchor }}>
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

/** One row: `role="menuitem"`, its id and its tab stop from the primitive, the declared label unless `children` says. */
export const MenuItem = (props: MenuItemProps): JSX.Element | null => {
  const { menu } = useContext(MenuContext);
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
  };
  return renderPart(props, merged, state, (part) => (
    <div {...part}>{props.children ?? declared.label}</div>
  ));
};
