import { type Checkbox, type CheckboxState, createCheckbox } from "../src/checkbox";
import type { CheckboxConfig } from "@cssints/apg-specs/apg/checkbox.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const next = (state: CheckboxState): CheckboxState => (state === "true" ? "false" : "true");

/**
 * Renders `createCheckbox` as a focusable `role=checkbox` element and exposes
 * the `Mounted` the DOM driver needs. Controlled, the fixture is the host: it
 * keeps the value in a signal, passes it as `value`, and either writes every
 * request back (`accepts`) or ignores the callback.
 */
export const mountCheckbox = (config: CheckboxConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal<CheckboxState>(config.state);
  let api: Checkbox | undefined;

  const element = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('[data-part="checkbox"]');

  const writeHost = (state: CheckboxState): void => {
    if (config.controlled) {
      setHost(state);
    }
  };

  const dispose = render(() => {
    const checkbox = createCheckbox({
      defaultValue: config.state,
      get value() {
        return config.controlled ? host() : undefined;
      },
      allowMixed: config.allowMixed,
      disabled: config.disabled,
      readOnly: config.readOnly,
      onValueChange: (state) => {
        events.set("onChange", [...(events.get("onChange") ?? []), state === "true"]);
        if (config.accepts) {
          setHost(state);
        }
      },
    });
    api = checkbox;
    return (
      <div
        data-part="checkbox"
        {...checkbox.checkboxProps}
        onClick={(event) => {
          checkbox.checkboxProps.onClick();
          event.currentTarget.focus();
        }}
      >
        Checkbox
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
        case "allowMixed":
        case "indeterminate":
        case "isIndeterminate":
          api?.setAllowMixed(value === true);
          break;
        case "checked":
        case "isSelected":
          writeHost(value === true ? "true" : "false");
          break;
        case "hostToggle":
          writeHost(next(host()));
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
