import type { Json } from "@cssints/apg-specs/src/scenario";
import type { MeterConfig } from "@cssints/apg-specs/src/apg/meter.bridge";
import type { Mounted } from "./dom-driver";
import { createMeter } from "../src/meter";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const optional = (value: Json | undefined): string | undefined =>
  value === null || value === undefined ? undefined : String(value);

/**
 * Renders `createMeter` as a `role=meter` box driven by signals, and exposes the
 * `Mounted` the DOM driver needs.
 */
export const mountMeter = (config: MeterConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [value, setValue] = createSignal(config.value);
  const [min, setMin] = createSignal(config.min);
  const [max, setMax] = createSignal(config.max);
  const [valueText, setValueText] = createSignal<string | undefined>(config.valueText);
  const [labelId, setLabelId] = createSignal<string | undefined>(config.labelId);
  const [label, setLabel] = createSignal<string | undefined>(config.label);

  const meter = createMeter({
    get value() {
      return value();
    },
    get min() {
      return min();
    },
    get max() {
      return max();
    },
    get valueText() {
      return valueText();
    },
    get labelId() {
      return labelId();
    },
    get label() {
      return label();
    },
  });

  const dispose = render(() => <div data-part="meter" {...meter.meterProps} />, root);

  return {
    root,
    events,
    setProp: (name, next) => {
      switch (name) {
        case "value":
          setValue(Number(next));
          break;
        case "min":
        case "minValue":
          setMin(Number(next));
          break;
        case "max":
        case "maxValue":
          setMax(Number(next));
          break;
        case "valueText":
        case "getAriaValueText":
          setValueText(optional(next));
          break;
        case "labelId":
          setLabelId(optional(next));
          break;
        case "label":
        case "aria-label":
          setLabel(optional(next));
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
