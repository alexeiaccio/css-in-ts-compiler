import { For, createEffect, createSignal } from "solid-js";
import {
  type RearrangeableList,
  type RearrangeableListbox,
  createRearrangeableListbox,
} from "../src/listbox-rearrangeable";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { RearrangeableConfig } from "@cssints/apg-specs/apg/listbox-rearrangeable.bridge";
import { render } from "@solidjs/web";

const isJsonObject = (value: Json): value is Readonly<Record<string, Json>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Two `role=listbox` containers (`data-part="listA"` / `"listB"`) holding
 * `role=option` children (`data-part="optionA"` / `"optionB"`) in slot order,
 * so the bridge's `optionA:N` is the DOM's N-th option of list A. DOM focus
 * follows `focusedList`.
 *
 * Controlled, the fixture is the host: the selection lives in a signal passed
 * as `value`, written back on every request when `accepts`.
 */
export const mountRearrangeableListbox = (config: RearrangeableConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal<ReadonlyArray<number>>([]);
  const writeHost = (next: ReadonlyArray<number>): void => {
    if (config.controlled) {
      setHost([...next]);
    }
  };
  let api: RearrangeableListbox | undefined;

  const listElement = (list: RearrangeableList): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-part="list${list.toUpperCase()}"]`);

  const dispose = render(() => {
    const listbox = createRearrangeableListbox({
      items: config.items,
      multi: config.multi,
      get value() {
        return config.controlled ? host() : undefined;
      },
      onValueChange: (selected) => {
        events.set("onValueChange", [...(events.get("onValueChange") ?? []), selected.map(String)]);
        if (config.accepts) {
          writeHost(selected);
        }
      },
    });
    api = listbox;
    createEffect(
      () => listbox.focusedList(),
      (list) => {
        if (list === null) {
          const current = document.activeElement;
          if (current instanceof HTMLElement && root.contains(current)) {
            current.blur();
          }
          return;
        }
        const element = listElement(list);
        if (element !== null && document.activeElement !== element) {
          element.focus();
        }
      },
    );
    const list = (which: RearrangeableList) => (
      <div data-part={`list${which.toUpperCase()}`} {...listbox.listProps(which)}>
        <For each={listbox.order(which)}>
          {(id) => (
            <div data-part={`option${which.toUpperCase()}`} {...listbox.optionProps(id)}>
              {config.items[id]}
            </div>
          )}
        </For>
      </div>
    );
    return (
      <div>
        {list("a")}
        {list("b")}
      </div>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focus(value === "b" ? "b" : "a");
          break;
        case "blur":
          api?.blur();
          break;
        case "key": {
          const record = value === undefined ? null : value;
          if (record === null || !isJsonObject(record)) {
            throw new Error(`key needs an object, got ${JSON.stringify(value)}`);
          }
          const key = record["key"];
          if (typeof key !== "string") {
            throw new Error(`key needs a string key, got ${JSON.stringify(value)}`);
          }
          api?.keyDown(key, { alt: record["alt"] === true });
          break;
        }
        case "move":
          api?.move(value === "up" ? "up" : "down");
          break;
        case "transfer":
          api?.transfer();
          break;
        case "multi":
        case "set_multi":
          api?.setMulti(value === true);
          break;
        case "setValue":
        case "value":
        case "selected":
          if (!Array.isArray(value)) {
            throw new Error(`setValue needs indices, got ${JSON.stringify(value)}`);
          }
          writeHost(value.map(Number));
          break;
        case "hostToggle":
          writeHost(host().includes(0) ? host().filter((index) => index !== 0) : [...host(), 0]);
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
