import { type SliderMultiThumb, createSliderMultiThumb } from "../src/slider-multithumb";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { SliderMultithumbConfig } from "@cssints/apg-specs/apg/slider-multithumb.bridge";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createSliderMultiThumb` as a rail plus two `role=slider` thumbs and
 * exposes the `Mounted` the DOM driver needs. `orientation` / `direction` live
 * in signals; a `pointerLo` / `pointerHi` prop is a rail press on that thumb
 * (focusing it, as a user's press would).
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

  const dispose = render(() => {
    const slider = createSliderMultiThumb({
      min: config.min,
      max: config.max,
      step: config.step,
      largeStep: config.largeStep,
      defaultValue: config.values,
      get value() {
        return config.controlled ? host() : undefined;
      },
      get orientation() {
        return orientation();
      },
      get direction() {
        return direction();
      },
      onValueChange: (values) => {
        push("onValueChange", [...values]);
        if (config.accepts) {
          setHost([...values] as readonly [number, number]);
        }
      },
    });
    api = slider;
    return (
      <>
        <div data-part="track" />
        <div data-part="thumb" {...slider.thumbProps(0)} />
        <div data-part="thumb" {...slider.thumbProps(1)} />
      </>
    );
  }, root);

  const thumbs = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="thumb"]'),
  ];

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
