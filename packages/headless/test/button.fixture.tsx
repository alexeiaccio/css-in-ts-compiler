import type { ButtonConfig } from "@cssints/apg-specs/apg/button.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { createButton } from "../src/button";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createButton` as a native `<button>` and records the activation
 * callbacks the ported scenarios read (`onClick` as a running count, `onPress`/
 * `onClickCapture` as the count, `onPressedChange` as the toggled value).
 * Controlled, the fixture is the host: it keeps the pressed value in a signal,
 * passes it as `value`, and either writes every request back (`accepts`) or
 * ignores the callback.
 */
export const mountButton = (config: ButtonConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [isToggle, setIsToggle] = createSignal(config.toggle);
  const [disabled, setDisabled] = createSignal(config.disabled);
  const [host, setHost] = createSignal(config.pressed);
  let activations = 0;

  const writeHost = (next: boolean): void => {
    if (config.controlled) {
      setHost(next);
    }
  };

  const dispose = render(() => {
    const button = createButton({
      get isToggle() {
        return isToggle();
      },
      defaultValue: config.pressed,
      get value() {
        return config.controlled ? host() : undefined;
      },
      get disabled() {
        return disabled();
      },
      onClick: () => {
        activations += 1;
        events.set("onClick", [activations]);
        events.set("onPress", [activations]);
        events.set("onClickCapture", [activations]);
      },
      onValueChange: (value) => {
        events.set("onPressedChange", [...(events.get("onPressedChange") ?? []), value]);
        if (config.accepts) {
          setHost(value);
        }
      },
    });
    return (
      <button data-part="button" {...button.buttonProps}>
        Button
      </button>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "disabled":
        case "isDisabled":
          setDisabled(value === true);
          break;
        case "toggle":
        case "isToggle":
          setIsToggle(value === true);
          break;
        case "pressed":
        case "isSelected":
        case "value":
          writeHost(value === true);
          break;
        case "hostToggle":
          writeHost(!host());
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
