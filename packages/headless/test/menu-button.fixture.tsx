import { type Menu, createMenu } from "../src/menu";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { MenuButtonConfig } from "@cssints/apg-specs/src/apg/menu-button.bridge";
import type { Mounted } from "./dom-driver";
import { createEffect } from "solid-js";
import { render } from "@solidjs/web";

const asRecord = (value: Json | undefined): Record<string, Json> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  }
  return value as Record<string, Json>;
};

/**
 * Renders the flat menu button for `menu-button.qnt` (`createMenu` plain
 * variant). The walk config is the spec's fixed fixture — 4 items with item 3
 * (DOM index 2) disabled — and the ported scenarios render their own `items` /
 * `disabled`, both gated by `menuButtonConfig`. DOM focus is synced to the
 * primitive's focused part (`trigger` / `menuitem:N`), and the menu is a
 * `data-part="menu"` sibling of `data-part="trigger"`.
 *
 * The primitive's open state is uncontrolled, so `setValue` / `hostToggle`
 * (the spec's controlled-open writes) are inert here, matching the uncontrolled
 * spec model. The events map records `onOpenChange` / `onItemClick` for the
 * ported scenarios.
 */
export const mountMenuButton = (config: MenuButtonConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
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
      variant: "plain",
      triggerMode: "outside",
      disabled: config.disabled,
      suppressFocusWrite: () => suppressing,
      onOpenChange: (open) => {
        events.set("onOpenChange", [...(events.get("onOpenChange") ?? []), [open]]);
      },
      onItemClick: (index) => {
        events.set("onItemClick", [...(events.get("onItemClick") ?? []), [`menuitem:${index}`]]);
      },
    });
    api = menu;
    createEffect(
      () => [menu.focusLevel(), menu.focusIndex()] as const,
      ([level, index]) => {
        let target: HTMLElement | undefined;
        if (level === 1) {
          target = root.querySelector<HTMLElement>('[data-part="trigger"]') ?? undefined;
        } else if (level === 2) {
          target = items()[index];
        }
        if (target !== undefined) {
          const element = target;
          if (document.activeElement !== element) {
            // defer: user-event re-checks the focused element to fire Enter's
            // default click after the keydown; moving focus in a macrotask
            // keeps that click off the (clickable) trigger
            setTimeout(() => {
              if (document.activeElement !== element) {
                suppressing = true;
                element.focus();
                suppressing = false;
              }
            }, 0);
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
        case "setValue":
        case "hostToggle":
          // uncontrolled open: the spec's host writes are no-ops (see above)
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
