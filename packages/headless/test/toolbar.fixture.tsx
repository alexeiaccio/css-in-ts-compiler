import { type Menu, createMenu } from "../src/menu";
import { type Toolbar, type ToolbarItemKind, createToolbar } from "../src/toolbar";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { ToolbarConfig } from "@cssints/apg-specs/apg/toolbar.bridge";
import { createEffect } from "solid-js";
import { render } from "@solidjs/web";

const MENU_ITEMS = ["One", "Two", "Three"];

const kindOfLabel = (label: string): ToolbarItemKind => {
  if (label === "text" || label === "textbox") {
    return "text";
  }
  if (label === "spin" || label === "spinbutton") {
    return "spin";
  }
  return "button";
};

const isMenuTriggerToken = (label: string): boolean => label.toLowerCase().includes("menutrigger");

// The open-key axis: perpendicular to the toolbar's own navigation axis.
const isPerpendicularKey = (orientation: "horizontal" | "vertical", key: string): boolean =>
  orientation === "horizontal" ? key === "Up" || key === "Down" : key === "Left" || key === "Right";

const asRecord = (value: Json | undefined): Record<string, Json> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  }
  return value as Record<string, Json>;
};

/**
 * Renders `createToolbar` as a `role=toolbar` container plus `data-part="item:N"`
 * children. The item-kind tokens `text`/`spin` map onto the spec's embedded
 * controls; a `menutrigger` token becomes the spec's menu-button (item 0) and
 * composes `createMenu` with `createToolbar` HERE in the fixture — the headless
 * `toolbar.ts` primitive never imports `menu.ts` (effects-of-atmosphere-gzzk).
 * The menu popup is a `data-part="popup"` sibling of the toolbar, so menu keys
 * never bubble into the toolbar's roving handler. DOM focus is synced to the
 * primitive's `focus` (item:N) and, while the menu is open, to the menu's own
 * focus (menuitem:N).
 */
export const mountToolbar = (config: ToolbarConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const kinds = config.items.map(kindOfLabel);
  const triggerIndex = config.items.findIndex(isMenuTriggerToken);
  const hasMenu = triggerIndex >= 0;
  let api: Toolbar | undefined;
  let menuApi: Menu | undefined;

  const itemElements = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="item"]'),
  ];
  const menuItemElements = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="menuitem"]'),
  ];

  const dispose = render(() => {
    const toolbar = createToolbar({
      items: config.items,
      kinds,
      orientation: config.orientation,
      wrap: config.wrap,
      disabled: config.disabled,
      onActivate: (index) => {
        events.set("onActivate", [...(events.get("onActivate") ?? []), `item:${index}`]);
      },
    });
    api = toolbar;
    const menu = hasMenu
      ? createMenu({
          items: MENU_ITEMS,
          triggerMode: "outside",
          id: `${toolbar.items[triggerIndex]?.id ?? "toolbar"}-menu`,
        })
      : undefined;
    menuApi = menu;
    createEffect(
      () => toolbar.focus(),
      (index) => {
        // while the menu is open the menu owns focus; the toolbar's roving
        // focus is suspended, so do not pull focus back to the trigger
        if (menu?.open() === true) {
          return;
        }
        if (index >= 0) {
          const target = itemElements()[index];
          if (target !== undefined && document.activeElement !== target) {
            target.focus();
          }
        } else {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          }
        }
      },
    );
    if (menu !== undefined) {
      createEffect(
        () => [menu.focusLevel(), menu.focusIndex()] as const,
        ([level, index]) => {
          let target: HTMLElement | undefined;
          if (level === 1) {
            target = itemElements()[triggerIndex];
          } else if (level === 2) {
            target = menuItemElements()[index];
          }
          if (target !== undefined) {
            if (document.activeElement !== target) {
              target.focus();
            }
          } else {
            const active = document.activeElement;
            if (active instanceof HTMLElement && root.contains(active)) {
              active.blur();
            }
          }
        },
      );
    }
    return (
      <>
        <div data-part="toolbar" tabindex={-1} {...toolbar.toolbarProps}>
          {toolbar.items.map((item, index) =>
            menu !== undefined && index === triggerIndex ? (
              <button
                data-part="item"
                {...toolbar.itemProps(index)}
                {...menu.triggerProps}
                onFocus={() => {
                  toolbar.focusItem(index);
                  menu.focusTrigger();
                }}
                onClick={() => {
                  toolbar.clickItem(index);
                  menu.clickTrigger();
                }}
              >
                {item.label}
              </button>
            ) : (
              <button data-part="item" {...toolbar.itemProps(index)}>
                {item.label}
              </button>
            ),
          )}
        </div>
        {menu !== undefined ? (
          <div data-part="popup" {...menu.menuProps}>
            {menu.items.map((item, index) => (
              <div data-part="menuitem" {...menu.itemProps(index)}>
                {item.label}
              </div>
            ))}
          </div>
        ) : null}
      </>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "tabIn":
          api?.focusIn();
          break;
        case "leave":
        case "blur":
          if (menuApi?.open() === true) {
            menuApi.leave();
          }
          api?.leave();
          break;
        case "tab": {
          const recordValue = asRecord(value);
          if (menuApi?.open() === true) {
            menuApi.keyDown("Tab");
          }
          api?.tab(recordValue["back"] === true);
          break;
        }
        case "click": {
          const index = Number(value);
          if (menuApi?.open() === true) {
            // the open menu light-dismisses on a toolbar click
            menuApi.closeMenu();
          } else {
            api?.clickItem(index);
            if (index === triggerIndex) {
              menuApi?.openMenu();
            }
          }
          break;
        }
        case "key": {
          const recordValue = asRecord(value);
          const key = recordValue["k"];
          if (typeof key !== "string") {
            throw new Error(`key needs a string, got ${JSON.stringify(value)}`);
          }
          // the walk alphabet spells arrows short (`Down`); createMenu wants
          // the DOM key (`ArrowDown`)
          const menuKey = ["Left", "Right", "Up", "Down"].includes(key) ? `Arrow${key}` : key;
          if (menuApi?.open() === true) {
            menuApi.keyDown(menuKey);
          } else if (
            menuApi !== undefined &&
            api?.focus() === triggerIndex &&
            isPerpendicularKey(api.orientation(), key)
          ) {
            // the perpendicular open key on the closed menu-button. A flat menu
            // has no Left/Right keys, so open explicitly: the forward
            // perpendicular key on the first item, the backward one on the last.
            const forward = api.orientation() === "horizontal" ? key === "Down" : key === "Right";
            if (forward) {
              menuApi.openMenu();
            } else {
              menuApi.setFocusItem(menuApi.items.length - 1);
            }
          } else {
            api?.keyDown(key);
          }
          break;
        }
        case "activate":
          if (
            menuApi?.open() === true ||
            (menuApi !== undefined && api?.focus() === triggerIndex)
          ) {
            // Enter/Space opens on the first item, or activates and closes
            menuApi.keyDown("Enter");
          } else {
            api?.activate();
          }
          break;
        case "toggleDisabled":
          api?.toggleDisabled(Number(value));
          break;
        case "flipOrientation":
          api?.setOrientation(api.orientation() === "horizontal" ? "vertical" : "horizontal");
          break;
        case "flipWrap":
          api?.setWrap(!api.wrap());
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
