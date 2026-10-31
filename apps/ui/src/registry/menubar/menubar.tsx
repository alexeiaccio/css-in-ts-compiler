import {
  type Menubar as MenubarController,
  type MenubarItemInput,
  type MenubarOptions,
  createMenubar,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, createEffect, merge, onSettled, useContext } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface MenubarProps extends MenubarOptions, Renderable<PartProps, void> {
  /** The bar, declared once: the labels are the primitive's typeahead, and the rows come from here. */
  readonly items: ReadonlyArray<string | MenubarItemInput>;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (menubar: MenubarController) => void;
  readonly class?: string;
  /** One `Menubar.Menu` per item, by default; a bar of your own says otherwise. */
  readonly children?: JSX.Element;
}

export interface MenubarMenuProps extends Renderable<PartProps, void> {
  /** The index in the bar's `items` this top-level item is. */
  readonly index: number;
  readonly class?: string;
  /** A `Menubar.Trigger` and, when the item owns one, a `Menubar.Content`. */
  readonly children?: JSX.Element;
}

export type MenubarTriggerPartProps = PartProps;

export interface MenubarTriggerProps extends Renderable<MenubarTriggerPartProps, void> {
  readonly class?: string;
  /** The declared label by default. */
  readonly children?: JSX.Element;
}

export interface MenubarContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  /** Rows of your own; without children the declared menu items are the rows, in order. */
  readonly children?: JSX.Element;
}

/** What a row's `render` sees: the tab stop the primitive announces, and the declared disabled state. */
export interface MenubarItemState {
  readonly highlighted: () => boolean;
  readonly disabled: () => boolean;
}

export interface MenubarItemProps extends Renderable<PartProps, MenubarItemState> {
  /** The index in the open menu's items this row is. */
  readonly index: number;
  readonly class?: string;
  /** The row's content; the declared label by default. */
  readonly children?: JSX.Element;
}

export interface MenubarSubProps extends Renderable<PartProps, MenubarItemState> {
  /** The index in the open menu's items this parent row is. */
  readonly index: number;
  readonly class?: string;
  /** The submenu; the declared `Menubar.SubItem`s by default. */
  readonly children?: JSX.Element;
}

export interface MenubarSubContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  /** Rows of your own; without children the declared submenu items are the rows, in order. */
  readonly children?: JSX.Element;
}

export interface MenubarSubItemProps extends Renderable<PartProps, MenubarItemState> {
  /** The index in the parent row's submenu this row is. */
  readonly index: number;
  readonly class?: string;
  /** The row's content; the declared label by default. */
  readonly children?: JSX.Element;
}

/** The bar item whose menu a subtree belongs to, and the submenu row it is in, if any. */
interface MenubarMenuContextValue {
  readonly bar: number;
  readonly item: number | undefined;
}

const MenubarContext = createContext<{ readonly menubar: MenubarController }>();
const MenubarMenuContext = createContext<MenubarMenuContextValue>();

// The anchor is the decision this component makes about floating, as in Menu and Select: one box around the bar item
// and its menu, `position: relative`, and the menu is `position: absolute` in it. Nothing is measured and nothing listens
// to scroll or resize. ponytail: an inline absolute popup, so an `overflow: hidden` ancestor clips the menu and a menu
// near the viewport's edge is not flipped; a real floating layer is the wayfinder entry's "left", and neither is attempted.
const anchorClass = css.cn(css.position("relative"), css.display("inline-flex"));

const barClass = css.cn(css.display("flex"), css.alignItems("center"), css.gap(t.space._1));

const triggerClass = css.cn(
  css.padding(t.space._1, t.space._2),
  css.bg("transparent"),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-expanded", "true")(css.bg(t.color.buttonBackground)),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);

// The popover surface, the same box Menu uses. No `display`: the primitive hides the menu with the `hidden` attribute, and
// a display declaration here would override the UA's `[hidden] { display: none }`.
const surfaceClass = css.cn(
  css.zIndex("var(--z-popover)"),
  css.minWidth("max-content"),
  css.padding(t.space._1),
  css.bg(t.color.overlayBackground),
  css.color(t.color.text),
  css.border("1px solid", t.color.overlayBorder),
  css.borderRadius(t.radius.lg),
  css.boxShadow(t.shadow.popover),
);

const menuClass = css.cn(
  css.position("absolute"),
  css.insetBlockStart("100%"),
  css.insetInlineStart("0"),
  css.marginBlockStart(t.space._1),
  surfaceClass,
);

// A submenu floats beside its parent row, which is the anchor: the row is `position: relative`. `inset-inline-start: 100%`
// is the row's inline end, so the popup follows the writing direction with no kit copy of it.
const submenuClass = css.cn(
  css.position("absolute"),
  css.insetBlockStart("0"),
  css.insetInlineStart("100%"),
  css.marginInlineStart(t.space._1),
  surfaceClass,
);

// The highlight is the roving tab stop the primitive announces (`tabindex="0"` on one row), not a second copy of the
// state: a pointer hover and an arrow key both move it.
const rowClass = css.cn(
  // the marker `within()` reads: the row's own `aria-expanded` is what the chevron follows
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

const subRowClass = css.cn(
  rowClass,
  css.position("relative"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
);

// The marker is the row's own announcement: `aria-haspopup` says the row opens something and `aria-expanded` (the
// primitive's) turns it. The kit keeps no copy of the open state, as with Menu's check mark.
const chevronClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.visibility("hidden"),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-haspopup", "menu"))(css.visibility("visible")),
  css.within(css.attr("aria-expanded", "true"))(css.transform("rotate(90deg)")),
);

/** The submenu parts, which need a parent row; a misplaced one is a page error, not a silent no-op. */
const subOf = (
  bar: number | undefined,
  item: number | undefined,
): { readonly bar: number; readonly item: number } => {
  if (bar === undefined || item === undefined) {
    throw new Error("Menubar.SubContent and Menubar.SubItem must be inside a Menubar.Sub");
  }
  return { bar, item };
};

/**
 * APG menu and menubar, styled: a `role="menubar"` bar of top-level items, each a `Menubar.Trigger` (its bar item) with a
 * `Menubar.Content` under it, rows with one roving tab stop, and nested `Menubar.Sub` / `Menubar.SubContent` /
 * `Menubar.SubItem` levels. `createMenubar` owns the ARIA, the roving tab stop, the arrow keys with the menubar rule that
 * Right/Left moves along the bar and opens the next menu without taking focus into it, the submenu keys, Home and End,
 * Escape (one level at a time), Tab, the typeahead and the hover that opens a submenu once its menu is open. The kit adds
 * the anchor each popup floats from, the surfaces, the chevron painted from `aria-expanded`, and the DOM focus: the
 * primitive reports `focusLevel` (0 outside, 1 the bar, 2 a top-level menu, 3 a submenu) and `focusIndex`, and the kit
 * moves focus to that level only. It also listens for a pointerdown outside the bar, which the primitive does not own.
 *
 * The bar is declared on `Menubar`, once: the primitive needs the labels for typeahead, and the rows are built from the
 * same tree. Without children the bar is one `Menubar.Menu` per item, with a `Content` where the item has a menu.
 */
export const Menubar = (props: MenubarProps): JSX.Element => {
  const menubar = createMenubar({
    items: props.items,
    orientation: props.orientation,
    wrap: props.wrap,
    id: props.id,
    prefs: props.prefs,
    suppressFocusWrite: props.suppressFocusWrite,
  });
  props.onReady?.(menubar);

  let root: HTMLDivElement | undefined;

  // One move for the whole widget, as MenuContent does for one menu: the level says which container and the index which
  // row. Level 1 is the bar item itself — Right/Left opens a menu there and the focus stays on the bar — so the rule is the
  // primitive's `focusLevel`, and the kit never invents a level.
  createEffect(
    () =>
      [
        menubar.focusLevel(),
        menubar.focusIndex(),
        menubar.barStop(),
        menubar.openTop(),
        menubar.openSub(),
      ] as const,
    ([level, index, stop, top, sub]) => {
      if (root === undefined) {
        return;
      }
      const element =
        level === 1
          ? triggers(root)[stop]
          : level === 2
            ? elementWithId(root, menubar.menuProps(top).id)?.children[index]
            : level === 3
              ? elementWithId(root, menubar.submenuProps(top, sub).id)?.children[index]
              : undefined;
      if (element instanceof HTMLElement && document.activeElement !== element) {
        element.focus();
      }
    },
  );

  // A pointerdown outside the bar is the dismiss the primitive does not own: it has no document listener, and a press on a
  // bar item or a row is inside the root, so it still opens and activates.
  onSettled(() => {
    const dismiss = (event: PointerEvent): void => {
      if (root !== undefined && event.target instanceof Node && !root.contains(event.target)) {
        menubar.leave();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  });

  const merged = merge(menubar.menubarProps, () => ({
    "data-part": "menubar",
    get class() {
      return css.cn(barClass, props.class);
    },
    onKeyDown: (event: KeyboardEvent) => {
      menubar.menubarProps.onKeyDown(event);
      // typeahead is the primitive's own buffer and its key handler does not feed it, so a letter is handed over here
      if (event.key.length === 1 && event.key !== " ") {
        menubar.type(event.key);
      }
    },
  }));
  return (
    <MenubarContext value={{ menubar }}>
      {renderPart(props, merged, undefined, (part) => (
        <div
          {...part}
          ref={(element: HTMLDivElement) => {
            root = element;
          }}
        >
          {props.children ??
            menubar.items.map((item, index) => (
              <MenubarMenu index={index}>
                <MenubarTrigger />
                {item.menu.length > 0 ? <MenubarContent /> : undefined}
              </MenubarMenu>
            ))}
        </div>
      ))}
    </MenubarContext>
  );
};

const triggers = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="menubar-trigger"]'),
];

const elementWithId = (root: HTMLElement, id: string): HTMLElement | undefined =>
  root.querySelector<HTMLElement>(`[id="${id}"]`) ?? undefined;

/** One top-level item: the box a `Menubar.Trigger` and its `Menubar.Content` share, `position: relative`. */
export const MenubarMenu = (props: MenubarMenuProps): JSX.Element => {
  const merged = {
    "data-part": "menubar-anchor",
    get class() {
      return css.cn(anchorClass, props.class);
    },
  };
  return (
    <MenubarMenuContext value={{ bar: props.index, item: undefined }}>
      {renderPart(props, merged, undefined, (part) => (
        <div {...part}>{props.children}</div>
      ))}
    </MenubarMenuContext>
  );
};

/** The bar item: `role="menuitem"` with `aria-haspopup`, `aria-expanded` and the roving tab stop from the primitive. */
export const MenubarTrigger = (props: MenubarTriggerProps): JSX.Element => {
  const { menubar } = useContext(MenubarContext);
  const { bar } = useContext(MenubarMenuContext);
  const declared = menubar.items[bar];
  const merged = merge(menubar.barItemProps(bar), () => ({
    "data-part": "menubar-trigger",
    get class() {
      return css.cn(triggerClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>{props.children ?? declared?.label ?? ""}</div>
  ));
};

/**
 * The menu, floating under its bar item. Rows come from the declared tree: a row with a submenu is a `Menubar.Sub`, the rest
 * are `Menubar.Item`s. The primitive hides it and moves the focus, which `Menubar` follows by level.
 */
export const MenubarContent = (props: MenubarContentProps): JSX.Element => {
  const { menubar } = useContext(MenubarContext);
  const { bar } = useContext(MenubarMenuContext);
  const rows = menubar.items[bar]?.menu ?? [];
  const merged = merge(menubar.menuProps(bar), () => ({
    "data-part": "menubar-menu",
    get class() {
      return css.cn(menuClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>
      {props.children ??
        rows.map((row, index) =>
          row.submenu.length > 0 ? <MenubarSub index={index} /> : <MenubarItem index={index} />,
        )}
    </div>
  ));
};

/** One leaf row: `role="menuitem"`, its id and tab stop from the primitive, the declared label unless `children` says. */
export const MenubarItem = (props: MenubarItemProps): JSX.Element | null => {
  const { menubar } = useContext(MenubarContext);
  const { bar } = useContext(MenubarMenuContext);
  const declared = menubar.items[bar]?.menu[props.index];
  if (declared === undefined) {
    return null;
  }
  const merged = merge(menubar.menuItemProps(bar, props.index), () => ({
    "data-part": "menubar-item",
    get class() {
      return css.cn(rowClass, props.class);
    },
  }));
  const state: MenubarItemState = {
    highlighted: () =>
      menubar.focusLevel() === 2 &&
      menubar.openTop() === bar &&
      menubar.focusIndex() === props.index,
    disabled: () => declared.disabled,
  };
  return renderPart(props, merged, state, (part) => (
    <div {...part}>{props.children ?? declared.label}</div>
  ));
};

/**
 * A parent row and its submenu: the row is the anchor (`position: relative`) and the `Menubar.SubContent` sits in it, so the
 * popup floats beside the row and the row's announcement is what the chevron follows. `children` replaces the submenu.
 */
export const MenubarSub = (props: MenubarSubProps): JSX.Element | null => {
  const { menubar } = useContext(MenubarContext);
  const { bar } = useContext(MenubarMenuContext);
  const declared = menubar.items[bar]?.menu[props.index];
  if (declared === undefined) {
    return null;
  }
  const merged = merge(menubar.menuItemProps(bar, props.index), () => ({
    "data-part": "menubar-sub",
    get class() {
      return css.cn(subRowClass, props.class);
    },
  }));
  const state: MenubarItemState = {
    highlighted: () =>
      menubar.focusLevel() === 2 &&
      menubar.openTop() === bar &&
      menubar.focusIndex() === props.index,
    disabled: () => declared.disabled,
  };
  return (
    <MenubarMenuContext value={{ bar, item: props.index }}>
      {renderPart(props, merged, state, (part) => (
        <div {...part}>
          <span>{declared.label}</span>
          <span aria-hidden="true" class={chevronClass}>
            ›
          </span>
          {props.children ?? <MenubarSubContent />}
        </div>
      ))}
    </MenubarMenuContext>
  );
};

/** The submenu: `role="menu"` and `hidden` from the primitive, absolute in the parent row. */
export const MenubarSubContent = (props: MenubarSubContentProps): JSX.Element => {
  const { menubar } = useContext(MenubarContext);
  const context = useContext(MenubarMenuContext);
  const { bar, item } = subOf(context.bar, context.item);
  const rows = menubar.items[bar]?.menu[item]?.submenu ?? [];
  const merged = merge(menubar.submenuProps(bar, item), () => ({
    "data-part": "menubar-submenu",
    get class() {
      return css.cn(submenuClass, props.class);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <div {...part}>
      {props.children ?? rows.map((_, index) => <MenubarSubItem index={index} />)}
    </div>
  ));
};

/** One row of a submenu: `role="menuitem"` and its tab stop from the primitive, the declared label unless `children` says. */
export const MenubarSubItem = (props: MenubarSubItemProps): JSX.Element | null => {
  const { menubar } = useContext(MenubarContext);
  const context = useContext(MenubarMenuContext);
  const { bar, item } = subOf(context.bar, context.item);
  const declared = menubar.items[bar]?.menu[item]?.submenu[props.index];
  if (declared === undefined) {
    return null;
  }
  const merged = merge(menubar.submenuItemProps(bar, item, props.index), () => ({
    "data-part": "menubar-subitem",
    get class() {
      return css.cn(rowClass, props.class);
    },
  }));
  const state: MenubarItemState = {
    highlighted: () =>
      menubar.focusLevel() === 3 &&
      menubar.openTop() === bar &&
      menubar.openSub() === item &&
      menubar.focusIndex() === props.index,
    disabled: () => declared.disabled,
  };
  return renderPart(props, merged, state, (part) => (
    <div {...part}>{props.children ?? declared.label}</div>
  ));
};
