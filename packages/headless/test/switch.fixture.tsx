import { type Switch, createSwitch } from "../src/switch";
import { type Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import type { SwitchConfig } from "@cssints/apg-specs/src/apg/switch.bridge";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createSwitch` as a focusable `role=switch` element and exposes the
 * `Mounted` the DOM driver needs. Controlled, the fixture is the host: it keeps
 * the value in a signal, passes it as `value`, and either writes every request
 * back (`accepts`) or ignores the callback. Uncontrolled, programmatic `prop`
 * steps seed the primitive.
 */
export const mountSwitch = (config: SwitchConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.checked);
  let api: Switch | undefined;

  const element = (): HTMLElement | null => root.querySelector<HTMLElement>('[data-part="switch"]');

  const writeHost = (next: boolean): void => {
    if (config.controlled) {
      setHost(next);
    }
  };

  const dispose = render(() => {
    const controller = createSwitch({
      defaultValue: config.checked,
      get value() {
        return config.controlled ? host() : undefined;
      },
      disabled: config.disabled,
      readOnly: config.readOnly,
      enterToggles: config.enterToggles,
      onValueChange: (checked) => {
        events.set("onChange", [...(events.get("onChange") ?? []), checked]);
        if (config.accepts) {
          setHost(checked);
        }
      },
    });
    api = controller;
    return (
      <div
        data-part="switch"
        {...controller.switchProps}
        onClick={(event) => {
          controller.switchProps.onClick();
          event.currentTarget.focus();
        }}
      >
        Switch
      </div>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "disabled":
        case "isDisabled":
          api?.setDisabled(value === true);
          break;
        case "checked":
        case "isSelected":
          writeHost(value === true);
          break;
        case "enterToggles":
          api?.setEnterToggles(value === true);
          break;
        case "hostToggle":
          writeHost(!host());
          break;
        case "focus":
          element()?.focus();
          break;
        case "blur":
          element()?.blur();
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
