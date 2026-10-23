import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number =>
  typeof value === "bigint" ? Number(value) : Number(value ?? 0);

/**
 * Scenario `config` -> what both targets are mounted with. The spec models a
 * fixed set of ranges (0..100, 10..50, 20..200); a config with another range
 * still mounts (the primitive is generic) but the spec cannot follow it, so the
 * scenario is only checked against the DOM.
 */
export interface MeterConfig {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly valueText: string | undefined;
  readonly labelId: string | undefined;
  readonly label: string | undefined;
}

const RANGES: ReadonlyArray<readonly [number, number, bigint]> = [
  [0, 100, 0n],
  [10, 50, 1n],
  [20, 200, 2n],
];

const rangeSelector = (min: number, max: number): bigint | undefined =>
  RANGES.find(([lo, hi]) => lo === min && hi === max)?.[2];

const asNumber = (key: string, value: Schema.Json): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
};

const asString = (key: string, value: Schema.Json): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (value === null) {
    return undefined;
  }
  throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
};

export const meterConfig = (config: ScenarioConfig): MeterConfig => {
  let value = 0;
  let min = 0;
  let max = 100;
  let valueText: string | undefined;
  let labelId: string | undefined;
  let label: string | undefined;
  for (const [key, entry] of Object.entries(config)) {
    switch (key) {
      case "value":
        value = asNumber(key, entry);
        break;
      case "min":
      case "minValue":
        min = asNumber(key, entry);
        break;
      case "max":
      case "maxValue":
        max = asNumber(key, entry);
        break;
      case "valueText":
      case "getAriaValueText":
        valueText = asString(key, entry);
        break;
      case "labelId":
        labelId = asString(key, entry);
        break;
      case "label":
      case "aria-label":
      case "slot":
        label = asString(key, entry);
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(entry)}`);
    }
  }
  return { value, min, max, valueText, labelId, label };
};

const partOf = (target: string | undefined): string => (target ?? "meter").replace(/:0$/, "");

const percentOf = (state: QuintModelValue): number => {
  const min = num(state["min"]);
  const max = num(state["max"]);
  const now = num(state["now"]);
  const span = max - min;
  return span <= 0 ? 0 : Math.round(((now - min) / span) * 100);
};

const valueEvent = (value: Schema.Json | undefined): QuintEvent => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Unsupported(`value ${JSON.stringify(value)}`);
  }
  return specEvent("setValue", { v: BigInt(Math.round(value)) });
};

/**
 * Meter vocabulary <-> `specs/apg/meter.qnt`. Parts: `meter` only. The primitive
 * is a controlled display (the consumer feeds value/min/max), so a `prop` step
 * writes it; the spec's `setValue`/`setRange` follow best-effort (the range pool
 * is fixed, see `MeterConfig`).
 */
export const meterBridge: SpecBridge = {
  setup: (config) => {
    const { value, min, max } = meterConfig(config);
    const selector = rangeSelector(min, max);
    return [
      ...(selector === undefined ? [] : [specEvent("setRange", { r: selector })]),
      valueEvent(value),
    ];
  },
  event: (step: ActionStep) => {
    if (step.event !== "prop") {
      throw new Unsupported(`event ${step.event}`);
    }
    switch (step.prop) {
      case "value":
        return [valueEvent(step.value)];
      // The primitive is generic; the spec's range pool is fixed, so a range or
      // label write has no spec event and stays inert on the reference side.
      case "min":
      case "minValue":
      case "max":
      case "maxValue":
      case "valueText":
      case "getAriaValueText":
      case "labelId":
      case "label":
      case "aria-label":
        return [];
      default:
        throw new Unsupported(`prop ${step.prop ?? ""}`);
    }
  },
  focus: () => null,
  value: (state) => ({ now: num(state["now"]) }),
  attr: (state, target, name) => {
    if (partOf(target) !== "meter") {
      throw new Unsupported(`part ${target}`);
    }
    switch (name) {
      case "role":
        return "meter";
      case "aria-valuemin":
        return String(num(state["min"]));
      case "aria-valuemax":
        return String(num(state["max"]));
      case "aria-valuenow":
        return String(num(state["now"]));
      case "aria-valuetext":
        return `${percentOf(state)}%`;
      default:
        throw new Unsupported(`attribute ${name} on ${target}`);
    }
  },
  visible: () => [],
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const meterSteps: ReadonlyArray<ActionStep> = [-5, 0, 5, 15, 25, 60, 100, 150].map(
  (value) => ({ event: "prop", prop: "value", value }),
);

export const meterProbe: Probe = {
  attrs: [
    ["meter", "role"],
    ["meter", "aria-valuemin"],
    ["meter", "aria-valuemax"],
    ["meter", "aria-valuenow"],
    ["meter", "aria-valuetext"],
  ],
  events: [],
};
