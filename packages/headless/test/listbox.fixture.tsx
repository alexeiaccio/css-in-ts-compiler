import { type Listbox, createListbox } from "../src/listbox";
import { createEffect, createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/scenario";
import type { ListboxMountConfig } from "@cssints/apg-specs/apg/listbox-shared";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

const isJsonObject = (value: Json): value is Readonly<Record<string, Json>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: Json | undefined): Readonly<Record<string, Json>> => {
  if (value === undefined || !isJsonObject(value)) {
    throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  }
  return value;
};

/**
 * Renders `createListbox` as a `role=listbox` container plus `role=option`
 * children (each option carries `data-part="option"`), and exposes the
 * `Mounted` the DOM driver needs. DOM focus is synced to the active option so
 * the driver's `focus` observation reads `option:N`.
 *
 * Controlled, the fixture is the host: it keeps the selection (or, in
 * `selectionMode: 'none'`, the active option) in a signal, passes it as
 * `value` / `activeValue`, and either writes every request back (`accepts`) or
 * ignores the callback.
 */
export const mountListbox = (config: ListboxMountConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const labels = config.items;
  // the type-ahead model's value is the active option, not the selection
  const activeMode = config.selectionMode === "none";
  const [host, setHost] = createSignal<ReadonlyArray<number>>(config.defaultSelected);
  const [activeHost, setActiveHost] = createSignal(config.defaultActive ?? 0);
  const writeHost = (next: ReadonlyArray<number>): void => {
    if (config.controlled && !activeMode) {
      setHost([...next]);
    }
  };
  const writeActive = (index: number): void => {
    if (config.controlled && activeMode) {
      setActiveHost(index);
    }
  };
  const append = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  let api: Listbox | undefined;

  const optionElements = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="option"]'),
  ];

  const dispose = render(() => {
    const listbox = createListbox({
      items: labels,
      selectionMode: config.selectionMode,
      followsFocus: config.followsFocus,
      defaultValue: config.defaultSelected,
      get value() {
        return config.controlled && !activeMode ? host() : undefined;
      },
      defaultActive: config.defaultActive ?? 0,
      get activeValue() {
        return config.controlled && activeMode ? activeHost() : undefined;
      },
      disabled: config.disabled,
      focusOnHover: config.focusOnHover,
      label: config.ariaLabel,
      onValueChange: (selected) => {
        // The ported scenarios encode `onSelectionChange` as the current
        // selection keys (not an invocation history), so replace each time;
        // the differential walk reads the append-only `onValueChange` history.
        const payload = selected.map((index) => labels[index] ?? "");
        events.set("onSelectionChange", payload);
        append("onValueChange", payload);
        if (config.accepts) {
          writeHost(selected);
        }
      },
      onActiveChange: (index) => {
        if (!activeMode) {
          return;
        }
        append("onActiveChange", String(index));
        if (config.accepts) {
          writeActive(index);
        }
      },
    });
    api = listbox;
    createEffect(
      () => [listbox.focused(), listbox.active()] as const,
      ([isFocused, index]) => {
        const element = optionElements()[index];
        if (isFocused && element !== undefined) {
          if (document.activeElement !== element) {
            element.focus();
          }
        } else if (!isFocused) {
          const current = document.activeElement;
          if (current instanceof HTMLElement && root.contains(current)) {
            current.blur();
          }
        }
      },
    );
    return (
      <div data-part="listbox" {...listbox.listboxProps}>
        {labels.map((label, index) => (
          <div data-part="option" {...listbox.optionProps(index)}>
            {label}
          </div>
        ))}
      </div>
    );
  }, root);

  if (config.autoFocus !== undefined && config.autoFocus !== false) {
    const index = api?.focus() ?? 0;
    optionElements()[index]?.focus();
  }

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focus();
          break;
        case "blur":
          api?.blur();
          break;
        case "key": {
          const record = asRecord(value);
          if (typeof record["key"] !== "string") {
            throw new Error(`key needs a string key, got ${JSON.stringify(value)}`);
          }
          api?.keyDown(record["key"], {
            shift: record["shift"] === true,
            ctrl: record["ctrl"] === true,
            meta: record["meta"] === true,
            alt: record["alt"] === true,
          });
          break;
        }
        case "type":
          api?.type(String(value));
          break;
        case "typeaheadTimeoutElapsed":
          api?.clearTypeahead();
          break;
        case "followsFocus":
        case "set_follows_focus":
          api?.setFollowsFocus(value === true);
          break;
        case "setValue":
        case "value":
        case "selected":
          if (Array.isArray(value)) {
            writeHost(value.map(Number));
          } else if (typeof value === "number" && Number.isInteger(value)) {
            writeActive(value);
          } else {
            throw new Error(`setValue needs indices, got ${JSON.stringify(value)}`);
          }
          break;
        case "hostToggle":
          if (activeMode) {
            writeActive((activeHost() + 1) % labels.length);
          } else {
            writeHost(host().includes(0) ? host().filter((index) => index !== 0) : [...host(), 0]);
          }
          break;
        case "selectionModel":
        case "set_selection_model":
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    focus: () => (api?.focused() === true ? `option:${api.active()}` : null),
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
