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
 * Spinbutton vocabulary <-> `specs/apg/spinbutton.qnt`, shared by the spec
 * driver and the DOM driver.
 *
 * Parts: `input` (role=spinbutton, the only tab stop), `increment` and
 * `decrement` (tabindex -1), plus the fixture `group`. The spec fixes min 1,
 * max 12, step 1, page 3 and initial value 5; config that changes the range,
 * step or start value is `Unsupported`. The uncommitted draft is a fixed pool
 * of sample texts (`"" / "5" / "12" / "13" / "0" / "abc"`), so a scenario `type`
 * step is `Unsupported` (the replay driver cannot type either); the walk enters
 * the pool through `prop: type` steps, mirroring the listbox typeahead bridge.
 *
 * Controlled (map ticket rt1p): `controlled` puts the committed value in a host;
 * a `value` alongside it pins the host (a rejecting host), `controlled` alone
 * accepts every request. `setValue` / `hostToggle` are the host writing the
 * value; they are inert while uncontrolled.
 *
 * `wrap` maps to `setWrap`; `buttons` only says the fixture renders the
 * steppers and is neutral.
 */
export interface SpinbuttonConfig {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly largeStep: number;
  readonly wrap: boolean;
  readonly buttons: boolean;
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back as the value. */
  readonly accepts: boolean;
}

const MIN = 1;
const MAX = 12;
const STEP = 1;
const LARGE_STEP = 3;
const INITIAL_VALUE = 5;
const DRAFT_POOL = new Set(["", "5", "12", "13", "0", "abc"]);

const numberEquals = (key: string, value: Schema.Json, expected: number): void => {
  if (typeof value !== "number" || value !== expected) {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
};

/** Scenario `config` -> what both targets are mounted with. */
export const spinbuttonConfig = (config: ScenarioConfig): SpinbuttonConfig => {
  let value = INITIAL_VALUE;
  let min = MIN;
  let max = MAX;
  let step = STEP;
  let largeStep = LARGE_STEP;
  let wrap = false;
  let buttons = false;
  let controlled = false;
  let pinned = false;
  for (const [key, raw] of Object.entries(config)) {
    switch (key) {
      case "value": {
        const number = Number(raw);
        if (number !== INITIAL_VALUE) {
          throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
        }
        value = number;
        pinned = true;
        break;
      }
      case "defaultValue": {
        const number = Number(raw);
        if (number !== INITIAL_VALUE) {
          throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
        }
        value = number;
        break;
      }
      case "min":
        numberEquals(key, raw, MIN);
        min = MIN;
        break;
      case "max":
        numberEquals(key, raw, MAX);
        max = MAX;
        break;
      case "step":
        numberEquals(key, raw, STEP);
        step = STEP;
        break;
      case "smallStep":
        numberEquals(key, raw, STEP);
        break;
      case "largeStep":
        numberEquals(key, raw, LARGE_STEP);
        largeStep = LARGE_STEP;
        break;
      case "wrap":
        if (typeof raw !== "boolean") {
          throw new Unsupported(`config wrap=${JSON.stringify(raw)}`);
        }
        wrap = raw;
        break;
      case "buttons":
        if (typeof raw !== "boolean") {
          throw new Unsupported(`config buttons=${JSON.stringify(raw)}`);
        }
        buttons = raw;
        break;
      case "controlled":
        if (typeof raw !== "boolean") {
          throw new Unsupported(`config controlled=${JSON.stringify(raw)}`);
        }
        controlled = raw;
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  return {
    value,
    min,
    max,
    step,
    largeStep,
    wrap,
    buttons,
    controlled,
    accepts: controlled && !pinned,
  };
};

const partOf = (target: string | undefined): "input" | "increment" | "decrement" => {
  const part = (target ?? "input").replace(/:\d+$/, "");
  if (part === "input") {
    return "input";
  }
  if (part === "increment") {
    return "increment";
  }
  if (part === "decrement") {
    return "decrement";
  }
  throw new Unsupported(`part ${part}`);
};

const onInput = (step: ActionStep): void => {
  if (partOf(step.target) !== "input") {
    throw new Unsupported(`${step.event} on ${step.target ?? "input"}`);
  }
};

const KEY_ACTIONS = new Map<string, string>([
  ["ArrowUp", "arrowUp"],
  ["ArrowDown", "arrowDown"],
  ["PageUp", "pageUp"],
  ["PageDown", "pageDown"],
  ["Home", "home"],
  ["End", "end"],
  ["Enter", "commit"],
  ["Escape", "revert"],
]);

const draftInRange = (text: string): boolean => {
  const number = Number(text);
  return text.trim() !== "" && Number.isFinite(number) && number >= MIN && number <= MAX;
};

const programmatic = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "type": {
      const text = step.value;
      if (typeof text !== "string" || !DRAFT_POOL.has(text)) {
        throw new Unsupported(`type ${JSON.stringify(text)}`);
      }
      return [specEvent("typeText", { text })];
    }
    case "wrap":
      if (typeof step.value !== "boolean") {
        throw new Unsupported(`wrap ${JSON.stringify(step.value)}`);
      }
      return [specEvent("setWrap", { mode: step.value })];
    case "setValue": {
      if (typeof step.value !== "number") {
        throw new Unsupported(`prop setValue=${JSON.stringify(step.value)}`);
      }
      const value = Math.round(step.value);
      if (value !== step.value || value < MIN || value > MAX) {
        throw new Unsupported(`setValue ${JSON.stringify(step.value)}`);
      }
      return [specEvent("setValue", { v: BigInt(value) })];
    }
    case "hostToggle":
      return [specEvent("hostToggle")];
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

export const spinbuttonBridge: SpecBridge = {
  setup: (config) => {
    const mount = spinbuttonConfig(config);
    return [
      ...(mount.controlled
        ? [
            specEvent("control"),
            ...(mount.accepts ? [specEvent("acceptRequests")] : []),
            ...(mount.accepts ? [] : [specEvent("setValue", { v: BigInt(mount.value) })]),
          ]
        : []),
      ...(mount.wrap ? [specEvent("setWrap", { mode: true })] : []),
    ];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        onInput(step);
        return [specEvent("focus")];
      case "blur":
        onInput(step);
        return [specEvent("blur")];
      case "key": {
        onInput(step);
        const action = KEY_ACTIONS.get(step.key ?? "");
        if (action === undefined || step.repeat === true) {
          throw new Unsupported(`key ${step.key ?? ""}`);
        }
        // convention: a key first focuses its target, as a user would
        return [specEvent("focus"), specEvent(action)];
      }
      case "click": {
        const part = partOf(step.target);
        if (part === "increment") {
          return [specEvent("clickIncrement")];
        }
        if (part === "decrement") {
          return [specEvent("clickDecrement")];
        }
        throw new Unsupported(`click on ${step.target ?? ""}`);
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
  value: (state: QuintModelValue) => ({
    input: state["editing"] === true ? String(state["draft"] ?? "") : String(state["value"]),
  }),
  focus: (state: QuintModelValue) => (state["focused"] === true ? "input:0" : null),
  attr: (state: QuintModelValue, target: string, name: string) => {
    const value = Number(state["value"]);
    const part = partOf(target);
    if (part === "input") {
      switch (name) {
        case "role":
          return "spinbutton";
        case "aria-valuenow":
          return String(value);
        case "aria-valuemin":
          return String(MIN);
        case "aria-valuemax":
          return String(MAX);
        case "aria-invalid":
          return state["editing"] === true && !draftInRange(String(state["draft"])) ? "true" : null;
        case "tabindex":
          return "0";
        default:
          throw new Unsupported(`attribute ${name} on ${target}`);
      }
    }
    if (part === "increment") {
      if (name === "aria-disabled") {
        return state["wrap"] === false && value === MAX ? "true" : null;
      }
      if (name === "tabindex") {
        return "-1";
      }
      throw new Unsupported(`attribute ${name} on ${target}`);
    }
    if (name === "aria-disabled") {
      return state["wrap"] === false && value === MIN ? "true" : null;
    }
    if (name === "tabindex") {
      return "-1";
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before: QuintModelValue, after: QuintModelValue) =>
    before["requests"] === after["requests"]
      ? []
      : [["onValueChange", Number(after["requested"])] as const],
};

/** The user-level steps a differential walk draws from. */
export const spinbuttonSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "input" },
  { event: "blur", target: "input" },
  { event: "key", target: "input", key: "ArrowUp" },
  { event: "key", target: "input", key: "ArrowDown" },
  { event: "key", target: "input", key: "PageUp" },
  { event: "key", target: "input", key: "PageDown" },
  { event: "key", target: "input", key: "Home" },
  { event: "key", target: "input", key: "End" },
  { event: "key", target: "input", key: "Enter" },
  { event: "key", target: "input", key: "Escape" },
  { event: "click", target: "increment" },
  { event: "click", target: "decrement" },
  { event: "prop", prop: "type", value: "12" },
  { event: "prop", prop: "type", value: "13" },
  { event: "prop", prop: "type", value: "5" },
  { event: "prop", prop: "type", value: "abc" },
  { event: "prop", prop: "type", value: "" },
  { event: "prop", prop: "wrap", value: true },
  { event: "prop", prop: "wrap", value: false },
  { event: "prop", prop: "setValue", value: 1 },
  { event: "prop", prop: "setValue", value: 5 },
  { event: "prop", prop: "setValue", value: 12 },
  { event: "prop", prop: "hostToggle" },
];

export const spinbuttonProbe: Probe = {
  attrs: [
    ["input:0", "role"],
    ["input:0", "aria-valuenow"],
    ["input:0", "aria-valuemin"],
    ["input:0", "aria-valuemax"],
    ["input:0", "aria-invalid"],
    ["input:0", "tabindex"],
    ["increment", "aria-disabled"],
    ["decrement", "aria-disabled"],
    ["increment", "tabindex"],
    ["decrement", "tabindex"],
  ],
  events: ["onValueChange"],
};
