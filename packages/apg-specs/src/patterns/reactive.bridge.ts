import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (tag: string): QuintEvent => ({ _tag: tag });

// `""` is the model's absent attribute; a DOM attribute that is not there is `null`.
const text = (value: QuintModelValue[string] | undefined): string | null => {
  const state = value === undefined ? "" : String(value);
  return state === "" ? null : state;
};

/** The parts of the modelled page: two owners, their bindings and their conditions. */
export const REACTIVE_PARTS = [
  "outer",
  "inner",
  "outer-btn",
  "outer-tab-1",
  "outer-tab-2",
  "outer-field",
  "outer-panel",
  "inner-btn",
  "inner-tab-1",
  "inner-tab-2",
  "inner-check",
  "inner-panel",
] as const;

/** The attributes each part carries, by the model field that holds the value. */
const ATTRS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  outer: { "data-reactive-open": "xaOpen", "data-reactive-tab": "xaTab" },
  inner: { "data-reactive-open": "yaOpen", "data-reactive-tab": "yaTab" },
  "outer-btn": { "aria-expanded": "aExpanded" },
  "outer-tab-1": {
    "aria-selected": "aOneSel",
    "aria-controls": "aOneControls",
    tabindex: "aOneTab",
  },
  "outer-tab-2": { "aria-selected": "aTwoSel", tabindex: "aTwoTab" },
  "outer-field": { "data-current": "aCurrent" },
  "inner-btn": { "aria-expanded": "bExpanded" },
  "inner-tab-1": {
    "aria-selected": "bOneSel",
    "aria-controls": "bOneControls",
    tabindex: "bOneTab",
  },
  "inner-tab-2": { "aria-selected": "bTwoSel", tabindex: "bTwoTab" },
  "inner-check": { "data-checked": "bChecked" },
};

/** The computed `display` of a condition on the neighbourhood of an owner. */
const DISPLAY: Readonly<Record<string, string>> = {
  "outer-panel": "aPanel",
  "inner-panel": "bPanel",
};

/**
 * The instance the spec models: two owners (`outer`, `inner` nested in it), each
 * with `open` and `tab`, the bindings below and no configuration. Any other
 * config is not modelled.
 */
export const reactiveConfig = (config: ScenarioConfig): void => {
  const key = Object.keys(config)[0];
  if (key !== undefined) {
    throw new Unsupported(`config ${key}=${JSON.stringify(config[key])}`);
  }
};

/**
 * `@cssints/reactive` vocabulary <-> `specs/patterns/reactive.qnt`. Parts are the
 * page's ids: `outer` / `inner` owners, `outer-btn` and `inner-btn` (a click
 * toggles the nearest owner's `open`), `outer-tab-1` / `outer-tab-2` and the
 * inner pair (`click` sets `tab`), `outer-field` (a `change` with a `value`
 * writes it from `@value`), `inner-check` (a `change` with `value: true`/`false`
 * writes `open` from `@checked`), and `outer-panel` / `inner-panel` (the
 * `display` their `inside()` condition computes). A `key` on `inner-btn`
 * bubbles to the outer owner element's program, which writes the outer owner.
 */
export const reactiveBridge: SpecBridge = {
  setup: (config) => {
    reactiveConfig(config);
    return [specEvent("setup")];
  },
  event: (step: ActionStep) => {
    const target = step.target ?? "";
    switch (step.event) {
      case "click":
        switch (target) {
          case "outer-btn":
            return [specEvent("clickOuterToggle")];
          case "outer-tab-1":
            return [specEvent("clickOuterTabOne")];
          case "outer-tab-2":
            return [specEvent("clickOuterTabTwo")];
          case "inner-btn":
            return [specEvent("clickInnerToggle")];
          case "inner-tab-1":
            return [specEvent("clickInnerTabOne")];
          case "inner-tab-2":
            return [specEvent("clickInnerTabTwo")];
          case "inner-panel":
            return [specEvent("clickInnerPanel")];
          default:
            throw new Unsupported(`click on ${target}`);
        }
      case "change":
        if (target === "outer-field") {
          if (step.value === "one") {
            return [specEvent("changeOuterFieldOne")];
          }
          if (step.value === "two") {
            return [specEvent("changeOuterFieldTwo")];
          }
          throw new Unsupported(`value ${JSON.stringify(step.value)} on ${target}`);
        }
        if (target === "inner-check") {
          if (step.value === true) {
            return [specEvent("changeInnerCheckOn")];
          }
          if (step.value === false) {
            return [specEvent("changeInnerCheckOff")];
          }
          throw new Unsupported(`value ${JSON.stringify(step.value)} on ${target}`);
        }
        throw new Unsupported(`change on ${target}`);
      case "key":
        if (target === "inner-btn") {
          return [specEvent("keydownInner")];
        }
        throw new Unsupported(`key on ${target}`);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => [state["xo"], state["xt"], state["yo"], state["yt"]].map((v) => String(v)),
  focus: () => null,
  attr: (state, target, name) => {
    if (name === "display") {
      const field = DISPLAY[target];
      if (field === undefined) {
        throw new Unsupported(`display on ${target}`);
      }
      return text(state[field]);
    }
    const field = ATTRS[target]?.[name];
    if (field === undefined) {
      throw new Unsupported(`attribute ${name} on ${target}`);
    }
    return text(state[field]);
  },
  visible: () => [],
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const reactiveSteps: ReadonlyArray<ActionStep> = [
  { event: "click", target: "outer-btn" },
  { event: "click", target: "outer-tab-1" },
  { event: "click", target: "outer-tab-2" },
  { event: "click", target: "inner-btn" },
  { event: "click", target: "inner-tab-1" },
  { event: "click", target: "inner-tab-2" },
  { event: "click", target: "inner-panel" },
  { event: "change", target: "outer-field", value: "one" },
  { event: "change", target: "outer-field", value: "two" },
  { event: "change", target: "inner-check", value: true },
  { event: "change", target: "inner-check", value: false },
  { event: "key", key: "Enter", target: "inner-btn" },
];

export const reactiveProbe: Probe = {
  attrs: [
    ["outer", "data-reactive-open"],
    ["outer", "data-reactive-tab"],
    ["inner", "data-reactive-open"],
    ["inner", "data-reactive-tab"],
    ["outer-btn", "aria-expanded"],
    ["outer-tab-1", "aria-selected"],
    ["outer-tab-1", "aria-controls"],
    ["outer-tab-1", "tabindex"],
    ["outer-tab-2", "aria-selected"],
    ["outer-tab-2", "tabindex"],
    ["outer-field", "data-current"],
    ["outer-panel", "display"],
    ["inner-btn", "aria-expanded"],
    ["inner-tab-1", "aria-selected"],
    ["inner-tab-1", "aria-controls"],
    ["inner-tab-1", "tabindex"],
    ["inner-tab-2", "aria-selected"],
    ["inner-tab-2", "tabindex"],
    ["inner-check", "data-checked"],
    ["inner-panel", "display"],
  ],
  events: [],
};
