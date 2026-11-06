import type { Json } from "@cssints/apg-specs/scenario";
import type { ListboxMountConfig } from "@cssints/apg-specs/apg/listbox-shared";
import type { Listbox as ListboxController } from "@cssints/headless";
import type { Mounted } from "./listbox-driver.ts";
import { Listbox } from "./listbox.tsx";
import { createSignal } from "solid-js";
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
 * The walk's `key` steps are programmatic (`prop` steps), so they become a real
 * keydown on the focused row: the platform moves focus along the block axis, the
 * primitive prevents the keys it owns. The walk alphabet spells arrows short.
 */
const dispatchKey = (target: HTMLElement, value: Json | undefined): void => {
  const record = asRecord(value);
  const key = record["key"];
  if (typeof key !== "string") {
    throw new Error(`key needs a string key, got ${JSON.stringify(value)}`);
  }
  const named = ["Left", "Right", "Up", "Down"].includes(key) ? `Arrow${key}` : key;
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: named === "Space" ? " " : named,
      shiftKey: record["shift"] === true,
      ctrlKey: record["ctrl"] === true,
      metaKey: record["meta"] === true,
      altKey: record["alt"] === true,
      bubbles: true,
      cancelable: true,
    }),
  );
};

/**
 * Mounts the styled listbox for the scenario walk: the same props the primitive's fixture passes, the primitive it built
 * through `onReady`, and the `Mounted` the DOM driver needs. The skin's rows are `listbox-option` parts; the test translates
 * the scenario's `option` targets to them.
 *
 * The walk drives the polyfill provider: its `key` steps are untrusted keydowns, which a native engine ignores.
 *
 * Controlled, the fixture is the host: it keeps the selection (or, in `selectionMode: 'none'`, the active option) in a
 * signal, passes it as `value` / `activeValue`, and either writes every request back (`accepts`) or ignores the callback.
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
  let api: ListboxController | undefined;

  const optionElements = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="listbox-option"]'),
  ];

  const dispose = render(
    () => (
      <Listbox
        items={labels}
        selectionMode={config.selectionMode}
        followsFocus={config.followsFocus}
        defaultValue={config.defaultSelected}
        value={config.controlled && !activeMode ? host() : undefined}
        activeValue={config.controlled && activeMode ? activeHost() : undefined}
        disabled={config.disabled}
        focusOnHover={config.focusOnHover}
        label={config.ariaLabel}
        provider="polyfill"
        onReady={(listbox) => {
          api = listbox;
        }}
        onValueChange={(selected) => {
          // The ported scenarios encode `onSelectionChange` as the current
          // selection keys (not an invocation history), so replace each time;
          // the differential walk reads the append-only `onValueChange` history.
          const payload = selected.map((index) => labels[index] ?? "");
          events.set("onSelectionChange", payload);
          append("onValueChange", payload);
          if (config.accepts) {
            writeHost(selected);
          }
        }}
        onActiveChange={(index) => {
          if (!activeMode) {
            return;
          }
          append("onActiveChange", String(index));
          if (config.accepts) {
            writeActive(index);
          }
        }}
      />
    ),
    root,
  );

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
          // a real keydown on the focused row: the platform moves the active
          // option, the primitive's own listener runs its keys; a key step with
          // focus outside the list is the model's no-op
          const index = api?.focused() === true ? (api?.active() ?? -1) : -1;
          const target = index >= 0 ? optionElements()[index] : undefined;
          if (target !== undefined) {
            dispatchKey(target, value);
          }
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
