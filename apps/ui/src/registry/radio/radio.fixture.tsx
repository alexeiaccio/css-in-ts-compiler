import { type RadioGroup as RadioGroupController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./radio-driver.ts";
import type { RadioConfig } from "@cssints/apg-specs/apg/radio.bridge";
import { RadioGroup } from "./radio.tsx";
import { createSignal } from "solid-js";
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
 * Mounts the styled radio group for the scenario walk. Controlled, the fixture is the host: it
 * keeps the checked value in a signal, passes it as `value`, and either writes every request back
 * (`accepts`) or ignores the callback. `onChange` records the library value (scenario payloads)
 * and `onChangeIndex` the checked index (the spec's vocabulary).
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
  let api: RadioGroupController<Json> | undefined;

  const groupElement = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('[data-part="radiogroup"]');
  const radioElement = (index: number): HTMLElement | null =>
    root.querySelectorAll<HTMLElement>('[data-part="radio"]')[index] ?? null;

  const focusActive = (): void => {
    const current = api?.focused() ?? null;
    if (current === null) {
      // the primitive dropped its focus state (a config remount): the host drops DOM focus too
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

  // Solid flushes signal writes on a microtask, so read the resulting focus state after the flush
  // (the DOM driver settles a macrotask after each step).
  const scheduleFocus = (): void => {
    queueMicrotask(focusActive);
  };

  const dispose = render(() => {
    return (
      <RadioGroup
        values={values}
        value={config.controlled ? (host() ?? undefined) : undefined}
        defaultValue={config.checked === null ? undefined : values[config.checked]}
        flavor={config.flavor}
        disabled={config.disabled}
        dir={config.direction}
        orientation={config.orientation}
        describedby={config.describedby}
        onReady={(controller) => {
          api = controller;
        }}
        onValueChange={(value) => {
          events.set("onChange", [...(events.get("onChange") ?? []), value]);
          events.set("onChangeIndex", [
            ...(events.get("onChangeIndex") ?? []),
            values.indexOf(value),
          ]);
          if (config.accepts) {
            setHost(value);
          }
        }}
        onFocus={(target) => {
          events.set("onFocus", [...(events.get("onFocus") ?? []), target]);
        }}
        onBlur={(target) => {
          events.set("onBlur", [...(events.get("onBlur") ?? []), target]);
        }}
      >
        {(_value, index) => String(index)}
      </RadioGroup>
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
          api?.keyDown(key);
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
