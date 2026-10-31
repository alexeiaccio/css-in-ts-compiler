import { type SliderMultiThumb } from "@cssints/headless";
import { type Json } from "@cssints/apg-specs/scenario";
import { type SliderMultithumbConfig } from "@cssints/apg-specs/apg/slider-multithumb.bridge";
import { type Mounted } from "./slider-multithumb-driver.ts";
import { SliderMultithumb as StyledSliderMultithumb } from "./slider-multithumb.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Mounts the styled multi-thumb slider for the scenario walk and exposes what the driver needs:
 * the element with `data-part="thumb"`, the callback payloads, and a way to push a programmatic
 * change. `orientation` / `direction` live in signals so a `prop` step can flip them; a
 * `pointerLo` / `pointerHi` prop is a press on that thumb (focusing it, as a user's press would).
 * Controlled, the fixture plays the host: it keeps the pair in a signal and either writes every
 * request back (`accepts`) or ignores it.
 *
 * @param {SliderMultithumbConfig} config the state the walk starts from and the host's policy
 * @returns {Mounted} the mounted element and the driver's view of it
 */
export const mountSliderMultithumb = (config: SliderMultithumbConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const [orientation, setOrientation] = createSignal(config.orientation);
  const [direction, setDirection] = createSignal(config.dir);
  const [host, setHost] = createSignal<readonly [number, number]>(config.values);
  let api: SliderMultiThumb | undefined;

  const thumbs = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="thumb"]'),
  ];

  const dispose = render(() => {
    return (
      <StyledSliderMultithumb
        label="Price"
        min={config.min}
        max={config.max}
        step={config.step}
        largeStep={config.largeStep}
        defaultValue={config.values}
        value={config.controlled ? host() : undefined}
        orientation={orientation()}
        direction={direction()}
        onReady={(controller) => {
          api = controller;
        }}
        onValueChange={(values) => {
          push("onValueChange", [...values]);
          if (config.accepts) {
            setHost([...values] as readonly [number, number]);
          }
        }}
      />
    );
  }, root);

  return {
    root,
    events,
    value: () => [...(api?.values() ?? config.values)],
    setProp: (name, value) => {
      switch (name) {
        case "orientation":
          setOrientation(value === "vertical" ? "vertical" : "horizontal");
          break;
        case "dir":
        case "direction":
          setDirection(value === "rtl" ? "rtl" : "ltr");
          break;
        case "pointerLo":
          api?.pointerDown(0, Number(value));
          thumbs()[0]?.focus();
          break;
        case "pointerHi":
          api?.pointerDown(1, Number(value));
          thumbs()[1]?.focus();
          break;
        case "focus":
          api?.focusThumb(0);
          thumbs()[0]?.focus();
          break;
        case "blur":
          api?.blur();
          break;
        case "values":
          if (Array.isArray(value) && value.length === 2) {
            setHost([Number(value[0]), Number(value[1])]);
          } else {
            throw new Error(`values needs a pair, got ${JSON.stringify(value)}`);
          }
          break;
        case "setValue": {
          const packed = Number(value);
          setHost([Math.floor(packed / 11), packed % 11]);
          break;
        }
        default:
          throw new Error(`slider-multithumb fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
