import { type Spinbutton, createSpinbutton } from "../src/spinbutton";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import type { SpinbuttonConfig } from "@cssints/apg-specs/src/apg/spinbutton.bridge";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createSpinbutton` as a group around a `role=spinbutton` text field
 * and two stepper buttons, and exposes the `Mounted` the DOM driver needs. The
 * steppers are non-focusable (`role=button`, tabindex -1): a click keeps focus
 * on the field (or moves it there), matching the spec, and `onMouseDown` is
 * prevented so the browser does not steal focus. Controlled, the fixture is the
 * host: it keeps the committed value in a signal, passes it as `value`, and
 * either writes every request back (`accepts`) or ignores the callback.
 */
export const mountSpinbutton = (config: SpinbuttonConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const [host, setHost] = createSignal(config.value);
  const writeHost = (next: number): void => {
    if (config.controlled) {
      setHost(next);
    }
  };
  let api: Spinbutton | undefined;

  const dispose = render(() => {
    const spin = createSpinbutton({
      min: config.min,
      max: config.max,
      step: config.step,
      largeStep: config.largeStep,
      defaultValue: config.value,
      get value() {
        return config.controlled ? host() : undefined;
      },
      wrap: config.wrap,
      onValueChange: (value) => {
        push("onValueChange", value);
        if (config.accepts) {
          setHost(value);
        }
      },
    });
    api = spin;
    const focusInput = (): void => {
      root.querySelector<HTMLInputElement>('[data-part="input"]')?.focus();
    };
    return (
      <div data-part="group" role="group">
        <input data-part="input" {...spin.inputProps} />
        <div
          data-part="increment"
          {...spin.incrementProps}
          onClick={() => {
            spin.incrementProps.onClick();
            focusInput();
          }}
        >
          +
        </div>
        <div
          data-part="decrement"
          {...spin.decrementProps}
          onClick={() => {
            spin.decrementProps.onClick();
            focusInput();
          }}
        >
          &minus;
        </div>
      </div>
    );
  }, root);

  const input = (): HTMLInputElement | null =>
    root.querySelector<HTMLInputElement>('[data-part="input"]');

  return {
    root,
    events,
    value: () => ({ input: api?.displayed() ?? "" }),
    setProp: (name, value) => {
      switch (name) {
        case "type":
          api?.typeInput(String(value));
          break;
        case "wrap":
          api?.setWrap(value === true);
          break;
        case "setValue":
          writeHost(Number(value));
          break;
        case "hostToggle":
          writeHost(host() === config.max ? config.min : config.max);
          break;
        case "focus":
          api?.focus();
          input()?.focus();
          break;
        case "blur":
          api?.blur();
          input()?.blur();
          break;
        default:
          throw new Error(`spinbutton fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
