import type { ActionStep, Probe, ScenarioConfig, SpecBridge } from "../scenario";
import {
  type ListboxMountConfig,
  bit,
  indicesMask,
  indicesOf,
  jsonRecord,
  listboxConfig,
  maskOf,
  optionIndexOf,
  partOf,
  requestedIndices,
  specEvent,
} from "./listbox-shared";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import { Unsupported } from "../scenario";

/** Scenario `config` -> mount config; only the single-select model is modelled. */
export const listboxSingleConfig = (config: ScenarioConfig): ListboxMountConfig => {
  const mount = listboxConfig(config, "single");
  if (mount.selectionMode !== "single") {
    throw new Unsupported(`selectionMode ${mount.selectionMode}`);
  }
  return mount;
};

/**
 * Listbox (single-select) vocabulary <-> `specs/apg/listbox-single.qnt`.
 * Parts: `listbox` (the focus holder / tab stop) and `option:N`. The primitive
 * keeps DOM focus on the active option, so `focus` is the active option's
 * target; `listbox[aria-activedescendant]` cross-checks it.
 *
 * Config the spec does not model (triggers/popups, `open`, `defaultValue`,
 * layouts) throws `Unsupported`, skipping the scenario on every target.
 */
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
    case " ":
    case "Space":
    case "Enter":
      return [specEvent("space")];
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
    case "followsFocus":
    case "set_follows_focus":
      return [specEvent("set_follows_focus", { follow: step.value === true })];
    case "setValue":
    case "value":
    case "selected":
      return [
        specEvent("setValue", {
          v: BigInt(indicesMask(indicesOf(step.value))),
        }),
      ];
    case "hostToggle":
      return [specEvent("hostToggle", { panel: 0n })];
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

export const listboxSingleBridge: SpecBridge = {
  setup: (config: ScenarioConfig) => {
    const mount = listboxSingleConfig(config);
    const events: QuintEvent[] = [];
    if (mount.followsFocus) {
      events.push(specEvent("set_follows_focus", { follow: true }));
    }
    if (mount.controlled) {
      events.push(specEvent("control"));
      if (mount.accepts) {
        events.push(specEvent("acceptRequests"));
      }
      if (mount.defaultSelected.length > 0) {
        events.push(
          specEvent("setValue", {
            v: BigInt(indicesMask(mount.defaultSelected)),
          }),
        );
      }
    } else {
      events.push(
        specEvent("seed", {
          index: BigInt(mount.defaultSelected[0] ?? 6),
        }),
      );
    }
    return events;
  },
  event: (step) => {
    switch (step.event) {
      case "focus":
        return [specEvent("focus_in")];
      case "blur":
        return [specEvent("blur")];
      case "click":
        return [specEvent("click", { index: BigInt(optionIndexOf(step.target)) })];
      case "key":
        return keyEvents(step.key ?? "");
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
    const part = partOf(target);
    if (part === "listbox") {
      if (name === "aria-multiselectable") {
        return "false";
      }
      if (name === "aria-activedescendant") {
        return state["hasFocus"] === true ? `option:${state["active"]}` : null;
      }
    } else if (part.startsWith("option")) {
      if (name === "aria-selected") {
        return bit(maskOf(state), optionIndexOf(target)) ? "true" : "false";
      }
      if (name === "aria-disabled") {
        return null;
      }
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [["onValueChange", requestedIndices(after, 6).map((index) => String(index))] as const],
};

/** The user-level steps a differential walk draws from. */
export const listboxSingleSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "focus" },
  { event: "prop", prop: "blur" },
  { event: "prop", prop: "key", value: { key: "ArrowDown" } },
  { event: "prop", prop: "key", value: { key: "ArrowUp" } },
  { event: "prop", prop: "key", value: { key: "Home" } },
  { event: "prop", prop: "key", value: { key: "End" } },
  { event: "prop", prop: "key", value: { key: " " } },
  { event: "prop", prop: "key", value: { key: "Enter" } },
  { event: "prop", prop: "followsFocus", value: true },
  { event: "prop", prop: "followsFocus", value: false },
  { event: "prop", prop: "setValue", value: [0] },
  { event: "prop", prop: "setValue", value: [3] },
  { event: "prop", prop: "setValue", value: [] },
  { event: "prop", prop: "hostToggle" },
  { event: "click", target: "option:0" },
  { event: "click", target: "option:1" },
  { event: "click", target: "option:2" },
  { event: "click", target: "option:3" },
  { event: "click", target: "option:4" },
  { event: "click", target: "option:5" },
];

export const listboxSingleProbe: Probe = {
  attrs: [
    ["listbox", "aria-multiselectable"],
    ["listbox", "aria-activedescendant"],
    ["option:0", "aria-selected"],
    ["option:1", "aria-selected"],
    ["option:2", "aria-selected"],
    ["option:3", "aria-selected"],
    ["option:4", "aria-selected"],
    ["option:5", "aria-selected"],
  ],
  events: ["onValueChange"],
};
