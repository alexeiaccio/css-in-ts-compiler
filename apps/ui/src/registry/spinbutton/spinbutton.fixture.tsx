import type { SpinbuttonConfig } from "@cssints/apg-specs/apg/spinbutton.bridge";
import { type Spinbutton as SpinbuttonController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./spinbutton-driver.ts";
import type { PartProps } from "../render.tsx";
import { Spinbutton } from "./spinbutton.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

/**
 * The styled spinbutton's parts, named the way `spinbutton.qnt` names them (`input`, `increment`,
 * `decrement`) instead of the kit's `spinbutton-*` hooks: the shared DOM driver finds a part by
 * `data-part`, so the conformance fixture overrides the elements through the component's own `render`
 * props. The kit keeps its class on every one.
 *
 * The steppers are the primitive's non-focusable role=button boxes, as in `packages/headless`, not the
 * kit's native `<button>`: a press must leave the DOM focus on the field (the primitive's
 * `onMouseDown` prevents the default, but Solid 2 runs a delegated handler after the browser has moved
 * focus), and the row the driver clicks has to stay actionable at a bound, where the primitive ignores
 * the step itself.
 */
export const spinbuttonParts = (root: () => HTMLElement) => {
  const field = (): HTMLInputElement | null =>
    root().querySelector<HTMLInputElement>('[data-part="input"]');
  const press = (
    part: PartProps,
    event: MouseEvent & { currentTarget: HTMLElement; target: Element },
  ): void => {
    const onClick = part.onClick;
    if (typeof onClick === "function") {
      onClick(event);
    }
    field()?.focus();
  };
  return {
    render: (part: PartProps): JSX.Element => <input {...part} data-part="input" />,
    renderIncrement: (part: PartProps): JSX.Element => (
      <div {...part} data-part="increment" onClick={(event) => press(part, event)}>
        +
      </div>
    ),
    renderDecrement: (part: PartProps): JSX.Element => (
      <div {...part} data-part="decrement" onClick={(event) => press(part, event)}>
        &minus;
      </div>
    ),
  };
};

/**
 * Mounts the styled spinbutton for the scenario walk and exposes what the driver needs: the field with
 * `data-part="input"`, the callback payloads, and a way to push a programmatic change. Controlled, the fixture
 * is the host: it keeps the committed value in a signal, passes it as `value`, and either writes every request
 * back (`accepts`) or ignores the callback.
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
  let api: SpinbuttonController | undefined;

  const dispose = render(() => {
    return (
      <Spinbutton
        {...spinbuttonParts(() => root)}
        min={config.min}
        max={config.max}
        step={config.step}
        largeStep={config.largeStep}
        defaultValue={config.value}
        value={config.controlled ? host() : undefined}
        wrap={config.wrap}
        onReady={(controller) => {
          api = controller;
        }}
        onValueChange={(value) => {
          push("onValueChange", value);
          if (config.accepts) {
            setHost(value);
          }
        }}
      />
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
