import type { MenuButtonConfig } from "@cssints/apg-specs/apg/menu-button.bridge";
import type { MenuCheckableConfig } from "@cssints/apg-specs/apg/menu-checkable.bridge";
import { type Menu as MenuController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { PartProps } from "../render.tsx";
import type { Mounted } from "./menu-driver.ts";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

/**
 * Solid 2's `userEvent` fires Enter's default click after the keydown, and re-checks the focused element to
 * find it. The kit closes the menu and returns the focus to the trigger in the same flush, so that click lands
 * on the trigger and reopens the menu; a real browser keeps the click on the row it was pressed on. This
 * swallows only that synthesized click (bean 209r in `packages/headless`), not a reader's.
 */
const guardEnterOnItem = (root: HTMLElement): (() => void) => {
  let fromItem = false;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter") {
      return;
    }
    const target = event.target;
    fromItem = target instanceof HTMLElement && target.dataset["part"] === "menuitem";
    if (fromItem) {
      setTimeout(() => {
        fromItem = false;
      }, 0);
    }
  };
  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (fromItem && target instanceof HTMLElement && target.dataset["part"] === "trigger") {
      event.preventDefault();
      event.stopPropagation();
      fromItem = false;
    }
  };
  root.addEventListener("keydown", onKeyDown, true);
  root.addEventListener("click", onClick, true);
  return () => {
    root.removeEventListener("keydown", onKeyDown, true);
    root.removeEventListener("click", onClick, true);
  };
};

const asRecord = (value: Json | undefined): Record<string, Json> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  }
  return value as Record<string, Json>;
};

/**
 * The kit's trigger and rows are named for the skin (`button`, `menu-item`); the shared DOM driver finds a
 * part by the spec's name, so the conformance fixture renames them through the components' own `render`
 * props. The trigger stays the kit's `Button` (its class and behaviour), with `data-part="trigger"` on the
 * element it renders.
 */
const triggerRender = (part: PartProps): JSX.Element => (
  <button {...part} data-part="trigger" type="button">
    Menu
  </button>
);

/** The rows and the list, rendered inside the `Menu` so they are inside its context. */
const contentRender =
  (labels: ReadonlyArray<string>) =>
  (part: PartProps): JSX.Element =>
    (
      // `tabindex="-1"`: the spec drives some keys at the menu container, which a scenario focuses; a
      // menu is focusable in the APG pattern (the kit itself leaves DOM focus on the rows, which the
      // fixture renames).
      <div {...part} tabindex={-1} data-part="menu">
        {labels.map((label, index) => (
          <MenuItem
            index={index}
            render={(row) => (
              <div {...row} data-part="menuitem">
                {label}
              </div>
            )}
          />
        ))}
      </div>
    );

/** The spec's packed `checked(wrap, choice)` as the kit's readable pair. */
const readable = (packed: number): { checked: ReadonlyArray<number>; radio: number } => ({
  checked: packed >= 5 ? [0] : [],
  radio: packed % 5 === 0 ? -1 : (packed % 5) - 1,
});

/**
 * Renders the checkable menu (`menu-checkable.qnt`) through the kit's `Menu`: the `mixed` variant gives item 1
 * a `menuitemcheckbox`, items 2-4 one `menuitemradio` group and item 5 a plain `menuitem`. DOM focus is the
 * primitive's (the kit moves it too, but the fixture may rename the rows the kit looks for, so the walk reads
 * the primitive's own level). Controlled, the fixture is the host: it keeps the packed value in a signal and
 * either writes every request back (`accepts`) or ignores it.
 */
export const mountCheckableMenu = (config: MenuCheckableConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const [host, setHost] = createSignal(config.value);
  let api: MenuController | undefined;
  // the primitive reports the readable pair; the ported scenarios assert the primitive's own item callbacks, so
  // the fixture derives them from the pair (a checkbox's change is the index whose bit moved)
  let previous = readable(config.value);

  const dispose = render(() => {
    return (
      <Menu
        items={config.items}
        variant={config.variant}
        disabled={config.disabled}
        value={config.controlled ? readable(host()) : undefined}
        onReady={(menu) => {
          api = menu;
        }}
        onOpenChange={(open) => {
          push("onOpenChange", open);
        }}
        onItemClick={(index) => {
          push("onItemClick", `menuitem:${index}`);
        }}
        onValueChange={(next) => {
          const before = new Set(previous.checked);
          const after = new Set(next.checked);
          const added = next.checked.find((index) => !before.has(index));
          const removed = previous.checked.find((index) => !after.has(index));
          const toggled = added ?? removed;
          if (toggled !== undefined) {
            // the ported checkable scenarios assert the latest checked value
            events.set("onCheckedChange", [added !== undefined]);
          }
          if ((next.radio ?? -1) !== previous.radio && (next.radio ?? -1) >= 0) {
            events.set("onValueChange", [(next.radio ?? -1) + 1]);
          }
          previous = { checked: [...next.checked], radio: next.radio ?? -1 };
          if (config.accepts) {
            const packed =
              (next.checked.includes(0) ? 5 : 0) +
              ((next.radio ?? -1) < 0 ? 0 : (next.radio ?? 0) + 1);
            setHost(packed);
          }
        }}
      >
        <MenuTrigger render={triggerRender} />
        <MenuContent render={contentRender(config.items)} />
      </Menu>
    );
  }, root);

  // `triggerMode: "held"`: a checkable menu's trigger holds focus while closed, which is the closed
  // level the spec's `focus` observation names. Written after `render`, outside the component's owner.
  api?.focusTrigger();
  const unguard = guardEnterOnItem(root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focusTrigger();
          break;
        case "key": {
          const record = asRecord(value);
          if (typeof record["key"] !== "string") {
            throw new Error(`key needs a string, got ${JSON.stringify(value)}`);
          }
          api?.keyDown(record["key"]);
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
      unguard();
      dispose();
      root.remove();
    },
  };
};

/**
 * Renders the flat menu button (`menu-button.qnt`) through the kit's `Menu`: one trigger, a four-item list, and
 * the third item (DOM index 2) disabled, which is the spec's fixed fixture. Controlled, the fixture is the host:
 * it keeps the open state in a signal, passes it as `open`, and either writes every request back (`accepts`) or
 * ignores it.
 */
export const mountMenuButton = (config: MenuButtonConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const [host, setHost] = createSignal(config.value);
  let api: MenuController | undefined;

  const dispose = render(() => {
    return (
      <Menu
        items={config.items}
        variant="plain"
        disabled={config.disabled}
        open={config.controlled ? host() : undefined}
        onReady={(menu) => {
          api = menu;
        }}
        onOpenChange={(open) => {
          push("onOpenChange", [open]);
          if (config.controlled && config.accepts) {
            setHost(open);
          }
        }}
        onItemClick={(index) => {
          push("onItemClick", [`menuitem:${index}`]);
        }}
      >
        <MenuTrigger render={triggerRender} />
        <MenuContent render={contentRender(config.items)} />
      </Menu>
    );
  }, root);

  const unguard = guardEnterOnItem(root);

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
          const record = asRecord(value);
          if (typeof record["key"] !== "string") {
            throw new Error(`key needs a string, got ${JSON.stringify(value)}`);
          }
          api?.keyDown(record["key"]);
          break;
        }
        case "typeahead":
          api?.typeaheadCode(Number(value));
          break;
        case "type":
          api?.type(String(value));
          break;
        case "setValue":
          if (typeof value !== "boolean") {
            throw new Error(`setValue needs a boolean, got ${JSON.stringify(value)}`);
          }
          setHost(value);
          break;
        case "hostToggle":
          setHost((open) => !open);
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
      unguard();
      dispose();
      root.remove();
    },
  };
};
