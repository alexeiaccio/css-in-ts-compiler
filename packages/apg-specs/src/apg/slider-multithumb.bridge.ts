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

/**
 * Multi-thumb slider vocabulary <-> `specs/apg/slider-multithumb.qnt`, shared by
 * the spec driver and the DOM driver.
 *
 * Parts: `thumb:0` (lo) and `thumb:1` (hi), plus `track` (the spec's `rail`).
 * The spec fixes two thumbs over range 0..10, step 1, large step 3, initial
 * values [3, 7], and each thumb is bounded by its neighbour. Any config that
 * changes the range, step or values is `Unsupported`; `orientation` and `dir`
 * map to `setOrientation` / `setDir`.
 *
 * Its `tab` / `shiftTab` actions are reachable only through native focus
 * movement (or Shift+Tab, which the replay driver does not model), so `Tab`
 * steps are gated `Unsupported`; the walk moves focus with explicit focus steps.
 */
export interface SliderMultithumbConfig {
  readonly values: readonly [number, number];
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly largeStep: number;
  readonly orientation: "horizontal" | "vertical";
  readonly dir: "ltr" | "rtl";
  readonly controlled: boolean;
  readonly accepts: boolean;
}

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 10;
const DEFAULT_STEP = 1;
const DEFAULT_LARGE_STEP = 3;
const INITIAL_VALUES: readonly [number, number] = [3, 7];
/** The packed pair values the spec's `setValue` pool carries. */
const VALUE_POOL = new Set([0, 10, 27, 40, 60, 120]);
const packedPair = (lo: number, hi: number): number => lo * 11 + hi;

const numberEquals = (key: string, value: Schema.Json, expected: number): void => {
  if (typeof value !== "number" || value !== expected) {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
};

/** Scenario `config` -> what both targets are mounted with. */
export const sliderMultithumbConfig = (config: ScenarioConfig): SliderMultithumbConfig => {
  let values: readonly [number, number] = INITIAL_VALUES;
  let min = DEFAULT_MIN;
  let max = DEFAULT_MAX;
  let step = DEFAULT_STEP;
  let largeStep = DEFAULT_LARGE_STEP;
  let orientation: "horizontal" | "vertical" = "horizontal";
  let dir: "ltr" | "rtl" = "ltr";
  let controlled = false;
  let accepts = true;
  for (const [key, raw] of Object.entries(config)) {
    switch (key) {
      case "thumbs":
        numberEquals(key, raw, 2);
        break;
      case "controlled":
        if (typeof raw !== "boolean") {
          throw new Unsupported(`config controlled=${JSON.stringify(raw)}`);
        }
        controlled = raw;
        break;
      case "accepts":
        if (typeof raw !== "boolean") {
          throw new Unsupported(`config accepts=${JSON.stringify(raw)}`);
        }
        controlled = true;
        accepts = raw;
        break;
      case "values": {
        const parsed = Array.isArray(raw) ? raw : null;
        if (
          parsed === null ||
          parsed.length !== 2 ||
          parsed[0] !== INITIAL_VALUES[0] ||
          parsed[1] !== INITIAL_VALUES[1]
        ) {
          throw new Unsupported(`config values=${JSON.stringify(raw)}`);
        }
        values = INITIAL_VALUES;
        break;
      }
      case "min":
        numberEquals(key, raw, DEFAULT_MIN);
        min = DEFAULT_MIN;
        break;
      case "max":
        numberEquals(key, raw, DEFAULT_MAX);
        max = DEFAULT_MAX;
        break;
      case "step":
        numberEquals(key, raw, DEFAULT_STEP);
        step = DEFAULT_STEP;
        break;
      case "largeStep":
        numberEquals(key, raw, DEFAULT_LARGE_STEP);
        largeStep = DEFAULT_LARGE_STEP;
        break;
      case "orientation":
        if (raw !== "horizontal" && raw !== "vertical") {
          throw new Unsupported(`config orientation=${JSON.stringify(raw)}`);
        }
        orientation = raw;
        break;
      case "dir":
        if (raw !== "ltr" && raw !== "rtl") {
          throw new Unsupported(`config dir=${JSON.stringify(raw)}`);
        }
        dir = raw;
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  return {
    values,
    min,
    max,
    step,
    largeStep,
    orientation,
    dir,
    controlled,
    accepts,
  };
};

type Thumb = "lo" | "hi";

/** `thumb:0` / `thumb:1` (both spellings of `thumb` default to lo). */
const thumbOf = (target: string | undefined): Thumb => {
  const clean = target ?? "thumb";
  const base = clean.replace(/:\d+$/, "");
  if (base !== "thumb") {
    throw new Unsupported(`part ${base}`);
  }
  const suffix = clean.includes(":") ? clean.slice(clean.lastIndexOf(":") + 1) : "0";
  switch (suffix) {
    case "0":
      return "lo";
    case "1":
      return "hi";
    default:
      throw new Unsupported(`part ${clean}`);
  }
};

const KEY_POOL = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Enter",
]);

/** The raw rail-press values the spec's pointer actions draw from. */
const POINTER_POOL = new Set([-3, 0, 4, 7, 10, 14]);

const valueTextFor = (value: number): string =>
  value <= 3 ? "low" : value <= 7 ? "medium" : "high";

const pointerRaw = (value: Schema.Json | undefined): bigint => {
  if (typeof value !== "number") {
    throw new Unsupported(`prop pointer=${JSON.stringify(value)}`);
  }
  const raw = Math.round(value * (DEFAULT_MAX - DEFAULT_MIN)) + DEFAULT_MIN;
  if (!POINTER_POOL.has(raw)) {
    throw new Unsupported(`pointer position ${value}`);
  }
  return BigInt(raw);
};

const programmatic = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "orientation":
      if (step.value !== "horizontal" && step.value !== "vertical") {
        throw new Unsupported(`prop orientation=${JSON.stringify(step.value)}`);
      }
      return [specEvent("setOrientation", { o: step.value })];
    case "dir":
      if (step.value !== "ltr" && step.value !== "rtl") {
        throw new Unsupported(`prop dir=${JSON.stringify(step.value)}`);
      }
      return [specEvent("setDir", { d: step.value })];
    case "pointerLo":
      return [specEvent("pointerLo", { raw: pointerRaw(step.value) })];
    case "pointerHi":
      return [specEvent("pointerHi", { raw: pointerRaw(step.value) })];
    case "values":
    case "setValue": {
      let packed: number;
      if (typeof step.value === "number") {
        packed = step.value;
      } else if (
        Array.isArray(step.value) &&
        step.value.length === 2 &&
        typeof step.value[0] === "number" &&
        typeof step.value[1] === "number"
      ) {
        packed = packedPair(step.value[0], step.value[1]);
      } else {
        throw new Unsupported(`prop ${step.prop}=${JSON.stringify(step.value)}`);
      }
      if (!VALUE_POOL.has(packed)) {
        throw new Unsupported(`prop ${step.prop} value ${packed}`);
      }
      return [specEvent("setValue", { v: BigInt(packed) })];
    }
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

export const sliderMultithumbBridge: SpecBridge = {
  setup: (config) => {
    const mount = sliderMultithumbConfig(config);
    return [
      ...(mount.orientation === "vertical" ? [specEvent("setOrientation", { o: "vertical" })] : []),
      ...(mount.dir === "rtl" ? [specEvent("setDir", { d: "rtl" })] : []),
      ...(mount.controlled ? [specEvent("control")] : []),
      ...(mount.controlled && mount.accepts ? [specEvent("acceptRequests")] : []),
      ...(mount.controlled
        ? [
            specEvent("setValue", {
              v: BigInt(packedPair(mount.values[0], mount.values[1])),
            }),
          ]
        : []),
    ];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        return [specEvent("focusThumb", { t: thumbOf(step.target) })];
      case "blur":
        return [specEvent("blur")];
      case "click":
        return [specEvent("focusThumb", { t: thumbOf(step.target) })];
      case "key": {
        const thumb = thumbOf(step.target);
        const key = step.key ?? "";
        if (!KEY_POOL.has(key) || step.repeat === true) {
          throw new Unsupported(`key ${key}`);
        }
        return [specEvent("focusThumb", { t: thumb }), specEvent("keydown", { key })];
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        return programmatic(step);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state: QuintModelValue) => [Number(state["lo"]), Number(state["hi"])],
  focus: (state: QuintModelValue) => {
    const focused = state["focused"];
    if (focused === "lo") {
      return "thumb:0";
    }
    if (focused === "hi") {
      return "thumb:1";
    }
    return null;
  },
  attr: (state: QuintModelValue, target: string, name: string) => {
    const thumb = thumbOf(target);
    const lo = Number(state["lo"]);
    const hi = Number(state["hi"]);
    const value = thumb === "lo" ? lo : hi;
    switch (name) {
      case "role":
        return "slider";
      case "aria-valuenow":
        return String(value);
      case "aria-valuemin":
        return String(thumb === "lo" ? DEFAULT_MIN : lo);
      case "aria-valuemax":
        return String(thumb === "lo" ? hi : DEFAULT_MAX);
      case "aria-valuetext":
        return valueTextFor(value);
      case "aria-orientation":
        return String(state["orientation"]);
      case "tabindex":
        return "0";
      default:
        throw new Unsupported(`attribute ${name} on ${target}`);
    }
  },
  visible: () => [],
  events: (before: QuintModelValue, after: QuintModelValue) =>
    before["requests"] === after["requests"]
      ? []
      : [
          [
            "onValueChange",
            [Math.floor(Number(after["requested"]) / 11), Number(after["requested"]) % 11],
          ] as const,
        ],
};

/** The user-level steps a differential walk draws from. */
export const sliderMultithumbSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "thumb:0" },
  { event: "focus", target: "thumb:1" },
  { event: "key", target: "thumb:0", key: "ArrowRight" },
  { event: "key", target: "thumb:0", key: "ArrowLeft" },
  { event: "key", target: "thumb:0", key: "Home" },
  { event: "key", target: "thumb:0", key: "End" },
  { event: "key", target: "thumb:1", key: "ArrowRight" },
  { event: "key", target: "thumb:1", key: "ArrowLeft" },
  { event: "key", target: "thumb:1", key: "Home" },
  { event: "key", target: "thumb:1", key: "End" },
  { event: "key", target: "thumb:0", key: "PageUp" },
  { event: "key", target: "thumb:1", key: "PageDown" },
  { event: "prop", prop: "pointerLo", value: 0 },
  { event: "prop", prop: "pointerLo", value: 0.4 },
  { event: "prop", prop: "pointerLo", value: 0.7 },
  { event: "prop", prop: "pointerLo", value: 1 },
  { event: "prop", prop: "pointerHi", value: 0 },
  { event: "prop", prop: "pointerHi", value: 0.4 },
  { event: "prop", prop: "pointerHi", value: 0.7 },
  { event: "prop", prop: "pointerHi", value: 1 },
  { event: "prop", prop: "orientation", value: "vertical" },
  { event: "prop", prop: "orientation", value: "horizontal" },
  { event: "prop", prop: "dir", value: "rtl" },
  { event: "prop", prop: "dir", value: "ltr" },
  { event: "prop", prop: "values", value: [5, 5] },
  { event: "prop", prop: "values", value: [0, 10] },
  { event: "prop", prop: "values", value: [3, 7] },
  { event: "prop", prop: "values", value: [3, 7] },
];

export const sliderMultithumbProbe: Probe = {
  attrs: [
    ["thumb:0", "role"],
    ["thumb:0", "aria-valuenow"],
    ["thumb:0", "aria-valuemin"],
    ["thumb:0", "aria-valuemax"],
    ["thumb:0", "aria-valuetext"],
    ["thumb:0", "aria-orientation"],
    ["thumb:0", "tabindex"],
    ["thumb:1", "aria-valuenow"],
    ["thumb:1", "aria-valuemin"],
    ["thumb:1", "aria-valuemax"],
    ["thumb:1", "aria-valuetext"],
  ],
  events: ["onValueChange"],
};
