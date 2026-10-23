import {
  type CheckboxGroup,
  type CheckboxGroupFocus,
  createCheckboxGroup,
} from "../src/checkbox-group";
import type { CheckboxGroupConfig } from "@cssints/apg-specs/src/apg/checkbox-group.bridge";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const domLabel = (target: CheckboxGroupFocus): string =>
  target === "parent" ? "checkbox:parent" : `checkbox:${target.slice(1)}`;

/**
 * Renders `createCheckboxGroup` as an `role=group` fieldset with a controller
 * (`data-part="checkbox:parent"`) and three children (`data-part="checkbox:N"`).
 * Parts are addressed by their full labels, so this fixture is driven by
 * `partsDriver`. Controlled, the fixture is the host: it keeps the checked set
 * in a signal, passes it as `value`, and either writes every request back
 * (`accepts`) or ignores it.
 */
export const mountCheckboxGroup = (config: CheckboxGroupConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const values: ReadonlyArray<Json> = config.values;
  const labelsFor = (children: ReadonlyArray<boolean>): ReadonlyArray<Json> =>
    children.flatMap((checked, index) => {
      const value = values[index];
      return checked && value !== undefined ? [value] : [];
    });
  const bitsFor = (value: Json | undefined): ReadonlyArray<boolean> => {
    if (typeof value === "boolean") {
      return [value, false, false];
    }
    if (typeof value === "number") {
      return [0, 1, 2].map((index) => Math.floor(value / 2 ** index) % 2 === 1);
    }
    if (Array.isArray(value)) {
      return [0, 1, 2].map((index) => value[index] === true);
    }
    throw new Error(`setValue needs a value, got ${JSON.stringify(value)}`);
  };
  const [host, setHost] = createSignal<ReadonlyArray<boolean>>(config.children);
  let api: CheckboxGroup<Json> | undefined;

  const elementOf = (target: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-part="${target}"]`);

  const focusTarget = (target: CheckboxGroupFocus): void => {
    if (target === "none") {
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active)) {
        active.blur();
      }
      return;
    }
    elementOf(domLabel(target))?.focus();
  };

  // Solid flushes signal writes on a microtask; read focus after the flush.
  const scheduleFocus = (): void => {
    queueMicrotask(() => {
      focusTarget(api?.focused() ?? "none");
    });
  };

  const dispose = render(() => {
    const group = createCheckboxGroup<Json>({
      values,
      get value() {
        return config.controlled ? labelsFor(host()) : undefined;
      },
      defaultValue: labelsFor(config.children),
      parent: config.parent,
      remember: config.remember,
      onValueChange: (checked) => {
        events.set("onValueChange", [checked]);
        if (config.accepts) {
          setHost(values.map((value) => checked.includes(value)));
        }
      },
    });
    api = group;
    return (
      <div data-part="group" role="group" onKeyDown={group.groupProps.onKeyDown}>
        <div
          data-part="checkbox:parent"
          {...group.parentProps}
          onClick={(event) => {
            group.parentProps.onClick();
            event.currentTarget.focus();
          }}
        />
        {([0, 1, 2] as const).map((index) => (
          <div
            data-part={`checkbox:${index}`}
            {...group.childProps(index)}
            onClick={(event) => {
              group.childProps(index).onClick();
              event.currentTarget.focus();
            }}
          />
        ))}
      </div>
    );
  }, root);

  return {
    root,
    events,
    value: () => api?.checkedValues() ?? [],
    setProp: (name, value) => {
      switch (name) {
        case "focus": {
          if (typeof value !== "string") {
            throw new Error(`focus needs a target, got ${JSON.stringify(value)}`);
          }
          api?.focusOn(value as CheckboxGroupFocus);
          scheduleFocus();
          break;
        }
        case "blur":
          api?.blur();
          focusTarget("none");
          break;
        case "key": {
          const key =
            typeof value === "object" && value !== null && !Array.isArray(value)
              ? (value as Readonly<Record<string, Json>>)["key"]
              : undefined;
          if (key === "Tab") {
            api?.keyTab();
          } else if (key === " " || key === "Space") {
            api?.keySpace();
          } else {
            throw new Error(`unsupported key ${JSON.stringify(key)}`);
          }
          scheduleFocus();
          break;
        }
        case "click": {
          if (typeof value !== "string") {
            throw new Error(`click needs a target, got ${JSON.stringify(value)}`);
          }
          api?.click(value as CheckboxGroupFocus);
          scheduleFocus();
          break;
        }
        case "remember":
          api?.setRemember(value === true);
          break;
        case "setValue":
          setHost(bitsFor(value));
          break;
        case "hostToggle":
          setHost(host().map((checked, index) => (index === 0 ? !checked : checked)));
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
