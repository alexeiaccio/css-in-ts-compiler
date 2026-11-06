import { type RadioGroup, createRadioGroup } from "../src/radio";
import { type Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { RadioConfig } from "@cssints/apg-specs/apg/radio.bridge";
import { createSignal, flush } from "solid-js";
import { render } from "@solidjs/web";

const maskToIndices = (mask: number): ReadonlyArray<number> => {
  const indices: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    if (((mask >> index) & 1) === 1) {
      indices.push(index);
    }
  }
  return indices;
};

/**
 * The walk's `key` steps are programmatic (`prop` steps), so they become a real
 * keydown on the radio the primitive has focused: the platform moves focus and
 * the primitive checks what it landed on. The walk alphabet spells arrows short.
 */
const dispatchKey = (target: HTMLElement, key: string): void => {
  const named = ["Left", "Right", "Up", "Down"].includes(key) ? `Arrow${key}` : key;
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: named === "Space" ? " " : named,
      bubbles: true,
      cancelable: true,
    }),
  );
};

/**
 * Renders `createRadioGroup` as a `role=radiogroup` plus `role=radio` children
 * (each `data-part="radio"`), and exposes the `Mounted` the DOM driver needs.
 * The primitive syncs its focus signal from real DOM focus, so the driver's
 * `key`/`focus` steps line up with the spec's `focus`.
 *
 * Controlled, the fixture is the host: it keeps the checked value in a signal,
 * passes it as `value`, and either writes every request back (`accepts`) or
 * ignores the callback. `onChange` records the library value (scenario
 * payloads) and `onChangeIndex` the checked index (the spec's vocabulary).
 */
export const mountRadio = (config: RadioConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const values = config.values;
  const initialIndex = config.pinned ?? config.checked;
  const [host, setHost] = createSignal<Json>(
    initialIndex === null ? null : (values[initialIndex] ?? null),
  );
  const writeHost = (value: Json | undefined): void => {
    if (config.controlled) {
      setHost(value ?? null);
    }
  };
  let api: RadioGroup<Json> | undefined;

  const groupElement = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('[data-part="radiogroup"]');
  const radioElements = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="radio"]'),
  ];
  const radioElement = (index: number): HTMLElement | null => radioElements()[index] ?? null;

  const focusActive = (): void => {
    const current = api?.focused() ?? null;
    if (current === null) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active)) {
        active.blur();
      }
      return;
    }
    if (api?.flavor() === "activedescendant") {
      groupElement()?.focus();
    } else {
      radioElement(current)?.focus();
    }
  };

  // Solid 2 commits signal writes on a flush, so read the resulting focus
  // state after the commit (the DOM driver settles a macrotask after each step).
  const scheduleFocus = (): void => {
    queueMicrotask(() => {
      flush();
      focusActive();
    });
  };

  const dispose = render(() => {
    const group = createRadioGroup<Json>({
      values,
      get value() {
        return config.controlled ? (host() ?? undefined) : undefined;
      },
      defaultValue: config.checked === null ? undefined : values[config.checked],
      flavor: config.flavor,
      disabled: config.disabled,
      dir: config.direction,
      id: "radio",
      // the walk dispatches its keys as untrusted events and probes the rendered
      // `tabindex`: native focusgroup ignores untrusted keydown and writes no
      // tabindex, the polyfill does both. The adapter test covers the native path.
      provider: "polyfill",
      ...(config.orientation === undefined ? {} : { orientation: config.orientation }),
      ...(config.describedby === undefined ? {} : { describedby: config.describedby }),
      onValueChange: (value) => {
        events.set("onChange", [...(events.get("onChange") ?? []), value]);
        events.set("onChangeIndex", [
          ...(events.get("onChangeIndex") ?? []),
          values.indexOf(value),
        ]);
        if (config.accepts) {
          setHost(value);
        }
      },
      onFocus: (target) => {
        events.set("onFocus", [...(events.get("onFocus") ?? []), target]);
      },
      onBlur: (target) => {
        events.set("onBlur", [...(events.get("onBlur") ?? []), target]);
      },
    });
    api = group;
    return (
      <div
        data-part="radiogroup"
        {...group.radiogroupProps}
        onKeyDown={(event) => {
          group.radiogroupProps.onKeyDown(event);
          scheduleFocus();
        }}
      >
        {values.map((_value, index) => (
          <div data-part="radio" {...group.radioProps(index)}>
            {String(index)}
          </div>
        ))}
      </div>
    );
  }, root);

  return {
    root,
    events,
    value: () => api?.value() ?? null,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focus();
          scheduleFocus();
          break;
        case "blur":
          api?.blur();
          scheduleFocus();
          break;
        case "key": {
          const key =
            typeof value === "object" && value !== null && !Array.isArray(value)
              ? (value as Readonly<Record<string, Json>>)["key"]
              : undefined;
          if (typeof key !== "string") {
            throw new Error(`key needs a string key, got ${JSON.stringify(value)}`);
          }
          // activedescendant keeps DOM focus on the group, roving on the radio
          const target =
            api?.flavor() === "activedescendant"
              ? groupElement()
              : radioElement(api?.focused() ?? -1);
          if (target !== null) {
            dispatchKey(target, key);
          }
          scheduleFocus();
          break;
        }
        case "click": {
          if (typeof value !== "number" || !Number.isInteger(value)) {
            throw new Error(`click needs an index, got ${JSON.stringify(value)}`);
          }
          api?.click(value);
          scheduleFocus();
          break;
        }
        case "preselect":
          api?.setPreselect(typeof value === "number" ? value : null);
          scheduleFocus();
          break;
        case "disabled":
          api?.setDisabled(typeof value === "number" ? maskToIndices(value) : []);
          scheduleFocus();
          break;
        case "flavor":
          if (value === "roving" || value === "activedescendant") {
            api?.setFlavor(value);
          }
          scheduleFocus();
          break;
        case "setValue":
          writeHost(typeof value === "number" ? values[value] : undefined);
          scheduleFocus();
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
