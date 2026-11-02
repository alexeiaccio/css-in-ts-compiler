import type { Json } from "@cssints/apg-specs/scenario";
import type { MeterConfig } from "@cssints/apg-specs/apg/meter.bridge";
import type { Meter as MeterController } from "@cssints/headless";
import type { Mounted } from "./meter-driver.ts";
import { Meter } from "./meter.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const optional = (value: Json | undefined): string | undefined =>
  value === null || value === undefined ? undefined : String(value);

/**
 * Mounts the styled meter driven by signals, and exposes the `Mounted` the DOM driver needs. The
 * `data-part="meter"` box is the primitive's `role=meter` (the fill beside it is decoration).
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
  let api: MeterController | undefined;

  const dispose = render(
    () => (
      <Meter
        label={label() ?? "Usage"}
        labelId={labelId()}
        value={value()}
        min={min()}
        max={max()}
        valueText={valueText()}
        onReady={(meter) => {
          api = meter;
        }}
      />
    ),
    root,
  );

  return {
    root,
    events,
    value: () => ({ now: api?.value() ?? config.value }),
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
