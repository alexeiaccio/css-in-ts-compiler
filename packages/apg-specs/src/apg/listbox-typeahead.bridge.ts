import type { ActionStep, Probe, ScenarioConfig, SpecBridge } from "../scenario";
import {
  type ListboxMountConfig,
  jsonRecord,
  listboxConfig,
  partOf,
  specEvent,
} from "./listbox-shared";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import { Unsupported } from "../scenario";

/** Scenario `config` -> mount config for the type-ahead model. */
export const listboxTypeaheadConfig = (config: ScenarioConfig): ListboxMountConfig =>
  listboxConfig(config, "single");

/**
 * Listbox (type-ahead) vocabulary <-> `specs/apg/listbox-typeahead.qnt`. The
 * spec's option names are `aa`, `ab`, `b`, `ba`, `bc`, `c`; the differential
 * walk mounts exactly those labels and types `a`/`b`/`c` (the spec's char
 * pool). `prop typeaheadTimeoutElapsed` stands in for the inactivity timer.
 *
 * Scenario `type` steps carry real labels (upper-case), so they are gated
 * unsupported: the DOM driver has no `type` input anyway.
 */
const charCode = (text: string): bigint => {
  switch (text) {
    case "a":
      return 1n;
    case "b":
      return 2n;
    case "c":
      return 3n;
    default:
      throw new Unsupported(`char ${JSON.stringify(text)}`);
  }
};

const keyEvents = (key: string): ReadonlyArray<QuintEvent> => {
  switch (key) {
    case "ArrowDown":
      return [specEvent("arrow_down")];
    case "ArrowUp":
      return [specEvent("arrow_up")];
    case "Home":
      return [specEvent("home")];
    case "End":
      return [specEvent("end")];
    default:
      throw new Unsupported(`key ${key}`);
  }
};

const propEvents = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "focus":
      return [specEvent("focus_in")];
    case "blur":
      return [specEvent("blur")];
    case "type":
      return [specEvent("type_char", { ch: charCode(String(step.value)) })];
    case "typeaheadTimeoutElapsed":
      return [specEvent("timeout")];
    case "setValue":
    case "value":
    case "activeValue":
      if (typeof step.value !== "number" || !Number.isInteger(step.value)) {
        throw new Unsupported(`setValue ${JSON.stringify(step.value)}`);
      }
      return [specEvent("setValue", { v: BigInt(step.value) })];
    case "hostToggle":
      return [specEvent("hostToggle")];
    case "key": {
      const record = jsonRecord(step.value);
      const key = record["key"];
      if (typeof key !== "string") {
        throw new Unsupported(`prop key ${JSON.stringify(step.value)}`);
      }
      return keyEvents(key);
    }
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

export const listboxTypeaheadBridge: SpecBridge = {
  setup: (config) => {
    const mount = listboxTypeaheadConfig(config);
    const events: QuintEvent[] = [];
    if (mount.controlled) {
      events.push(specEvent("control"));
      if (mount.accepts) {
        events.push(specEvent("acceptRequests"));
      }
      if (mount.defaultActive !== undefined && mount.defaultActive > 0) {
        events.push(specEvent("setValue", { v: BigInt(mount.defaultActive) }));
      }
    }
    return events;
  },
  event: (step) => {
    switch (step.event) {
      case "focus":
        return [specEvent("focus_in")];
      case "blur":
        return [specEvent("blur")];
      case "key":
        return keyEvents(step.key ?? "");
      case "type":
        throw new Unsupported(`type ${step.text ?? ""}`);
      case "hover":
      case "unhover":
        return [];
      case "prop":
        return propEvents(step);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state: QuintModelValue) =>
    state["hasFocus"] === true ? `option:${state["active"]}` : null,
  attr: (state: QuintModelValue, target: string, name: string) => {
    if (partOf(target) === "listbox" && name === "aria-activedescendant") {
      return state["hasFocus"] === true ? `option:${state["active"]}` : null;
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [["onActiveChange", String(Number(after["requested"]))] as const],
};

/** The user-level steps a differential walk draws from. */
export const listboxTypeaheadSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "focus" },
  { event: "prop", prop: "blur" },
  { event: "prop", prop: "type", value: "a" },
  { event: "prop", prop: "type", value: "b" },
  { event: "prop", prop: "type", value: "c" },
  { event: "prop", prop: "typeaheadTimeoutElapsed", value: true },
  { event: "prop", prop: "key", value: { key: "ArrowDown" } },
  { event: "prop", prop: "key", value: { key: "ArrowUp" } },
  { event: "prop", prop: "key", value: { key: "Home" } },
  { event: "prop", prop: "key", value: { key: "End" } },
  { event: "prop", prop: "setValue", value: 2 },
  { event: "prop", prop: "setValue", value: 5 },
  { event: "prop", prop: "hostToggle" },
];

export const listboxTypeaheadProbe: Probe = {
  attrs: [["listbox", "aria-activedescendant"]],
  events: ["onActiveChange"],
};
