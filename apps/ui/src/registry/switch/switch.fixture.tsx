import { type Switch } from "@cssints/headless";
import { type Json } from "@cssints/apg-specs/scenario";
import { type SwitchConfig } from "@cssints/apg-specs/apg/switch.bridge";
import { type Mounted } from "./dom-driver";
import { Switch as StyledSwitch } from "./switch.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Mounts the styled switch for the scenario walk and exposes what the driver needs:
 * the element with `data-part="switch"`, the callback payloads, and a way to push a
 * programmatic change. Controlled, the fixture plays the host: it keeps the value in a
 * signal and either writes every request back (`accepts`) or ignores it.
 *
 * @param {SwitchConfig} config the state the walk starts from and the host's policy
 * @returns {Mounted} the mounted element and the driver's view of it
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
    return (
      <StyledSwitch
        defaultValue={config.checked}
        value={config.controlled ? host() : undefined}
        disabled={config.disabled}
        readOnly={config.readOnly}
        enterToggles={config.enterToggles}
        onReady={(controller) => {
          api = controller;
        }}
        onValueChange={(checked) => {
          events.set("onChange", [...(events.get("onChange") ?? []), checked]);
          if (config.accepts) {
            setHost(checked);
          }
        }}
      />
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
