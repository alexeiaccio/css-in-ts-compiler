import type { ActionStep, Probe, ScenarioConfig, SpecBridge } from "../scenario";
import {
  type KeyModifiers,
  type ListboxMountConfig,
  bit,
  indicesMask,
  indicesOf,
  jsonRecord,
  keyModifiers,
  listboxConfig,
  maskOf,
  optionIndexOf,
  partOf,
  requestedIndices,
  specEvent,
} from "./listbox-shared";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import { Unsupported } from "../scenario";

/** Scenario `config` -> mount config; only the multi-select model is modelled. */
export const listboxMultiConfig = (config: ScenarioConfig): ListboxMountConfig => {
  const mount = listboxConfig(config, "multiple");
  if (mount.selectionMode !== "multiple") {
    throw new Unsupported(`selectionMode ${mount.selectionMode}`);
  }
  return mount;
};

/**
 * Listbox (multi-select) vocabulary <-> `specs/apg/listbox-multi.qnt`. Only the
 * "recommended" interaction model is exercised (the alternative model is a
 * config the walk never selects); config it does not model is `Unsupported`.
 */
const multiKey = (key: string, modifiers: KeyModifiers): ReadonlyArray<QuintEvent> => {
  const { shift, ctrl } = modifiers;
  if (ctrl && shift) {
    if (key === "Home") {
      return [specEvent("ctrl_shift_home")];
    }
    if (key === "End") {
      return [specEvent("ctrl_shift_end")];
    }
  }
  if (ctrl) {
    if (key === "a" || key === "A") {
      return [specEvent("ctrl_a")];
    }
    if (key === "ArrowDown") {
      return [specEvent("ctrl_arrow_down")];
    }
    if (key === "ArrowUp") {
      return [specEvent("ctrl_arrow_up")];
    }
    if (key === " " || key === "Space") {
      return [specEvent("ctrl_space")];
    }
  }
  if (shift) {
    if (key === "ArrowDown") {
      return [specEvent("shift_arrow_down")];
    }
    if (key === "ArrowUp") {
      return [specEvent("shift_arrow_up")];
    }
    if (key === " " || key === "Space") {
      return [specEvent("shift_space")];
    }
  }
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
    case "key": {
      const record = jsonRecord(step.value);
      const key = record["key"];
      if (typeof key !== "string") {
        throw new Unsupported(`prop key ${JSON.stringify(step.value)}`);
      }
      return multiKey(key, keyModifiers(step.value));
    }
    case "selectionModel":
    case "set_selection_model":
      if (step.value !== "recommended") {
        throw new Unsupported(`selectionModel ${JSON.stringify(step.value)}`);
      }
      return [specEvent("set_selection_model", { model: "recommended" })];
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
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

export const listboxMultiBridge: SpecBridge = {
  setup: (config) => {
    const mount = listboxMultiConfig(config);
    const events: QuintEvent[] = [];
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
      return events;
    }
    events.push(specEvent("seed", { v: BigInt(indicesMask(mount.defaultSelected)) }));
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
        return multiKey(step.key ?? "", {
          shift: false,
          ctrl: false,
          meta: false,
          alt: false,
        });
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
        return "true";
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
      : [["onValueChange", requestedIndices(after, 5).map((index) => String(index))] as const],
};

/** The user-level steps a differential walk draws from (recommended model). */
export const listboxMultiSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "focus" },
  { event: "prop", prop: "blur" },
  { event: "prop", prop: "key", value: { key: "ArrowDown" } },
  { event: "prop", prop: "key", value: { key: "ArrowUp" } },
  { event: "prop", prop: "key", value: { key: "Home" } },
  { event: "prop", prop: "key", value: { key: "End" } },
  { event: "prop", prop: "key", value: { key: " " } },
  { event: "prop", prop: "key", value: { key: "ArrowDown", shift: true } },
  { event: "prop", prop: "key", value: { key: "ArrowUp", shift: true } },
  { event: "prop", prop: "key", value: { key: " ", shift: true } },
  { event: "prop", prop: "key", value: { key: "ArrowDown", ctrl: true } },
  { event: "prop", prop: "key", value: { key: " ", ctrl: true } },
  {
    event: "prop",
    prop: "key",
    value: { key: "Home", ctrl: true, shift: true },
  },
  {
    event: "prop",
    prop: "key",
    value: { key: "End", ctrl: true, shift: true },
  },
  { event: "prop", prop: "key", value: { key: "a", ctrl: true } },
  { event: "prop", prop: "setValue", value: [0] },
  { event: "prop", prop: "setValue", value: [1, 3] },
  { event: "prop", prop: "setValue", value: [] },
  { event: "prop", prop: "hostToggle" },
  { event: "click", target: "option:0" },
  { event: "click", target: "option:1" },
  { event: "click", target: "option:2" },
  { event: "click", target: "option:3" },
  { event: "click", target: "option:4" },
];

export const listboxMultiProbe: Probe = {
  attrs: [
    ["listbox", "aria-multiselectable"],
    ["listbox", "aria-activedescendant"],
    ["option:0", "aria-selected"],
    ["option:1", "aria-selected"],
    ["option:2", "aria-selected"],
    ["option:3", "aria-selected"],
    ["option:4", "aria-selected"],
  ],
  events: ["onValueChange"],
};
