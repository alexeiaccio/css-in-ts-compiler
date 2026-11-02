import {
  type CheckboxGroup as CheckboxGroupController,
  type CheckboxGroupFocus,
} from "@cssints/headless";
import type { CheckboxGroupConfig } from "@cssints/apg-specs/apg/checkbox-group.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./checkbox-group-driver.ts";
import { CheckboxGroup as StyledCheckboxGroup } from "./checkbox-group.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const domLabel = (target: CheckboxGroupFocus): string =>
  target === "parent" ? "checkbox:parent" : `checkbox:${target.slice(1)}`;

/**
 * Mounts the styled checkbox group for the scenario walk. The group is the skin's
 * `data-part="checkbox-group"`, the controller and the three children are the kit's
 * `Checkbox` (`data-part="checkbox"`, in DOM order: the parent first). The spec's parent arm
 * exists in every configuration, so the fixture keeps the parent box mounted even when the
 * scenario's `parent` is false; that config only sets the starting "remember" value.
 *
 * Controlled, the fixture is the host: it keeps the checked set in a signal, passes it as
 * `value`, and either writes every request back (`accepts`) or ignores it.
 */
export const mountCheckboxGroup = (config: CheckboxGroupConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const values: readonly [Json, Json, Json] = config.values as readonly [Json, Json, Json];
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
  let api: CheckboxGroupController<Json> | undefined;

  const focusTarget = (target: CheckboxGroupFocus): void => {
    if (target === "none") {
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active)) {
        active.blur();
      }
      return;
    }
    // the bridge names the parent `checkbox:parent`; the skin's four boxes are one part, in order
    const index = target === "parent" ? 0 : Number(target.slice(1)) + 1;
    [...root.querySelectorAll<HTMLElement>('[data-part="checkbox"]')][index]?.focus();
  };

  // Solid flushes signal writes on a microtask; read focus after the flush.
  const scheduleFocus = (): void => {
    queueMicrotask(() => {
      focusTarget(api?.focused() ?? "none");
    });
  };

  const dispose = render(() => {
    return (
      <StyledCheckboxGroup
        label="Channels"
        values={values}
        parent
        value={config.controlled ? labelsFor(host()) : undefined}
        defaultValue={labelsFor(config.children)}
        remember={config.remember}
        onReady={(group) => {
          api = group;
        }}
        onValueChange={(checked) => {
          events.set("onValueChange", [checked]);
          if (config.accepts) {
            setHost(values.map((value) => checked.includes(value)));
          }
        }}
      >
        {(value) => String(value)}
      </StyledCheckboxGroup>
    );
  }, root);

  return {
    root,
    events,
    value: () => api?.checkedValues() ?? [],
    focus: () => {
      const focus = api?.focused() ?? "none";
      return focus === "none" ? null : domLabel(focus);
    },
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
