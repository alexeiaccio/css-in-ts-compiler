import { type Menu, createMenu, createMenubar } from "../src/menu";
import { createEffect, createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/scenario";
import type { MenuCheckableConfig } from "@cssints/apg-specs/apg/menu-checkable.bridge";
import type { MenuMenubarConfig } from "@cssints/apg-specs/apg/menu-menubar.bridge";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

const asRecord = (value: Json | undefined): Record<string, Json> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  }
  return value as Record<string, Json>;
};

const part = (root: HTMLElement, label: string): HTMLElement | undefined =>
  root.querySelector<HTMLElement>(`[data-part="${label}"]`) ?? undefined;

/**
 * Renders the checkable menu (`menu-checkable.qnt`): the `mixed` variant gives
 * item 1 a `menuitemcheckbox`, items 2-4 one `menuitemradio` group and item 5 a
 * plain `menuitem`. DOM focus is synced to the primitive's focused part.
 */
export const mountCheckableMenu = (config: MenuCheckableConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.value);
  let api: Menu | undefined;
  // True while the fixture applies focus itself: the primitive's onFocus must not
  // write that programmatic focus back into its own state (bean 209r).
  let suppressing = false;

  const items = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="menuitem"]'),
  ];

  const dispose = render(() => {
    const menu = createMenu({
      items: config.items,
      variant: config.variant,
      triggerMode: "held",
      disabled: config.disabled,
      get value() {
        return config.controlled ? host() : undefined;
      },
      onOpenChange: (open) => {
        events.set("onOpenChange", [...(events.get("onOpenChange") ?? []), open]);
      },
      onItemClick: (index) => {
        events.set("onItemClick", [...(events.get("onItemClick") ?? []), `menuitem:${index}`]);
      },
      onCheckedChange: (checked) => {
        // the ported checkable scenarios assert the latest checked value
        events.set("onCheckedChange", [checked]);
      },
      onValueChange: (index) => {
        events.set("onValueChange", [index + 1]);
      },
      onCheckedValueChange: (value) => {
        if (config.accepts) {
          setHost(value);
        }
      },
      suppressFocusWrite: () => suppressing,
    });
    api = menu;
    createEffect(
      () => [menu.focusLevel(), menu.focusIndex()] as const,
      ([level, index]) => {
        const target =
          level === 2 ? items()[index] : root.querySelector<HTMLElement>('[data-part="trigger"]');
        if (target !== undefined && target !== null) {
          if (document.activeElement !== target) {
            suppressing = true;
            target.focus();
            suppressing = false;
          }
        } else {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          }
        }
      },
    );
    return (
      <>
        <button data-part="trigger" {...menu.triggerProps}>
          Menu
        </button>
        <div data-part="menu" {...menu.menuProps}>
          {menu.items.map((item, index) => (
            <div data-part="menuitem" {...menu.itemProps(index)}>
              {item.label}
            </div>
          ))}
        </div>
      </>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focusTrigger();
          break;
        case "key": {
          const recordValue = asRecord(value);
          if (typeof recordValue["key"] !== "string") {
            throw new Error(`key needs a string, got ${JSON.stringify(value)}`);
          }
          api?.keyDown(recordValue["key"]);
          break;
        }
        case "setValue":
          setHost(Number(value));
          break;
        case "hostToggle":
          setHost((packed) => (packed >= 5 ? packed - 5 : packed + 5));
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    focus: () => {
      const level = api?.focusLevel();
      if (level === 1) {
        return "trigger";
      }
      if (level === 2) {
        return `menuitem:${api?.focusIndex()}`;
      }
      return null;
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

/**
 * Renders `createMenubar` with the `menu-menubar.qnt` fixed tree: the first bar
 * item's menu has three items with a submenu on its second, the second bar item
 * has a menu of two, the third none. Targets are full `data-part` labels
 * (`menuitem:0`, `menuitem:0/1`, `menuitem:0/1/0`, `submenu:1`).
 */
export const mountMenubar = (config: MenuMenubarConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  let api: ReturnType<typeof createMenubar> | undefined;
  // True while the fixture applies focus itself: the primitive's onFocus must not
  // write that programmatic focus back into its own state (bean 209r).
  let suppressing = false;

  const labels = config.items;
  const tree = [
    {
      label: labels[0] ?? "File",
      menu: [
        { label: "New" },
        { label: "More", submenu: [{ label: "One" }, { label: "Two" }] },
        { label: "Close" },
      ],
    },
    {
      label: labels[1] ?? "Edit",
      menu: [{ label: "Undo" }, { label: "Redo" }],
    },
    { label: labels[2] ?? "About" },
  ];

  const dispose = render(() => {
    const menubar = createMenubar({
      items: tree,
      orientation: config.orientation,
      suppressFocusWrite: () => suppressing,
    });
    api = menubar;
    createEffect(
      () =>
        [menubar.focusLevel(), menubar.focusIndex(), menubar.openTop(), menubar.openSub()] as const,
      ([level, index, openTop, openSub]) => {
        let label: string | undefined;
        if (level === 1) {
          label = `menuitem:${menubar.barStop()}`;
        } else if (level === 2) {
          label = `menuitem:${openTop}/${index}`;
        } else if (level === 3) {
          label = `menuitem:${openTop}/${openSub}/${index}`;
        }
        const target = label === undefined ? undefined : part(root, label);
        if (target !== undefined) {
          if (document.activeElement !== target) {
            suppressing = true;
            target.focus();
            suppressing = false;
          }
        } else {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          }
        }
      },
    );
    return (
      <div data-part="menubar" {...menubar.menubarProps}>
        {menubar.items.map((item, bar) => (
          <>
            <div data-part={`menuitem:${bar}`} {...menubar.barItemProps(bar)}>
              {item.label}
            </div>
            <div data-part={`menu:${bar}`} {...menubar.menuProps(bar)}>
              {item.menu.map((menuItem, index) => (
                <>
                  <div
                    data-part={`menuitem:${bar}/${index}`}
                    {...menubar.menuItemProps(bar, index)}
                  >
                    {menuItem.label}
                  </div>
                  {menuItem.submenu.length > 0 ? (
                    <div data-part="submenu:1" {...menubar.submenuProps(bar, index)}>
                      {menuItem.submenu.map((subItem, sub) => (
                        <div
                          data-part={`menuitem:${bar}/${index}/${sub}`}
                          {...menubar.submenuItemProps(bar, index, sub)}
                        >
                          {subItem.label}
                        </div>
                      ))}
                    </div>
                  ) : undefined}
                </>
              ))}
            </div>
          </>
        ))}
      </div>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focusIn();
          break;
        case "leave":
        case "blur":
          api?.leave();
          break;
        case "key": {
          const recordValue = asRecord(value);
          if (typeof recordValue["key"] !== "string") {
            throw new Error(`key needs a string, got ${JSON.stringify(value)}`);
          }
          api?.keyDown(recordValue["key"]);
          break;
        }
        case "typeahead":
          api?.typeaheadCode(Number(value));
          break;
        case "type":
          api?.type(String(value));
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    focus: () => {
      const level = api?.focusLevel();
      if (level === 1) {
        return `menuitem:${api?.barStop()}`;
      }
      if (level === 2) {
        return `menuitem:${api?.openTop()}/${api?.focusIndex()}`;
      }
      if (level === 3) {
        return `menuitem:${api?.openTop()}/${api?.openSub()}/${api?.focusIndex()}`;
      }
      return null;
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
