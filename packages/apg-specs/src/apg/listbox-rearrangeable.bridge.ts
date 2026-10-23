import type { ActionStep, Probe, ScenarioConfig, SpecBridge } from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import {
  bit,
  indicesMask,
  indicesOf,
  jsonRecord,
  requestedIndices,
  specEvent,
} from "./listbox-shared";
import { Unsupported } from "../scenario";

/**
 * Rearrangeable listbox vocabulary <-> `specs/apg/listbox-rearrangeable.qnt`.
 * Two lists (`listA`, `listB`) share four options; parts are `listA`/`listB`
 * and `optionA:N`/`optionB:N` (N = slot). No ported scenario drives this
 * machine; `packages/headless` walks `createRearrangeableListbox` against it.
 */
export interface RearrangeableConfig {
  readonly items: ReadonlyArray<string>;
  readonly multi: boolean;
  readonly controlled: boolean;
  readonly accepts: boolean;
}

const ITEM_COUNT = 4;
const NO_ITEM = 4;

export const listboxRearrangeableConfig = (config: ScenarioConfig): RearrangeableConfig => {
  const raw = config["items"];
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === "string")) {
    throw new Unsupported(`items ${JSON.stringify(raw)}`);
  }
  if (raw.length !== ITEM_COUNT) {
    throw new Unsupported(`items ${raw.length} (expected ${ITEM_COUNT})`);
  }
  let controlled = false;
  let accepts = false;
  for (const key of Object.keys(config)) {
    if (key === "items" || key === "selectionMode") {
      continue;
    }
    if (key === "multi") {
      continue;
    }
    if (key === "controlled") {
      if (typeof config[key] !== "boolean") {
        throw new Unsupported(`controlled ${JSON.stringify(config[key])}`);
      }
      controlled = config[key] === true;
      accepts = controlled;
      continue;
    }
    if (key === "accepts") {
      if (typeof config[key] !== "boolean") {
        throw new Unsupported(`accepts ${JSON.stringify(config[key])}`);
      }
      controlled = true;
      accepts = config[key] === true;
      continue;
    }
    throw new Unsupported(`config ${key}`);
  }
  return { items: raw, multi: config["multi"] === true, controlled, accepts };
};

const slotAt = (slots: ReadonlyArray<bigint>, index: number): bigint =>
  slots[index] ?? BigInt(NO_ITEM);

const intOf = (state: QuintModelValue, field: string): number => Number(state[field] ?? 0n);

const slotsOf = (state: QuintModelValue, prefix: "a" | "b"): ReadonlyArray<bigint> => {
  const get = (field: string): bigint => {
    const value = state[field];
    return typeof value === "bigint" ? value : BigInt(NO_ITEM);
  };
  return [get(`${prefix}0`), get(`${prefix}1`), get(`${prefix}2`), get(`${prefix}3`)];
};

const posOf = (slots: ReadonlyArray<bigint>, option: number): number =>
  slots.findIndex((slot) => slot === BigInt(option));

const targetSlot = (target: string, prefix: "optionA" | "optionB"): number => {
  const match = new RegExp(`^${prefix}:(\\d+)$`).exec(target);
  if (match?.[1] === undefined) {
    throw new Unsupported(`target ${target}`);
  }
  return Number(match[1]);
};

const propEvents = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "focus":
      return step.value === "b" ? [specEvent("focus_b")] : [specEvent("focus_a")];
    case "blur":
      return [specEvent("blur")];
    case "move":
      return [step.value === "down" ? specEvent("move_down") : specEvent("move_up")];
    case "transfer":
      return [specEvent("transfer")];
    case "multi":
    case "set_multi":
      return [specEvent("set_multi", { flag: step.value === true })];
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
        case "Enter":
        case "Delete":
          return [specEvent("transfer")];
        default:
          throw new Unsupported(`key ${String(key)}`);
      }
    }
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

export const listboxRearrangeableBridge: SpecBridge = {
  setup: (config) => {
    const mount = listboxRearrangeableConfig(config);
    const events: QuintEvent[] = [];
    if (mount.multi) {
      events.push(specEvent("set_multi", { flag: true }));
    }
    if (mount.controlled) {
      events.push(specEvent("control"));
      if (mount.accepts) {
        events.push(specEvent("acceptRequests"));
      }
    }
    return events;
  },
  event: (step) => {
    switch (step.event) {
      case "focus":
        return step.target?.includes("B") === true
          ? [specEvent("focus_b")]
          : [specEvent("focus_a")];
      case "blur":
        return [specEvent("blur")];
      case "key":
        return propEvents({
          event: "prop",
          prop: "key",
          value: { key: step.key ?? "" },
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
  focus: (state: QuintModelValue) => {
    const list = state["focusList"];
    if (list === "a") {
      return "listA";
    }
    if (list === "b") {
      return "listB";
    }
    return null;
  },
  attr: (state: QuintModelValue, target: string, name: string) => {
    if ((target === "listA" || target === "listB") && name === "aria-activedescendant") {
      const which = target === "listA" ? "a" : "b";
      if (state["focusList"] !== which) {
        return null;
      }
      const active = intOf(state, which === "a" ? "activeA" : "activeB");
      if (active === NO_ITEM) {
        return null;
      }
      const slot = posOf(slotsOf(state, which), active);
      return slot < 0 ? null : `option${which.toUpperCase()}:${slot}`;
    }
    if (name === "aria-selected") {
      const prefix = target.startsWith("optionB") ? "b" : "a";
      const slot = targetSlot(target, prefix === "b" ? "optionB" : "optionA");
      const option = slotAt(slotsOf(state, prefix), slot);
      if (option === BigInt(NO_ITEM)) {
        return "false";
      }
      return bit(state["sel"] as bigint, Number(option)) ? "true" : "false";
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [
          [
            "onValueChange",
            requestedIndices(after, ITEM_COUNT).map((index) => String(index)),
          ] as const,
        ],
};

/** The user-level steps a differential walk draws from. */
export const listboxRearrangeableSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "listA:0" },
  { event: "focus", target: "listB:0" },
  // a prop step: a DOM `blur` on one list is a no-op while the other is focused
  { event: "prop", prop: "blur" },
  { event: "prop", prop: "key", value: { key: "ArrowDown" } },
  { event: "prop", prop: "key", value: { key: "ArrowUp" } },
  { event: "prop", prop: "key", value: { key: "Home" } },
  { event: "prop", prop: "key", value: { key: "End" } },
  { event: "prop", prop: "key", value: { key: " " } },
  { event: "prop", prop: "move", value: "up" },
  { event: "prop", prop: "move", value: "down" },
  { event: "prop", prop: "transfer" },
  { event: "prop", prop: "multi", value: true },
  { event: "prop", prop: "multi", value: false },
  { event: "prop", prop: "setValue", value: [0] },
  { event: "prop", prop: "setValue", value: [1, 2] },
  { event: "prop", prop: "setValue", value: [] },
  { event: "prop", prop: "hostToggle" },
];

export const listboxRearrangeableProbe: Probe = {
  attrs: [
    ["listA", "aria-activedescendant"],
    ["listB", "aria-activedescendant"],
    ["optionA:0", "aria-selected"],
    ["optionA:1", "aria-selected"],
    ["optionA:2", "aria-selected"],
    ["optionA:3", "aria-selected"],
    ["optionB:0", "aria-selected"],
    ["optionB:1", "aria-selected"],
    ["optionB:2", "aria-selected"],
    ["optionB:3", "aria-selected"],
  ],
  events: ["onValueChange"],
};
