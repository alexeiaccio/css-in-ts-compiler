import { type Slider, createSlider } from "../src/slider";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import type { SliderConfig } from "@cssints/apg-specs/src/apg/slider.bridge";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createSlider` as a rail plus a `role=slider` thumb and exposes the
 * `Mounted` the DOM driver needs. `orientation` / `direction` live in signals so
 * a `prop` step can flip them; a `pointer` prop is a rail press at a 0..1
 * fraction (it focuses the thumb, as a user's press would). Controlled, the
 * fixture is the host: it keeps the value in a signal, passes it as `value`, and
 * either writes every request back (`accepts`) or ignores the callback.
 */
export const mountSlider = (config: SliderConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const [orientation, setOrientation] = createSignal(config.orientation);
  const [direction, setDirection] = createSignal(config.dir);
  const [host, setHost] = createSignal(config.value);
  const writeHost = (next: number): void => {
    if (config.controlled) {
      setHost(next);
    }
  };
  let api: Slider | undefined;

  const dispose = render(() => {
    const slider = createSlider({
      min: config.min,
      max: config.max,
      step: config.step,
      largeStep: config.largeStep,
      defaultValue: config.value,
      get value() {
        return config.controlled ? host() : undefined;
      },
      get orientation() {
        return orientation();
      },
      get direction() {
        return direction();
      },
      onValueChange: (value) => {
        push("onValueChange", value);
        if (config.accepts) {
          setHost(value);
        }
      },
    });
    api = slider;
    return (
      <>
        <div data-part="track" />
        <div data-part="thumb" {...slider.thumbProps} />
      </>
    );
  }, root);

  const thumb = (): HTMLElement | null => root.querySelector<HTMLElement>('[data-part="thumb"]');

  return {
    root,
    events,
    value: () => api?.value() ?? config.value,
    setProp: (name, value) => {
      switch (name) {
        case "orientation":
          setOrientation(value === "vertical" ? "vertical" : "horizontal");
          break;
        case "dir":
        case "direction":
          setDirection(value === "rtl" ? "rtl" : "ltr");
          break;
        case "pointer":
          api?.pointerDown(Number(value));
          thumb()?.focus();
          break;
        case "setValue":
          writeHost(Number(value));
          break;
        case "hostToggle":
          writeHost(host() === config.max ? config.min : config.max);
          break;
        case "focus":
          api?.focus();
          thumb()?.focus();
          break;
        case "blur":
          api?.blur();
          thumb()?.blur();
          break;
        default:
          throw new Error(`slider fixture has no prop ${name}`);
      }
    },
    focus: () => (api?.focused() === true ? "thumb" : null),
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
