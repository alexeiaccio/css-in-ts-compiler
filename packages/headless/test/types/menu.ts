// What `createMenu` / `createMenubar` accept and reject (effect-tsrs -p tsconfig.json; `@ts-expect-error` marks what must fail).
import {
  type Menu,
  type MenuItemProps,
  type MenuProps,
  type Menubar,
  createMenu,
  createMenubar,
} from "../../src/menu";
import { focusGroupAttribute } from "../../src/focusgroup";

const menu = createMenu({ items: ["a", "b"] });
const item = menu.itemProps(0);
const bar = createMenubar({ items: ["File", "Edit"] });

export const menuProps = {
  id: menu.menuProps.id,
  role: menu.menuProps.role,
  hidden: menu.menuProps.hidden,
  focusgroup: menu.menuProps.focusgroup,
  owner: menu.menuProps.ref,
  attribute: focusGroupAttribute({ behavior: "menu", axis: "block", wrap: true }),
};

export const itemProps = {
  id: item.id,
  role: item.role,
  checked: item["aria-checked"],
  disabled: item["aria-disabled"],
  element: item.ref,
};

export const menubarProps = {
  role: bar.menubarProps.role,
  orientation: bar.menubarProps["aria-orientation"],
  focusgroup: bar.menubarProps.focusgroup,
  owner: bar.menubarProps.ref,
  barItem: bar.barItemProps(0).ref,
  menu: bar.menuProps(0).focusgroup,
  menuOwner: bar.menuProps(0).ref,
  submenu: bar.submenuProps(0, 0).focusgroup,
  submenuOwner: bar.submenuProps(0, 0).ref,
  row: bar.menuItemProps(0, 0).ref,
  subRow: bar.submenuItemProps(0, 0, 0).ref,
};

// The provider owns an item's tabindex: the item props carry no such member, so this intersection cannot be met.
// @ts-expect-error the focusgroup provider writes the item tabindex, the widget never renders one
export const withTabindex: MenuItemProps & { readonly tabindex: 0 | -1 } = item;

// The owner's keydown listener is registered by `ref`, before the provider's, so the list's props carry no handler.
// @ts-expect-error a delegated `onKeyDown` would run after the polyfill has moved focus
export const withKeyDown: MenuProps & { readonly onKeyDown: (event: KeyboardEvent) => void } =
  menu.menuProps;

// The bar's listener is the same: `menubarProps.ref` registers it before the provider's.
// @ts-expect-error the bar's key handler is attached by its ref, not handed out as a prop
export const barWithKeyDown: Menubar["menubarProps"] & {
  readonly onKeyDown: (event: KeyboardEvent) => void;
} = bar.menubarProps;

// The bar item's tab stop is the provider's too.
// @ts-expect-error the bar item's tabindex belongs to the focusgroup provider
export const barItemWithTabindex: ReturnType<Menubar["barItemProps"]> & {
  readonly tabindex: 0 | -1;
} = bar.barItemProps(0);

// The provider seam is the same one `createToolbar` has.
export const providers = [
  createMenu({ items: ["a"], provider: "polyfill" }),
  createMenubar({ items: ["File"], provider: "auto" }),
];

// @ts-expect-error only the two providers of the adapter exist
export const badProvider = createMenu({ items: ["a"], provider: "native" });

// The arrows are the platform's: `keyDown` is the library's keys only, so it takes a key and returns nothing.
export const keys: void = menu.keyDown("Escape");
export const barKeys: void = bar.keyDown("Escape");

// The interface is unchanged where it matters: the focus readers are accessors.
export const readings = [menu.focusLevel(), menu.focusIndex(), bar.focusLevel(), bar.barStop()];
export type MenuApi = Menu;
