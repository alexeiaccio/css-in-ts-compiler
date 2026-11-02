import type { ButtonConfig } from "@cssints/apg-specs/apg/button.bridge";
import type { Button as ButtonController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./button-driver.ts";
import { Button, type ButtonProps } from "./button.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/** The styled button, plus the primitive the kit built: a look test reads its pressed state. */
export interface ButtonMounted extends Mounted {
  readonly button: ButtonController;
}

/** The look the walk does not vary: `tone`, `size` and the element `render` puts in the part's place. */
export interface ButtonLook {
  readonly tone?: ButtonProps["tone"];
  readonly size?: ButtonProps["size"];
  readonly render?: ButtonProps["render"];
}

/**
 * Mounts the styled button for the scenario walk. It records what the ported scenarios read (`onClick`
 * as a running count, `onPress`/`onClickCapture` as the count, `onValueChange` as the toggled value)
 * and hands the primitive to `onReady`. Controlled, the fixture is the host: it keeps the pressed
 * value in a signal, passes it as `value`, and either writes every request back (`accepts`) or
 * ignores the callback.
 *
 * @param {ButtonConfig} config the state the walk starts from and the host's policy
 * @param {ButtonLook} look the tone, the size and `render`: the skin's own, which the walk leaves alone
 * @returns {ButtonMounted} the mounted button and the driver's view of it
 */
export const mountButton = (config: ButtonConfig, look: ButtonLook = {}): ButtonMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [isToggle, setIsToggle] = createSignal(config.toggle);
  const [disabled, setDisabled] = createSignal(config.disabled);
  const [host, setHost] = createSignal(config.pressed);
  let api: ButtonController | undefined;
  let activations = 0;

  const writeHost = (next: boolean): void => {
    if (config.controlled) {
      setHost(next);
    }
  };

  const dispose = render(
    () => (
      <Button
        {...(look.tone === undefined ? {} : { tone: look.tone })}
        {...(look.size === undefined ? {} : { size: look.size })}
        render={look.render}
        isToggle={isToggle()}
        defaultValue={config.pressed}
        value={config.controlled ? host() : undefined}
        disabled={disabled()}
        onClick={() => {
          activations += 1;
          events.set("onClick", [activations]);
          events.set("onPress", [activations]);
          events.set("onClickCapture", [activations]);
        }}
        onValueChange={(value) => {
          events.set("onPressedChange", [...(events.get("onPressedChange") ?? []), value]);
          if (config.accepts) {
            setHost(value);
          }
        }}
        onReady={(button) => {
          api = button;
        }}
      >
        Button
      </Button>
    ),
    root,
  );

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
    get button(): ButtonController {
      if (api === undefined) {
        throw new Error("button fixture is not mounted");
      }
      return api;
    },
  };
};
