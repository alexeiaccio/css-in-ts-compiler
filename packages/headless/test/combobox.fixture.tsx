import { type Combobox, type ComboboxAutoComplete, createCombobox } from "../src/combobox";
import { For, createSignal } from "solid-js";
import type { ComboboxSelectOnlyConfig } from "@cssints/apg-specs/src/apg/combobox-select-only.bridge";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

export interface ComboboxFixtureConfig extends ComboboxSelectOnlyConfig {
  readonly autoComplete?: ComboboxAutoComplete;
  readonly filter?: boolean;
}

/**
 * Renders `createCombobox` as an input (the combobox) + an open button + a
 * listbox popup and exposes the `Mounted` the DOM driver needs.
 *
 * Controlled, the fixture is the host: it keeps the selection and the open state
 * in signals, passes them as `value` / `open`, and either writes every request
 * back (`accepts`) or ignores the callbacks. `setValue` / `setOpen` / `hostToggle`
 * prop steps are the host writing its own copy directly (as a controlled page
 * would), so they apply regardless of `accepts`.
 */
export const mountCombobox = (config: ComboboxFixtureConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const initialIndex = config.pinned ?? config.selected;
  const initial = initialIndex === null ? null : (config.items[initialIndex] ?? null);
  const [hostValue, setHostValue] = createSignal<string | null>(initial);
  const [hostOpen, setHostOpen] = createSignal(config.open);
  let api: Combobox | undefined;

  const dispose = render(() => {
    const combobox = createCombobox({
      options: config.items,
      get value() {
        return config.controlled ? hostValue() : undefined;
      },
      get open() {
        return config.controlled ? hostOpen() : undefined;
      },
      defaultSelectedValue: initial,
      defaultOpen: config.open,
      autoComplete: config.autoComplete ?? "list",
      filter: config.filter ?? false,
      onOpenChange: (open) => {
        push("onOpenChange", open);
        if (config.accepts) {
          setHostOpen(open);
        }
      },
      onValueChange: (value) => {
        push("onValueChange", value ?? "");
        if (config.accepts) {
          setHostValue(value);
        }
      },
      onFocusRelease: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      },
    });
    api = combobox;
    return (
      <div>
        <input data-part="input" {...combobox.comboboxProps} />
        <button data-part="trigger" {...combobox.triggerProps}>
          {combobox.value() ?? ""}
        </button>
        <ul data-part="popup" {...combobox.listboxProps}>
          <For each={combobox.options()}>
            {(option) => (
              <li data-part="option" {...option.props}>
                {option.label}
              </li>
            )}
          </For>
        </ul>
      </div>
    );
  }, root);

  if (config.autoFocus) {
    root.querySelector<HTMLElement>('[data-part="trigger"]')?.focus();
  }

  return {
    root,
    events,
    value: () => api?.value() ?? "",
    setProp: (name, value) => {
      switch (name) {
        case "setValue": {
          // the host writes its own value; uncontrolled the API is a request
          const index = typeof value === "number" ? value : -1;
          const next = index >= 0 ? (config.items[index] ?? null) : null;
          if (config.controlled) {
            setHostValue(next);
          } else {
            api?.setValue(next);
          }
          break;
        }
        case "setOpen":
          // `setOpen` is a controlled-host commit; uncontrolled it is inert
          if (config.controlled) {
            setHostOpen(value === true);
          }
          break;
        case "hostToggle":
          if (config.controlled) {
            setHostOpen((open) => !open);
          }
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
